const express = require('express');
const router = express.Router();
const { prisma } = require('../config/db');
const { protect, adminOnly } = require('../middleware/auth');

const VALID_VIDEO_GROUPS = ['regular', 'device_supported'];

const buildPayload = (body = {}) => ({
  video_group: VALID_VIDEO_GROUPS.includes(body.video_group) ? body.video_group : 'regular',
  title: typeof body.title === 'string' ? body.title.trim() : '',
  description: typeof body.description === 'string' ? body.description.trim() : '',
  link: typeof body.link === 'string' ? body.link.trim() : '',
  is_active: body.is_active !== undefined ? body.is_active === true || body.is_active === 'true' : true,
});

const validatePayload = (payload) => {
  if (!VALID_VIDEO_GROUPS.includes(payload.video_group)) {
    return 'video_group không hợp lệ';
  }
  if (!payload.link) {
    return 'Thiếu link video';
  }
  return null;
};

// GET /api/personalized-plan-videos
router.get('/', protect, async (req, res) => {
  try {
    const { videoGroup, isActive } = req.query;
    const where = {};
    if (videoGroup && VALID_VIDEO_GROUPS.includes(videoGroup)) {
      where.video_group = videoGroup;
    }
    if (isActive === 'true' || isActive === 'false') {
      where.is_active = isActive === 'true';
    }

    const items = await prisma.personalizedPlanVideo.findMany({
      where,
      orderBy: [
        { video_group: 'asc' },
        { created_at: 'desc' },
      ],
    });
    res.json(items);
  } catch (error) {
    console.error('Get personalized plan videos error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /api/personalized-plan-videos/random?regularCount=6&deviceCount=1
router.get('/random', protect, async (req, res) => {
  try {
    const regularCount = Number.isInteger(Number(req.query.regularCount))
      ? Math.max(0, Number(req.query.regularCount))
      : 6;
    const deviceCount = Number.isInteger(Number(req.query.deviceCount))
      ? Math.max(0, Number(req.query.deviceCount))
      : 1;

    // Use Prisma raw queries for native PostgreSQL random sampling
    const regularItems = regularCount > 0 
      ? await prisma.$queryRaw`
          SELECT * FROM "personalized_plan_videos" 
          WHERE video_group = 'regular' AND is_active = true 
          ORDER BY RANDOM() 
          LIMIT ${regularCount}
        `
      : [];

    const deviceItems = deviceCount > 0
      ? await prisma.$queryRaw`
          SELECT * FROM "personalized_plan_videos" 
          WHERE video_group = 'device_supported' AND is_active = true 
          ORDER BY RANDOM() 
          LIMIT ${deviceCount}
        `
      : [];

    // Map Prisma raw query output dates and properties to match the model if needed
    const items = [...regularItems, ...deviceItems].map(item => ({
      id: item.id,
      video_group: item.video_group,
      title: item.title,
      description: item.description,
      link: item.link,
      is_active: item.is_active,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));

    res.json({
      regular_count: regularItems.length,
      device_count: deviceItems.length,
      total: items.length,
      items,
    });
  } catch (error) {
    console.error('Random personalized plan videos error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /api/personalized-plan-videos/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const item = await prisma.personalizedPlanVideo.findUnique({
      where: { id: req.params.id },
    });
    if (!item) return res.status(404).json({ error: 'Không tìm thấy video' });
    res.json(item);
  } catch (error) {
    console.error('Get personalized plan video detail error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/personalized-plan-videos
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const payload = buildPayload(req.body);
    const validationError = validatePayload(payload);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const item = await prisma.personalizedPlanVideo.create({ data: payload });
    res.status(201).json(item);
  } catch (error) {
    console.error('Create personalized plan video error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /api/personalized-plan-videos/:id
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const payload = buildPayload(req.body);
    const validationError = validatePayload(payload);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const item = await prisma.personalizedPlanVideo.update({
      where: { id: req.params.id },
      data: payload,
    });
    res.json(item);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy video' });
    console.error('Update personalized plan video error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// DELETE /api/personalized-plan-videos/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await prisma.personalizedPlanVideo.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Đã xóa' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy video' });
    console.error('Delete personalized plan video error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
