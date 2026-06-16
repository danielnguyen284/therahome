const express = require('express');
const router = express.Router();
const { prisma } = require('../config/db');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const items = await prisma.product.findMany({
      where: { is_active: true },
      orderBy: { created_at: 'asc' },
    });
    res.json(items);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/products
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { key, name, image_url, purchase_link, description, is_active } = req.body;
    const item = await prisma.product.create({
      data: { key, name, image_url, purchase_link, description, is_active },
    });
    res.status(201).json(item);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /api/products/:id
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { key, name, image_url, purchase_link, description, is_active } = req.body;
    const item = await prisma.product.update({
      where: { id: req.params.id },
      data: { key, name, image_url, purchase_link, description, is_active },
    });
    res.json(item);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ message: 'Đã xóa' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
