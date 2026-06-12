const express = require('express');
const router = express.Router();
const { prisma } = require('../config/db');
const { protect, adminOnly } = require('../middleware/auth');
const {
  getMergedTemplatesForUser,
} = require('../services/notificationTemplateService');
const { VALID_NOTIFICATION_KEYS, sortNotificationTemplates } = require('../services/notificationCatalog');

// === PUBLIC: Get all templates (for mobile app) ===
router.get('/', protect, async (req, res) => {
  try {
    const templates = await getMergedTemplatesForUser(req.user.id);
    res.json(templates);
  } catch (error) {
    console.error('Get notification templates error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// === PUBLIC: Get last workout date for current user ===
router.get('/last-workout', protect, async (req, res) => {
  try {
    const lastWorkout = await prisma.workoutLog.findFirst({
      where: {
        user_id: req.user.id,
        is_completed: true,
      },
      orderBy: { completed_at: 'desc' },
      select: { completed_at: true },
    });

    res.json({
      last_workout_at: lastWorkout?.completed_at || null,
    });
  } catch (error) {
    console.error('Get last workout error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// === ADMIN: Get base templates for all users ===
router.get('/admin', protect, adminOnly, async (req, res) => {
  try {
    const templates = await prisma.notificationTemplate.findMany({
      where: { key: { in: VALID_NOTIFICATION_KEYS } },
    });
    res.json(sortNotificationTemplates(templates));
  } catch (error) {
    console.error('Get admin notification templates error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// === ADMIN: Update a template ===
router.put('/:key', protect, adminOnly, async (req, res) => {
  try {
    const { key } = req.params;
    const { title, body, hour, minute, is_active } = req.body;

    if (!VALID_NOTIFICATION_KEYS.includes(key)) {
      return res.status(400).json({ error: 'Key không hợp lệ' });
    }

    const update = {};
    if (title !== undefined) update.title = title;
    if (body !== undefined) update.body = body;
    if (hour !== undefined) update.hour = Math.max(0, Math.min(23, Number(hour)));
    if (minute !== undefined) update.minute = Math.max(0, Math.min(59, Number(minute)));
    if (is_active !== undefined) update.is_active = is_active;

    const template = await prisma.notificationTemplate.update({
      where: { key },
      data: update,
    });

    res.json(template);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Template không tồn tại' });
    }
    console.error('Update notification template error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
