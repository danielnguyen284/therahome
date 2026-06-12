const express = require('express');
const router = express.Router();
const { prisma } = require('../config/db');
const { protect } = require('../middleware/auth');

// GET /api/product-assessments/mine
router.get('/mine', protect, async (req, res) => {
  try {
    const items = await prisma.productAssessment.findMany({
      where: { user_id: req.user.id },
      include: { product: true },
      orderBy: { updated_at: 'desc' },
    });
    res.json(items);
  } catch (error) {
    console.error('Get my product assessments error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /api/product-assessments/product/:productId
router.get('/product/:productId', protect, async (req, res) => {
  try {
    const item = await prisma.productAssessment.findUnique({
      where: {
        user_id_product_id: {
          user_id: req.user.id,
          product_id: req.params.productId,
        },
      },
      include: { product: true },
    });
    res.json(item || null);
  } catch (error) {
    console.error('Get product assessment by product error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/product-assessments
router.post('/', protect, async (req, res) => {
  try {
    const { product_id, rating, comment = '' } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'Thiếu product_id' });
    }

    if (!Number.isFinite(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ error: 'rating phải từ 1 đến 5' });
    }

    const product = await prisma.product.findUnique({ where: { id: product_id } });
    if (!product) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    }

    const item = await prisma.productAssessment.upsert({
      where: {
        user_id_product_id: {
          user_id: req.user.id,
          product_id,
        },
      },
      update: {
        rating: Number(rating),
        comment: typeof comment === 'string' ? comment.trim() : '',
      },
      create: {
        user_id: req.user.id,
        product_id,
        rating: Number(rating),
        comment: typeof comment === 'string' ? comment.trim() : '',
      },
      include: { product: true },
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Create/update product assessment error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// DELETE /api/product-assessments/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const existing = await prisma.productAssessment.findFirst({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy đánh giá' });
    }

    await prisma.productAssessment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Đã xóa đánh giá' });
  } catch (error) {
    console.error('Delete product assessment error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
