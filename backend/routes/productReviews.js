const express = require('express');
const { prisma } = require('../config/db');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function serializeProductReview(item, viewerId = null) {
  const reviewUserId = item.user_id || null;
  const scope = item.scope || 'public';

  return {
    id: item.id,
    product_id: item.product_id,
    author_name: item.author_name,
    rating: item.rating,
    content: item.content,
    badge: item.badge || '',
    scope,
    is_mine: viewerId !== null && viewerId === reviewUserId,
    reviewer_type: scope === 'private' ? 'user' : 'admin',
    product: item.product || null,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

function normalizeAdminPayload(body = {}) {
  return {
    product_id: body.product_id,
    author_name: typeof body.author_name === 'string' ? body.author_name.trim() : '',
    rating: Number(body.rating),
    content: typeof body.content === 'string' ? body.content.trim() : '',
    badge: typeof body.badge === 'string' ? body.badge.trim() : '',
  };
}

function normalizePrivatePayload(body = {}) {
  return {
    product_id: body.product_id,
    rating: Number(body.rating),
    content: typeof body.content === 'string' ? body.content.trim() : '',
  };
}

async function validateCommonPayload(payload, res) {
  if (!payload.product_id) {
    res.status(400).json({ error: 'Thiếu product_id' });
    return null;
  }
  if (!payload.content) {
    res.status(400).json({ error: 'Thiếu nội dung đánh giá' });
    return null;
  }
  if (!Number.isFinite(payload.rating) || payload.rating < 1 || payload.rating > 5) {
    res.status(400).json({ error: 'rating phải từ 1 đến 5' });
    return null;
  }
  const product = await prisma.product.findUnique({ where: { id: payload.product_id } });
  if (!product) {
    res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    return null;
  }
  return product;
}

async function validateAdminPayload(payload, res) {
  if (!payload.author_name) {
    res.status(400).json({ error: 'Thiếu tên người đánh giá' });
    return null;
  }
  return validateCommonPayload(payload, res);
}

function extractOwnedProductKeys(user) {
  const ownedDevices = Array.isArray(user?.owned_devices) ? user.owned_devices : [];
  const keys = new Set();

  ownedDevices.forEach((item) => {
    if (typeof item === 'string') {
      const normalized = normalizeText(item);
      if (['ech', 'neck_device', 'theraneck'].includes(normalized) || normalized.includes('neck') || normalized.includes('co')) keys.add('ech');
      if (['rung', 'back_device', 'theraback'].includes(normalized) || normalized.includes('back') || normalized.includes('lung')) keys.add('rung');
      return;
    }
    const key = normalizeText(item?.key || '');
    const name = normalizeText(item?.name || '');
    if (['ech', 'neck_device', 'theraneck'].includes(key) || name.includes('ech') || name.includes('neck') || name.includes('co')) keys.add('ech');
    if (['rung', 'back_device', 'theraback'].includes(key) || name.includes('rung') || name.includes('back') || name.includes('lung')) keys.add('rung');
  });

  return keys;
}

function userCanReviewProduct(user, product) {
  const ownedProductKeys = extractOwnedProductKeys(user);
  return ownedProductKeys.has(normalizeText(product?.key || ''));
}

router.get('/', async (req, res) => {
  try {
    const where = { scope: 'public' };
    if (req.query.product_id) where.product_id = req.query.product_id;

    const items = await prisma.productReview.findMany({
      where,
      include: { product: true },
      orderBy: [{ product_id: 'asc' }, { updated_at: 'desc' }],
    });
    res.json(items.map(item => serializeProductReview(item)));
  } catch (error) {
    console.error('Get public product reviews error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

router.get('/my-feed', protect, async (req, res) => {
  try {
    const where = {
      OR: [
        { scope: 'public' },
        { scope: 'private', user_id: req.user.id },
      ],
    };
    if (req.query.product_id) where.product_id = req.query.product_id;

    const items = await prisma.productReview.findMany({
      where,
      include: { product: true },
      orderBy: [{ product_id: 'asc' }, { updated_at: 'desc' }],
    });
    res.json(items.map(item => serializeProductReview(item, req.user.id)));
  } catch (error) {
    console.error('Get user product review feed error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

router.get('/admin-feed', protect, adminOnly, async (req, res) => {
  try {
    const where = {};
    if (req.query.product_id) where.product_id = req.query.product_id;
    if (req.query.scope === 'public' || req.query.scope === 'private') {
      where.scope = req.query.scope;
    }

    const items = await prisma.productReview.findMany({
      where,
      include: { product: true },
      orderBy: [{ updated_at: 'desc' }, { created_at: 'desc' }],
    });
    res.json(items.map(item => serializeProductReview(item, req.user.id)));
  } catch (error) {
    console.error('Get admin product review feed error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

router.post('/my', protect, async (req, res) => {
  try {
    const payload = normalizePrivatePayload(req.body);
    const product = await validateCommonPayload(payload, res);
    if (!product) return;

    if (!userCanReviewProduct(req.user, product)) {
      return res.status(403).json({ error: 'Bạn chỉ có thể đánh giá sản phẩm đã kích hoạt' });
    }

    const authorName =
      (typeof req.user.full_name === 'string' && req.user.full_name.trim()) ||
      (typeof req.user.email === 'string' && req.user.email.split('@')[0]?.trim()) ||
      'Bạn';

    // Find existing private review for this user+product
    const existing = await prisma.productReview.findFirst({
      where: {
        product_id: payload.product_id,
        user_id: req.user.id,
        scope: 'private',
      },
    });

    let item;
    if (existing) {
      item = await prisma.productReview.update({
        where: { id: existing.id },
        data: {
          author_name: authorName,
          rating: payload.rating,
          content: payload.content,
          badge: '',
        },
        include: { product: true },
      });
    } else {
      item = await prisma.productReview.create({
        data: {
          product_id: payload.product_id,
          user_id: req.user.id,
          scope: 'private',
          author_name: authorName,
          rating: payload.rating,
          content: payload.content,
          badge: '',
        },
        include: { product: true },
      });
    }

    res.json(serializeProductReview(item, req.user.id));
  } catch (error) {
    console.error('Save my product review error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const payload = normalizeAdminPayload(req.body);
    const product = await validateAdminPayload(payload, res);
    if (!product) return;

    const item = await prisma.productReview.create({
      data: {
        ...payload,
        scope: 'public',
        user_id: null,
      },
      include: { product: true },
    });

    res.status(201).json(serializeProductReview(item, req.user.id));
  } catch (error) {
    console.error('Create product review error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const payload = normalizeAdminPayload(req.body);
    const product = await validateAdminPayload(payload, res);
    if (!product) return;

    const item = await prisma.productReview.update({
      where: { id: req.params.id },
      data: {
        ...payload,
        scope: 'public',
        user_id: null,
      },
      include: { product: true },
    });

    res.json(serializeProductReview(item, req.user.id));
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy đánh giá sản phẩm' });
    console.error('Update product review error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await prisma.productReview.delete({ where: { id: req.params.id } });
    res.json({ message: 'Đã xóa đánh giá sản phẩm' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy đánh giá sản phẩm' });
    console.error('Delete product review error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
