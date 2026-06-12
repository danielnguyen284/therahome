const express = require('express');
const router = express.Router();
const { prisma } = require('../config/db');
const { protect, adminOnly } = require('../middleware/auth');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUUID = (id) => UUID_REGEX.test(id);

const buildPayload = (body = {}) => ({
  workout_plan_id: body.workout_plan_id,
  order: Number(body.order),
  link: typeof body.link === 'string' ? body.link.trim() : '',
});

const validatePayload = async (payload) => {
  if (!payload.workout_plan_id || !isValidUUID(payload.workout_plan_id)) {
    return 'workout_plan_id không hợp lệ';
  }
  if (!Number.isInteger(payload.order) || payload.order < 1 || payload.order > 365) {
    return 'order phải là số nguyên từ 1 đến 365';
  }
  if (!payload.link) {
    return 'Thiếu link video';
  }
  const plan = await prisma.workoutPlan.findUnique({
    where: { id: payload.workout_plan_id },
    select: { id: true },
  });
  if (!plan) {
    return 'Không tìm thấy workout plan';
  }
  return null;
};

// GET /api/videos?planId=<workout_plan_id>
router.get('/', protect, async (req, res) => {
  try {
    const where = {};
    if (req.query.planId && isValidUUID(req.query.planId)) {
      where.workout_plan_id = req.query.planId;
    }

    const items = await prisma.video.findMany({
      where,
      include: {
        workout_plan: {
          select: { title: true, target_area: true, duration_days: true },
        },
      },
      orderBy: [{ workout_plan_id: 'asc' }, { order: 'asc' }],
    });
    res.json(items);
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /api/videos/resolve?planId=<id>&order=<day>
router.get('/resolve', protect, async (req, res) => {
  try {
    const { planId, order } = req.query;
    const day = Number(order);

    if (!planId || !isValidUUID(planId)) {
      return res.status(400).json({ error: 'planId không hợp lệ' });
    }
    if (!Number.isInteger(day) || day < 1) {
      return res.status(400).json({ error: 'order không hợp lệ' });
    }

    const item = await prisma.video.findUnique({
      where: { workout_plan_id_order: { workout_plan_id: planId, order: day } },
      include: {
        workout_plan: {
          select: { title: true, target_area: true, duration_days: true },
        },
      },
    });
    res.json(item || null);
  } catch (error) {
    console.error('Resolve video error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /api/videos/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const item = await prisma.video.findUnique({
      where: { id: req.params.id },
      include: {
        workout_plan: {
          select: { title: true, target_area: true, duration_days: true },
        },
      },
    });
    if (!item) return res.status(404).json({ error: 'Không tìm thấy video' });
    res.json(item);
  } catch (error) {
    console.error('Get video detail error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/videos
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const payload = buildPayload(req.body);
    const validationError = await validatePayload(payload);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const item = await prisma.video.create({ data: payload });
    res.status(201).json(item);
  } catch (error) {
    console.error('Create video error:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ngày này đã có video trong lộ trình' });
    }
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /api/videos/:id
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const payload = buildPayload(req.body);
    const validationError = await validatePayload(payload);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const item = await prisma.video.update({
      where: { id: req.params.id },
      data: payload,
    });
    res.json(item);
  } catch (error) {
    console.error('Update video error:', error);
    if (error.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy video' });
    if (error.code === 'P2002') return res.status(409).json({ error: 'Ngày này đã có video trong lộ trình' });
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// DELETE /api/videos/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await prisma.video.delete({ where: { id: req.params.id } });
    res.json({ message: 'Đã xóa' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy video' });
    console.error('Delete video error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
