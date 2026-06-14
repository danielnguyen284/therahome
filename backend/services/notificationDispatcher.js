const { prisma } = require('../config/db');
const {
  seedNotificationTemplates,
  getMergedTemplatesForUser,
  mergeNotificationTemplatesForUser,
} = require('./notificationTemplateService');
const { sendExpoPushNotification, isExpoPushToken, sendWebPushNotification } = require('./pushNotifications');
const {
  VALID_NOTIFICATION_KEYS,
  RECOVERY_DAYS,
  PERSONALIZED_DAYS,
  PERSONALIZED_START_DAY,
  getRecoveryTemplateKey,
  getPersonalizedTemplateKey,
} = require('./notificationCatalog');

const DISPATCH_INTERVAL_MS = Number(process.env.NOTIFICATION_DISPATCH_INTERVAL_MS || 60_000);
const NOTIFICATION_TIMEZONE = process.env.NOTIFICATION_TIMEZONE || 'Asia/Ho_Chi_Minh';

let dispatcherInterval = null;
let isDispatching = false;

function getZonedParts(date, timeZone = NOTIFICATION_TIMEZONE) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(date).reduce((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function getZonedDayNumber(date, timeZone = NOTIFICATION_TIMEZONE) {
  const parts = getZonedParts(date, timeZone);
  return Math.floor(Date.UTC(parts.year, parts.month - 1, parts.day) / 86_400_000);
}

function getZonedDateKey(date, timeZone = NOTIFICATION_TIMEZONE) {
  const { year, month, day } = getZonedParts(date, timeZone);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function diffDaysInTimeZone(later, earlier, timeZone = NOTIFICATION_TIMEZONE) {
  return getZonedDayNumber(later, timeZone) - getZonedDayNumber(earlier, timeZone);
}

function matchesCurrentMinute(template, now, timeZone = NOTIFICATION_TIMEZONE) {
  const parts = getZonedParts(now, timeZone);
  return template.hour === parts.hour && template.minute === parts.minute;
}

function buildMergedTemplates(baseTemplates, overridesByUserId = new Map()) {
  return (user) => mergeNotificationTemplatesForUser({
    templates: baseTemplates,
    overrides: overridesByUserId.get(String(user.id)) || [],
    preferredTime: user?.preferred_time,
  });
}

function resolveDueNotifications({ user, templates, lastWorkoutAt, now }) {
  const templateMap = new Map(templates.map((template) => [template.key, template]));
  const dueNotifications = [];
  const recoveryStartedAt = user.personalized_plan_started_at ? new Date(user.personalized_plan_started_at) : null;
  const recoveryCompletedAt = user.personalized_plan_completed_at ? new Date(user.personalized_plan_completed_at) : null;
  const personalizedUnlockAt = user.personalized_plan_unlock_at ? new Date(user.personalized_plan_unlock_at) : null;

  let dailyTemplate = null;
  if (recoveryStartedAt) {
    const recoveryDayIndex = diffDaysInTimeZone(now, recoveryStartedAt);
    if (recoveryDayIndex >= 0 && recoveryDayIndex < RECOVERY_DAYS) {
      const recoveryTemplate = templateMap.get(
        getRecoveryTemplateKey(recoveryDayIndex + 1),
      );
      if (recoveryTemplate?.is_active) {
        dailyTemplate = recoveryTemplate;
      }
    }

    if (recoveryCompletedAt && personalizedUnlockAt) {
      const personalizedDayIndex = diffDaysInTimeZone(now, personalizedUnlockAt);
      if (personalizedDayIndex >= 0 && personalizedDayIndex < PERSONALIZED_DAYS) {
        const personalizedTemplate = templateMap.get(
          getPersonalizedTemplateKey(PERSONALIZED_START_DAY + personalizedDayIndex),
        );
        if (personalizedTemplate?.is_active) {
          dailyTemplate = personalizedTemplate;
        }
      }
    }
  }

  if (dailyTemplate && matchesCurrentMinute(dailyTemplate, now)) {
    dueNotifications.push({
      key: dailyTemplate.key,
      title: dailyTemplate.title,
      body: dailyTemplate.body,
      deliverySlot: `${dailyTemplate.key}:${getZonedDateKey(now)}`,
    });
  }

  const inactivityBaseDate = lastWorkoutAt || recoveryStartedAt;
  if (!inactivityBaseDate) {
    return dueNotifications;
  }

  const inactivityMessages = [
    { key: 'message_3', threshold: 3 },
    { key: 'message_5', threshold: 5 },
    { key: 'message_7', threshold: 7 },
  ];
  const daysSinceBase = diffDaysInTimeZone(now, inactivityBaseDate);

  inactivityMessages.forEach(({ key, threshold }) => {
    const template = templateMap.get(key);
    if (!template?.is_active) {
      return;
    }

    if (daysSinceBase !== threshold || !matchesCurrentMinute(template, now)) {
      return;
    }

    dueNotifications.push({
      key,
      title: template.title,
      body: template.body,
      deliverySlot: `${key}:${getZonedDateKey(now)}`,
    });
  });

  return dueNotifications;
}

async function createPendingDispatchLog(notification, userId) {
  try {
    return await prisma.notificationDispatchLog.create({
      data: {
        user_id: userId,
        key: notification.key,
        delivery_slot: notification.deliverySlot,
        title: notification.title,
        body: notification.body,
        status: 'pending',
      },
    });
  } catch (error) {
    if (error?.code === 'P2002') {
      const existing = await prisma.notificationDispatchLog.findUnique({
        where: {
          user_id_key_delivery_slot: {
            user_id: userId,
            key: notification.key,
            delivery_slot: notification.deliverySlot,
          },
        },
      });

      if (!existing || existing.status === 'sent') {
        return null;
      }

      return await prisma.notificationDispatchLog.update({
        where: { id: existing.id },
        data: {
          status: 'pending',
          error_message: '',
          updated_at: new Date(),
        },
      });
    }
    throw error;
  }
}

async function sendNotificationToUser({ userId, email, tokenDoc, notification }) {
  const log = await createPendingDispatchLog(notification, userId);
  if (!log) {
    return { skipped: true, reason: 'already_sent' };
  }

  try {
    let result;
    if (isExpoPushToken(tokenDoc.token)) {
      result = await sendExpoPushNotification({
        token: tokenDoc.token,
        title: notification.title,
        body: notification.body,
        data: {
          url: '/notifications',
          notification_key: notification.key,
          user_id: String(userId),
        },
      });
    } else {
      result = await sendWebPushNotification({
        subscription: tokenDoc.token,
        title: notification.title,
        body: notification.body,
        data: {
          url: '/notifications',
          notification_key: notification.key,
          user_id: String(userId),
        },
      });
    }

    await prisma.notificationDispatchLog.update({
      where: { id: log.id },
      data: {
        status: 'sent',
        sent_at: new Date(),
        expo_ticket_id: result.ticketId,
        updated_at: new Date(),
      },
    });

    return {
      skipped: false,
      sent: true,
      ticketId: result.ticketId,
    };
  } catch (error) {
    await prisma.notificationDispatchLog.update({
      where: { id: log.id },
      data: {
        status: 'failed',
        error_message: error.message || 'Gửi push thất bại',
        updated_at: new Date(),
      },
    });

    if (String(error.message || '').includes('DeviceNotRegistered')) {
      await prisma.notificationToken.delete({
        where: { id: tokenDoc.id },
      });
    }

    console.error(`Notification dispatch failed for ${email} / ${notification.key}:`, error.message);
    throw error;
  }
}

async function dispatchNotificationsOnce() {
  if (isDispatching) {
    return {
      skipped: true,
      reason: 'dispatcher_busy',
    };
  }

  isDispatching = true;

  try {
    await seedNotificationTemplates();

    const users = await prisma.user.findMany({
      where: {
        role: { not: 'admin' },
        notifications_enabled: { not: false },
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        notifications_enabled: true,
        personalized_plan_started_at: true,
        personalized_plan_completed_at: true,
        personalized_plan_unlock_at: true,
        preferred_time: true,
      },
    });

    if (users.length === 0) {
      return {
        checkedUsers: 0,
        sentCount: 0,
        skippedNoToken: 0,
        dueCount: 0,
      };
    }

    const userIds = users.map((user) => user.id);
    const [tokens, lastWorkouts, baseTemplates, overrides] = await Promise.all([
      prisma.notificationToken.findMany({
        where: { user_id: { in: userIds } },
        select: { id: true, user_id: true, token: true, platform: true },
      }),
      prisma.$queryRaw`
        SELECT DISTINCT ON (user_id) user_id, completed_at
        FROM workout_logs
        WHERE is_completed = true AND user_id::text = ANY(${userIds})
        ORDER BY user_id, completed_at DESC
      `,
      prisma.notificationTemplate.findMany({
        where: { key: { in: VALID_NOTIFICATION_KEYS } },
        orderBy: { key: 'asc' },
      }),
      prisma.notificationUserOverride.findMany({
        where: { user_id: { in: userIds }, key: { in: VALID_NOTIFICATION_KEYS } },
      }),
    ]);

    const tokenMap = new Map(tokens.map((tokenDoc) => [String(tokenDoc.user_id), tokenDoc]));
    const lastWorkoutMap = new Map(lastWorkouts.map((item) => [String(item.user_id), item.completed_at || null]));
    const overridesByUserId = new Map();
    overrides.forEach((override) => {
      const userId = String(override.user_id);
      const items = overridesByUserId.get(userId) || [];
      items.push(override);
      overridesByUserId.set(userId, items);
    });
    const getTemplatesForUser = buildMergedTemplates(baseTemplates, overridesByUserId);

    const summary = {
      checkedUsers: users.length,
      sentCount: 0,
      skippedNoToken: 0,
      dueCount: 0,
      failedCount: 0,
    };
    const now = new Date();

    for (const user of users) {
      const tokenDoc = tokenMap.get(String(user.id));
      if (!tokenDoc) {
        summary.skippedNoToken += 1;
        continue;
      }

      const templates = getTemplatesForUser(user);
      const lastWorkoutAt = lastWorkoutMap.get(String(user.id)) || null;
      const dueNotifications = resolveDueNotifications({
        user,
        templates,
        lastWorkoutAt,
        now,
      });

      summary.dueCount += dueNotifications.length;

      for (const notification of dueNotifications) {
        try {
          const result = await sendNotificationToUser({
            userId: user.id,
            email: user.email,
            tokenDoc,
            notification,
          });
          if (!result.skipped) {
            summary.sentCount += 1;
          }
        } catch (error) {
          summary.failedCount += 1;
        }
      }
    }

    return summary;
  } finally {
    isDispatching = false;
  }
}

async function sendPreviewNotificationsToUser(userId, keys = VALID_NOTIFICATION_KEYS) {
  await seedNotificationTemplates();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });
  if (!user || user.role === 'admin') {
    throw new Error('Không tìm thấy user hợp lệ để test thông báo');
  }

  const tokenDoc = await prisma.notificationToken.findUnique({
    where: { user_id: userId },
    select: { id: true, token: true, platform: true },
  });
  if (!tokenDoc) {
    throw new Error('User chưa có push token hợp lệ');
  }

  const templates = await getMergedTemplatesForUser(userId);
  const normalizedKeys = Array.isArray(keys) && keys.length > 0 ? keys : VALID_NOTIFICATION_KEYS;
  const notifications = templates
    .filter((template) => normalizedKeys.includes(template.key) && template.is_active)
    .map((template) => ({
      key: template.key,
      title: `[Preview] ${template.title}`,
      body: template.body,
      deliverySlot: `preview:${template.key}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    }));

  if (notifications.length === 0) {
    return {
      sentCount: 0,
      notifications: [],
    };
  }

  const sentKeys = [];

  for (const notification of notifications) {
    await sendNotificationToUser({
      userId,
      email: user.email,
      tokenDoc,
      notification,
    });
    sentKeys.push(notification.key);
  }

  return {
    sentCount: sentKeys.length,
    notifications: sentKeys,
  };
}

function startNotificationDispatcher() {
  if (dispatcherInterval) {
    return;
  }

  void dispatchNotificationsOnce()
    .then((summary) => {
      console.log('Notification dispatcher boot run:', summary);
    })
    .catch((error) => {
      console.error('Notification dispatcher boot error:', error);
    });

  dispatcherInterval = setInterval(() => {
    void dispatchNotificationsOnce()
      .then((summary) => {
        if (summary.sentCount || summary.failedCount || summary.dueCount) {
          console.log('Notification dispatcher tick:', summary);
        }
      })
      .catch((error) => {
        console.error('Notification dispatcher tick error:', error);
      });
  }, DISPATCH_INTERVAL_MS);

  console.log(
    `Notification dispatcher started: every ${DISPATCH_INTERVAL_MS}ms (${NOTIFICATION_TIMEZONE})`,
  );
}

module.exports = {
  dispatchNotificationsOnce,
  startNotificationDispatcher,
  resolveDueNotifications,
  getZonedDateKey,
  sendPreviewNotificationsToUser,
};
