const express = require('express');
const router = express.Router();
const { prisma } = require('../config/db');
const { protect } = require('../middleware/auth');
const { sendPreviewNotificationsToUser } = require('../services/notificationDispatcher');

function serializeNotification(notification) {
  if (!notification) return null;
  return {
    id: notification.id,
    key: notification.key,
    title: notification.title,
    body: notification.body,
    sent_at: notification.sent_at || null,
    created_at: notification.created_at,
    is_read: notification.is_read === true,
    read_at: notification.read_at || null,
  };
}

// === Workout Feedback ===
router.post('/workout-feedback', protect, async (req, res) => {
  try {
    const { workout_log_id, feeling, skip_reason, comment } = req.body;
    const feedback = await prisma.workoutFeedback.create({
      data: {
        user_id: req.user.id,
        workout_log_id,
        feeling: feeling || null,
        skip_reason: skip_reason || null,
        comment: comment || '',
      },
    });
    res.status(201).json(feedback);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

router.get('/workout-feedback', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const feedbacks = await prisma.workoutFeedback.findMany({
      where: { user_id: req.user.id },
      include: {
        workout_log: {
          include: { exercise: true },
        },
      },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// === Chat History ===
router.get('/chat-history', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const messages = await prisma.chatHistory.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

router.post('/chat-history', protect, async (req, res) => {
  try {
    const { message: msg, role } = req.body;
    const chatMessage = await prisma.chatHistory.create({
      data: {
        user_id: req.user.id,
        message: msg,
        role,
      },
    });
    res.status(201).json(chatMessage);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

router.delete('/chat-history', protect, async (req, res) => {
  try {
    await prisma.chatHistory.deleteMany({ where: { user_id: req.user.id } });
    res.json({ message: 'Đã xóa lịch sử chat' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// === Daily Recommendations ===
router.get('/daily-recommendations', protect, async (req, res) => {
  try {
    const { date } = req.query;
    const where = { user_id: req.user.id };
    if (date) where.date = date;

    const recs = await prisma.dailyRecommendation.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 7,
    });
    res.json(recs);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

router.post('/daily-recommendations', protect, async (req, res) => {
  try {
    const { date, nutrition_advice, sport_advice, device_level, device_duration } = req.body;
    const rec = await prisma.dailyRecommendation.upsert({
      where: { user_id_date: { user_id: req.user.id, date } },
      update: { nutrition_advice, sport_advice, device_level, device_duration },
      create: {
        user_id: req.user.id,
        date,
        nutrition_advice: nutrition_advice || '',
        sport_advice: sport_advice || '',
        device_level: device_level || null,
        device_duration: device_duration || null,
      },
    });
    res.json(rec);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// === Device Usage Logs ===
router.post('/device-usage', protect, async (req, res) => {
  try {
    const { pain_log_id, device_level, duration_minutes, started_at, completed_at } = req.body;
    const log = await prisma.deviceUsageLog.create({
      data: {
        user_id: req.user.id,
        pain_log_id: pain_log_id || null,
        device_level,
        duration_minutes,
        started_at: new Date(started_at),
        completed_at: completed_at ? new Date(completed_at) : null,
      },
    });
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

router.get('/device-usage', protect, async (req, res) => {
  try {
    const logs = await prisma.deviceUsageLog.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' },
      take: 30,
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// === Health Tips (unified Tip table, type="health") ===
router.get('/health-tips', protect, async (req, res) => {
  try {
    const { category, limit } = req.query;
    const where = { type: 'health' };
    if (category) where.category = category;

    const tips = await prisma.tip.findMany({
      where,
      take: limit ? parseInt(limit) : undefined,
    });
    res.json(tips);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// === Nutrition Tips (unified Tip table, type="nutrition") ===
router.get('/nutrition-tips', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const tips = await prisma.tip.findMany({
      where: { type: 'nutrition' },
      take: limit,
    });
    res.json(tips);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// === Notification Tokens ===
router.post('/notification-token', protect, async (req, res) => {
  try {
    const { token, platform } = req.body;
    const result = await prisma.notificationToken.upsert({
      where: { user_id: req.user.id },
      update: { token, platform },
      create: { user_id: req.user.id, token, platform },
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// === Notification Inbox ===
router.get('/notifications', protect, async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 100);
    const notifications = await prisma.notificationDispatchLog.findMany({
      where: {
        user_id: req.user.id,
        status: 'sent',
      },
      orderBy: [{ sent_at: 'desc' }, { created_at: 'desc' }],
      take: limit,
      select: {
        id: true, key: true, title: true, body: true,
        sent_at: true, created_at: true, is_read: true, read_at: true,
      },
    });

    const unread_count = await prisma.notificationDispatchLog.count({
      where: {
        user_id: req.user.id,
        status: 'sent',
        is_read: false,
      },
    });

    res.json({
      unread_count,
      items: notifications.map(serializeNotification),
    });
  } catch (error) {
    console.error('Get notifications inbox error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

router.put('/notifications/:id/read', protect, async (req, res) => {
  try {
    const existing = await prisma.notificationDispatchLog.findFirst({
      where: {
        id: req.params.id,
        user_id: req.user.id,
        status: 'sent',
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy thông báo' });
    }

    const notification = await prisma.notificationDispatchLog.update({
      where: { id: req.params.id },
      data: { is_read: true, read_at: new Date() },
      select: {
        id: true, key: true, title: true, body: true,
        sent_at: true, created_at: true, is_read: true, read_at: true,
      },
    });

    res.json(serializeNotification(notification));
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

router.put('/notifications/read-all', protect, async (req, res) => {
  try {
    await prisma.notificationDispatchLog.updateMany({
      where: {
        user_id: req.user.id,
        status: 'sent',
        is_read: false,
      },
      data: { is_read: true, read_at: new Date() },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

router.post('/notifications/preview', protect, async (req, res) => {
  try {
    const keys = Array.isArray(req.body?.keys) ? req.body.keys : undefined;
    const result = await sendPreviewNotificationsToUser(req.user.id, keys);
    res.json(result);
  } catch (error) {
    console.error('Preview notifications error:', error);
    res.status(400).json({ error: error.message || 'Không thể preview thông báo' });
  }
});

// GET /api/notifications/vapid-public-key - Get VAPID public key
router.get('/notifications/vapid-public-key', async (req, res) => {
  try {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 'BGMqDN9r279uLSeCmQ2jqvnJ9jkx6w7OgtstN-jPAILIe1zQVdO8DCMAvjim6UKSoqAcw57wUOsLoAW1LvPcNqM';
    res.json({ publicKey: vapidPublicKey });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
