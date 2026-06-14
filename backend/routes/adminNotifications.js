const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  createBroadcastMessage,
  listBroadcastMessages,
  listEligibleNotificationUsers,
} = require('../services/notificationBroadcastService');

router.get('/eligible-users', protect, adminOnly, async (req, res) => {
  try {
    const users = await listEligibleNotificationUsers({
      search: req.query.search,
      limit: req.query.limit,
    });
    res.json(users);
  } catch (error) {
    console.error('List notification eligible users error:', error);
    res.status(500).json({ error: 'Không thể tải danh sách người dùng' });
  }
});

router.get('/broadcasts', protect, adminOnly, async (req, res) => {
  try {
    const broadcasts = await listBroadcastMessages(req.query.limit);
    res.json(broadcasts);
  } catch (error) {
    console.error('List notification broadcasts error:', error);
    res.status(500).json({ error: 'Không thể tải lịch sử gửi tin nhắn' });
  }
});

router.post('/broadcast', protect, adminOnly, async (req, res) => {
  try {
    const broadcast = await createBroadcastMessage({
      adminId: req.user.id,
      title: req.body?.title,
      body: req.body?.body,
      url: req.body?.url,
      targetType: req.body?.target_type,
      userIds: req.body?.user_ids,
    });
    res.status(201).json(broadcast);
  } catch (error) {
    console.error('Create notification broadcast error:', error);
    res.status(400).json({ error: error.message || 'Không thể gửi tin nhắn' });
  }
});

module.exports = router;
