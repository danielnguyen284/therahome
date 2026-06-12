const express = require('express');
const router = express.Router();
const { prisma } = require('../config/db');
const { protect, adminOnly } = require('../middleware/auth');

const buildPayload = (body = {}) => {
  const image = typeof body.image === 'string' ? body.image.trim() : '';
  const imageUrl = typeof body.image_url === 'string' ? body.image_url.trim() : '';
  const rating = body.rating !== undefined ? Number(body.rating) : Number(body.star);
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  return {
    authorName: typeof body.authorName === 'string' ? body.authorName.trim() : 'Khách hàng',
    rating: Number.isInteger(rating) ? rating : 5,
    content: content || message,
    image_url: imageUrl || image,
    badge: typeof body.badge === 'string' ? body.badge.trim() : '',
  };
};

const serializeItem = (item) => ({
  id: item.id,
  authorName: item.authorName || 'Khách hàng',
  image: item.image_url,
  rating: item.rating,
  content: item.content,
  image_url: item.image_url,
  star: item.rating,
  message: item.content,
  badge: item.badge || '',
  created_at: item.created_at,
  updated_at: item.updated_at,
});

const validatePayload = (payload) => {
  if (!payload.image_url) return 'Thiếu image';
  if (!payload.content) return 'Thiếu content';
  if (!Number.isInteger(payload.rating) || payload.rating < 1 || payload.rating > 5) {
    return 'Rating phải từ 1 đến 5';
  }
  return null;
};

// GET /api/motivations
router.get('/', protect, async (req, res) => {
  try {
    const items = await prisma.motivation.findMany({
      orderBy: { created_at: 'desc' },
    });
    res.json(items.map(serializeItem));
  } catch (error) {
    console.error('Get motivations error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /api/motivations/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const item = await prisma.motivation.findUnique({
      where: { id: req.params.id },
    });
    if (!item) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(serializeItem(item));
  } catch (error) {
    console.error('Get motivation detail error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/motivations
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const payload = buildPayload(req.body);
    const validationError = validatePayload(payload);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const item = await prisma.motivation.create({ data: payload });
    res.status(201).json(serializeItem(item));
  } catch (error) {
    console.error('Create motivation error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /api/motivations/:id
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const payload = buildPayload(req.body);
    const validationError = validatePayload(payload);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const item = await prisma.motivation.update({
      where: { id: req.params.id },
      data: payload,
    });
    res.json(serializeItem(item));
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy' });
    console.error('Update motivation error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// DELETE /api/motivations/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await prisma.motivation.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Đã xóa' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy' });
    console.error('Delete motivation error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
