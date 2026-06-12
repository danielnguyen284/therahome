const express = require('express');
const router = express.Router();
const { prisma } = require('../config/db');
const { protect, adminOnly } = require('../middleware/auth');

function normalizePayload(body = {}) {
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  const imageUrlRaw = typeof body.image_url === 'string' ? body.image_url.trim() : '';
  const imageUrlAlias = typeof body.imgUrl === 'string' ? body.imgUrl.trim() : '';
  const imageUrlsRaw = Array.isArray(body.image_urls)
    ? body.image_urls
    : Array.isArray(body.imageUrls)
      ? body.imageUrls
      : typeof body.image_urls === 'string'
        ? body.image_urls.split('\n')
        : typeof body.imageUrls === 'string'
          ? body.imageUrls.split('\n')
          : [];
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const sortOrder = Number.isFinite(Number(body.sort_order))
    ? Number(body.sort_order)
    : Number.isFinite(Number(body.sortOrder))
      ? Number(body.sortOrder)
      : 0;

  let isCorrect = false;
  if (typeof body.is_correct === 'boolean') isCorrect = body.is_correct;
  else if (typeof body.isCorrect === 'boolean') isCorrect = body.isCorrect;
  else if (typeof body.trueOrFalse === 'boolean') isCorrect = body.trueOrFalse;
  else if (typeof body.trueOrFalse === 'string') {
    const normalized = body.trueOrFalse.trim().toLowerCase();
    isCorrect = normalized === 'true' || normalized === 'đúng' || normalized === 'dung';
  }

  const normalizedImageUrls = imageUrlsRaw
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);

  if (normalizedImageUrls.length === 0 && (imageUrlRaw || imageUrlAlias)) {
    normalizedImageUrls.push(imageUrlRaw || imageUrlAlias);
  }

  return {
    category,
    image_url: normalizedImageUrls[0] || imageUrlRaw || imageUrlAlias,
    image_urls: normalizedImageUrls,
    is_correct: isCorrect,
    description,
    sort_order: sortOrder,
  };
}

function validatePayload(payload) {
  if (!payload.category) return 'Thiếu category';
  if (!Array.isArray(payload.image_urls) || payload.image_urls.length === 0) return 'Thiếu ảnh';
  if (!payload.description) return 'Thiếu description';
  return null;
}

function serializeItem(item) {
  const imageUrls = Array.isArray(item.image_urls) && item.image_urls.length > 0
    ? item.image_urls
    : item.image_url
      ? [item.image_url]
      : [];

  return {
    id: item.id,
    category: item.category,
    image_url: imageUrls[0] || '',
    imgUrl: imageUrls[0] || '',
    image_urls: imageUrls,
    imageUrls: imageUrls,
    is_correct: item.is_correct,
    isCorrect: item.is_correct,
    trueOrFalse: item.is_correct,
    description: item.description,
    sort_order: item.sort_order || 0,
    sortOrder: item.sort_order || 0,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

function serializeGrouped(items) {
  const groups = new Map();

  items.forEach((item) => {
    const key = item.category;
    if (!groups.has(key)) {
      groups.set(key, { category: key, correct: null, incorrect: null });
    }
    const group = groups.get(key);
    const payload = serializeItem(item);
    if (item.is_correct) group.correct = payload;
    else group.incorrect = payload;
  });

  return Array.from(groups.values());
}

// GET /api/postures
router.get('/', async (req, res) => {
  try {
    const { category, grouped } = req.query;
    const where = {};
    if (category && category !== 'all') where.category = category;

    const items = await prisma.posture.findMany({
      where,
      orderBy: [
        { sort_order: 'asc' },
        { category: 'asc' },
        { is_correct: 'desc' },
        { created_at: 'asc' },
      ],
    });

    if (grouped === 'true') {
      return res.json(serializeGrouped(items));
    }
    res.json(items.map(serializeItem));
  } catch (error) {
    console.error('Get postures error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/postures
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const payload = normalizePayload(req.body);
    const validationError = validatePayload(payload);
    if (validationError) return res.status(400).json({ error: validationError });

    const item = await prisma.posture.create({ data: payload });
    res.status(201).json(serializeItem(item));
  } catch (error) {
    console.error('Create posture error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /api/postures/:id
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const payload = normalizePayload(req.body);
    const validationError = validatePayload(payload);
    if (validationError) return res.status(400).json({ error: validationError });

    const item = await prisma.posture.update({
      where: { id: req.params.id },
      data: payload,
    });
    res.json(serializeItem(item));
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy' });
    console.error('Update posture error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// DELETE /api/postures/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await prisma.posture.delete({ where: { id: req.params.id } });
    res.json({ message: 'Đã xóa' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy' });
    console.error('Delete posture error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
