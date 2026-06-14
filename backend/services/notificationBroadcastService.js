const { prisma } = require('../config/db');
const {
  sendExpoPushNotification,
  isExpoPushToken,
  sendWebPushNotification,
} = require('./pushNotifications');

const BROADCAST_KEY = 'broadcast';

function normalizeInternalUrl(value) {
  if (typeof value !== 'string') return '/notifications';
  const trimmed = value.trim();
  if (!trimmed) return '/notifications';
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return '/notifications';
  return trimmed;
}

function validateBroadcastPayload({ title, body, target_type, user_ids }) {
  const normalizedTitle = typeof title === 'string' ? title.trim() : '';
  const normalizedBody = typeof body === 'string' ? body.trim() : '';

  if (!normalizedTitle || normalizedTitle.length > 120) {
    throw new Error('Tiêu đề phải từ 1 đến 120 ký tự');
  }

  if (!normalizedBody || normalizedBody.length > 500) {
    throw new Error('Nội dung phải từ 1 đến 500 ký tự');
  }

  if (!['all', 'selected'].includes(target_type)) {
    throw new Error('Kiểu người nhận không hợp lệ');
  }

  if (target_type === 'selected' && (!Array.isArray(user_ids) || user_ids.length === 0)) {
    throw new Error('Vui lòng chọn ít nhất 1 người dùng');
  }

  return {
    title: normalizedTitle,
    body: normalizedBody,
  };
}

function isInvalidPushTokenError(error) {
  const message = String(error?.message || '');
  return (
    message.includes('DeviceNotRegistered')
    || error?.statusCode === 404
    || error?.statusCode === 410
    || error?.body?.error === 'Not Found'
  );
}

async function sendPushForToken({ tokenDoc, title, body, url, userId, broadcastId }) {
  const data = {
    url,
    notification_key: BROADCAST_KEY,
    broadcast_id: String(broadcastId),
    user_id: String(userId),
  };

  if (isExpoPushToken(tokenDoc.token)) {
    return sendExpoPushNotification({
      token: tokenDoc.token,
      title,
      body,
      data,
    });
  }

  return sendWebPushNotification({
    subscription: tokenDoc.token,
    title,
    body,
    data,
  });
}

async function resolveBroadcastTargets({ targetType, userIds }) {
  const where = {
    role: { not: 'admin' },
  };

  if (targetType === 'selected') {
    where.id = { in: [...new Set(userIds)] };
  }

  return prisma.user.findMany({
    where,
    select: {
      id: true,
      full_name: true,
      email: true,
      notifications_enabled: true,
    },
    orderBy: { created_at: 'desc' },
  });
}

async function createBroadcastMessage({ adminId, title, body, url, targetType, userIds }) {
  const normalized = validateBroadcastPayload({
    title,
    body,
    target_type: targetType,
    user_ids: userIds,
  });
  const normalizedUrl = normalizeInternalUrl(url);

  const targets = await resolveBroadcastTargets({ targetType, userIds });
  if (targets.length === 0) {
    throw new Error('Không tìm thấy người dùng phù hợp để gửi');
  }

  const broadcast = await prisma.notificationBroadcast.create({
    data: {
      title: normalized.title,
      body: normalized.body,
      url: normalizedUrl,
      target_type: targetType,
      target_count: targets.length,
      created_by: adminId,
    },
  });

  const deliverySlot = `broadcast:${broadcast.id}`;
  const now = new Date();

  await prisma.notificationDispatchLog.createMany({
    data: targets.map((user) => ({
      user_id: user.id,
      broadcast_id: broadcast.id,
      key: BROADCAST_KEY,
      delivery_slot: deliverySlot,
      title: normalized.title,
      body: normalized.body,
      status: 'sent',
      sent_at: now,
    })),
    skipDuplicates: true,
  });

  const tokens = await prisma.notificationToken.findMany({
    where: {
      user_id: { in: targets.map((user) => user.id) },
    },
    select: { id: true, user_id: true, token: true, platform: true },
  });
  const tokenMap = new Map(tokens.map((tokenDoc) => [String(tokenDoc.user_id), tokenDoc]));

  let sentCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  for (const user of targets) {
    const tokenDoc = tokenMap.get(String(user.id));
    if (user.notifications_enabled === false || !tokenDoc) {
      skippedCount += 1;
      continue;
    }

    try {
      await sendPushForToken({
        tokenDoc,
        title: normalized.title,
        body: normalized.body,
        url: normalizedUrl,
        userId: user.id,
        broadcastId: broadcast.id,
      });
      sentCount += 1;
    } catch (error) {
      failedCount += 1;
      if (isInvalidPushTokenError(error)) {
        await prisma.notificationToken.delete({ where: { id: tokenDoc.id } }).catch(() => {});
      }
      console.error(`Broadcast push failed for ${user.email}:`, error.message);
    }
  }

  return prisma.notificationBroadcast.update({
    where: { id: broadcast.id },
    data: {
      inbox_count: targets.length,
      sent_count: sentCount,
      failed_count: failedCount,
      skipped_count: skippedCount,
    },
  });
}

async function listBroadcastMessages(limit = 30) {
  return prisma.notificationBroadcast.findMany({
    orderBy: { created_at: 'desc' },
    take: Math.min(Math.max(Number(limit) || 30, 1), 100),
    include: {
      creator: {
        select: {
          id: true,
          full_name: true,
          email: true,
        },
      },
    },
  });
}

async function listEligibleNotificationUsers({ search = '', limit = 50 }) {
  const normalizedSearch = String(search || '').trim();
  const take = Math.min(Math.max(Number(limit) || 50, 1), 100);

  const users = await prisma.user.findMany({
    where: {
      role: { not: 'admin' },
      ...(normalizedSearch
        ? {
            OR: [
              { full_name: { contains: normalizedSearch, mode: 'insensitive' } },
              { email: { contains: normalizedSearch, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { created_at: 'desc' },
    take,
    select: {
      id: true,
      full_name: true,
      email: true,
      is_pro: true,
      notifications_enabled: true,
      created_at: true,
    },
  });

  const tokens = await prisma.notificationToken.findMany({
    where: { user_id: { in: users.map((user) => user.id) } },
    select: { user_id: true, platform: true, created_at: true },
  });
  const tokenMap = new Map(tokens.map((token) => [String(token.user_id), token]));

  return users.map((user) => {
    const token = tokenMap.get(String(user.id));
    return {
      ...user,
      has_push_token: !!token,
      token_platform: token?.platform || '',
      token_updated_at: token?.created_at || null,
    };
  });
}

module.exports = {
  createBroadcastMessage,
  listBroadcastMessages,
  listEligibleNotificationUsers,
};
