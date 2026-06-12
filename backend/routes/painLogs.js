const express = require('express');
const router = express.Router();
const { prisma } = require('../config/db');
const { protect } = require('../middleware/auth');

// GET /api/pain-logs - Get pain logs for user
router.get('/', protect, async (req, res) => {
  try {
    const { days, date } = req.query;
    const where = { user_id: req.user.id };

    if (date) {
      where.date = date;
    } else if (days) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      where.date = { gte: startDate.toISOString().split('T')[0] };
    }

    const logs = await prisma.painLog.findMany({
      where,
      orderBy: { date: 'desc' },
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /api/pain-logs/today
router.get('/today', protect, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const log = await prisma.painLog.findUnique({
      where: { user_id_date: { user_id: req.user.id, date: today } },
    });
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/pain-logs - Create or update pain log (upsert by user_id + date)
router.post('/', protect, async (req, res) => {
  try {
    const { date, pain_areas, pain_level, notes } = req.body;
    const log = await prisma.painLog.upsert({
      where: { user_id_date: { user_id: req.user.id, date } },
      update: { pain_areas, pain_level, notes },
      create: {
        user_id: req.user.id,
        date,
        pain_areas: pain_areas || {},
        pain_level: pain_level || 0,
        notes: notes || '',
      },
    });
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /api/pain-logs/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const existing = await prisma.painLog.findFirst({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy' });

    const log = await prisma.painLog.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
