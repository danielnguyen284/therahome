const express = require('express');
const router = express.Router();
const { prisma } = require('../config/db');
const { protect, adminOnly } = require('../middleware/auth');
const { formatUser } = require('../middleware/auth');
const { getMergedTemplatesForUser } = require('../services/notificationTemplateService');
const { dispatchNotificationsOnce } = require('../services/notificationDispatcher');
const { getPreferredTimeLabel } = require('../services/userNotificationPreferences');
const { VALID_NOTIFICATION_KEYS } = require('../services/notificationCatalog');

// GET /api/users/stats - Dashboard stats (admin)
// CRITICAL: This route MUST come before /:id to prevent Express treating 'stats' as an ID
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const [totalUsers, totalExercises] = await Promise.all([
      prisma.user.count(),
      prisma.exercise.count(),
    ]);

    const today = new Date().toISOString().split('T')[0];
    const todayWorkouts = await prisma.workoutLog.count({
      where: {
        completed_at: { gte: new Date(today) },
      },
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsersResult = await prisma.workoutLog.findMany({
      where: {
        completed_at: { gte: sevenDaysAgo },
      },
      distinct: ['user_id'],
      select: { user_id: true },
    });

    res.json({
      totalUsers,
      totalExercises,
      todayWorkouts,
      activeUsers: activeUsersResult.length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /api/users - Get all users (admin)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        user_devices: {
          include: { product: true },
        },
      },
    });
    res.json(users.map(formatUser));
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /api/users/notification-overview - Notification status by user (admin)
router.get('/notification-overview', protect, adminOnly, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: { not: 'admin' } },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        full_name: true,
        email: true,
        is_pro: true,
        notifications_enabled: true,
        created_at: true,
      },
    });

    const userIds = users.map(u => u.id);

    const [tokens, lastWorkoutsRaw] = await Promise.all([
      prisma.notificationToken.findMany({
        where: { user_id: { in: userIds } },
        select: { user_id: true, platform: true, created_at: true },
      }),
      prisma.workoutLog.groupBy({
        by: ['user_id'],
        where: {
          user_id: { in: userIds },
          is_completed: true,
        },
        _max: { completed_at: true },
      }),
    ]);

    const tokenMap = new Map();
    tokens.forEach(tokenDoc => {
      const current = tokenMap.get(tokenDoc.user_id) || {
        has_push_token: false,
        token_platforms: new Set(),
        token_updated_at: null,
      };
      current.has_push_token = true;
      current.token_platforms.add(tokenDoc.platform);
      current.token_updated_at = tokenDoc.created_at;
      tokenMap.set(tokenDoc.user_id, current);
    });

    const workoutMap = new Map(
      lastWorkoutsRaw.map(item => [item.user_id, item._max.completed_at || null]),
    );

    const overview = users.map(user => {
      const tokenInfo = tokenMap.get(user.id);
      return {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        is_pro: user.is_pro,
        notifications_enabled: user.notifications_enabled !== false,
        has_push_token: !!tokenInfo?.has_push_token,
        token_platforms: tokenInfo ? Array.from(tokenInfo.token_platforms) : [],
        token_updated_at: tokenInfo?.token_updated_at || null,
        last_workout_at: workoutMap.get(user.id) || null,
        created_at: user.created_at,
      };
    });

    res.json(overview);
  } catch (error) {
    console.error('Notification overview error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/users/notifications/dispatch-now - Run notification dispatcher immediately (admin)
router.post('/notifications/dispatch-now', protect, adminOnly, async (req, res) => {
  try {
    const summary = await dispatchNotificationsOnce();
    res.json(summary);
  } catch (error) {
    console.error('Manual notification dispatch error:', error);
    res.status(500).json({ error: 'Không thể chạy bộ gửi thông báo' });
  }
});

// GET /api/users/:id/notification-overrides - Get merged notification config for a user (admin)
router.get('/:id/notification-overrides', protect, adminOnly, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, full_name: true, email: true, role: true, preferred_time: true },
    });
    if (!user || user.role === 'admin') {
      return res.status(404).json({ error: 'Không tìm thấy user' });
    }

    const templates = await getMergedTemplatesForUser(req.params.id);
    res.json({
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        preferred_time: user.preferred_time || '20:00',
        preferred_time_label: getPreferredTimeLabel(user.preferred_time),
      },
      templates,
    });
  } catch (error) {
    console.error('Get user notification overrides error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /api/users/:id/notification-overrides/:key - Save override for a user (admin)
router.put('/:id/notification-overrides/:key', protect, adminOnly, async (req, res) => {
  try {
    const { id, key } = req.params;
    const { title, body, hour, minute, is_active } = req.body;

    if (!VALID_NOTIFICATION_KEYS.includes(key)) {
      return res.status(400).json({ error: 'Key không hợp lệ' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });
    if (!user || user.role === 'admin') {
      return res.status(404).json({ error: 'Không tìm thấy user' });
    }

    const baseTemplate = await prisma.notificationTemplate.findUnique({
      where: { key },
    });
    if (!baseTemplate) {
      return res.status(404).json({ error: 'Template không tồn tại' });
    }

    const payload = {
      user_id: id,
      key,
      title: title?.trim() || baseTemplate.title,
      body: body?.trim() || baseTemplate.body,
      hour: hour !== undefined ? Math.max(0, Math.min(23, Number(hour))) : baseTemplate.hour,
      minute: minute !== undefined ? Math.max(0, Math.min(59, Number(minute))) : baseTemplate.minute,
      is_active: typeof is_active === 'boolean' ? is_active : baseTemplate.is_active,
    };

    const override = await prisma.notificationUserOverride.upsert({
      where: { user_id_key: { user_id: id, key } },
      update: payload,
      create: payload,
    });

    res.json(override);
  } catch (error) {
    console.error('Save user notification override error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// DELETE /api/users/:id/notification-overrides/:key - Reset user override to global template (admin)
router.delete('/:id/notification-overrides/:key', protect, adminOnly, async (req, res) => {
  try {
    const { id, key } = req.params;

    if (!VALID_NOTIFICATION_KEYS.includes(key)) {
      return res.status(400).json({ error: 'Key không hợp lệ' });
    }

    await prisma.notificationUserOverride.deleteMany({
      where: { user_id: id, key },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Reset user notification override error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /api/users/:id/notifications - Update notification status for a user (admin)
router.put('/:id/notifications', protect, adminOnly, async (req, res) => {
  try {
    const { notifications_enabled } = req.body;

    if (typeof notifications_enabled !== 'boolean') {
      return res.status(400).json({ error: 'notifications_enabled phải là boolean' });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { notifications_enabled },
      select: { id: true, full_name: true, email: true, notifications_enabled: true },
    });

    res.json(user);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy user' });
    console.error('Update user notification status error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /api/users/:id/devices - Update user devices (admin) - now uses UserDevice table
router.put('/:id/devices', protect, adminOnly, async (req, res) => {
  try {
    // This endpoint is kept for backward compatibility
    // The actual device management happens through the codes/activate route
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        user_devices: { include: { product: true } },
      },
    });
    if (!user) return res.status(404).json({ error: 'Không tìm thấy user' });
    res.json(formatUser(user));
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
