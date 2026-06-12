const express = require('express');
const router = express.Router();
const { prisma } = require('../config/db');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/knowledge
router.get('/', protect, async (req, res) => {
  try {
    const { category, limit } = req.query;
    const where = {};
    if (category && category !== 'all') where.category = category;

    const items = await prisma.knowledgeBase.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit ? parseInt(limit) : undefined,
    });
    res.json(items);
  } catch (error) {
    console.error('Get knowledge error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/knowledge
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    const item = await prisma.knowledgeBase.create({
      data: {
        title,
        content,
        category,
        tags: Array.isArray(tags) ? tags : [],
      },
    });
    res.status(201).json(item);
  } catch (error) {
    console.error('Create knowledge error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /api/knowledge/:id
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    const data = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;
    if (category !== undefined) data.category = category;
    if (tags !== undefined) data.tags = Array.isArray(tags) ? tags : [];

    const item = await prisma.knowledgeBase.update({
      where: { id: req.params.id },
      data,
    });
    res.json(item);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy' });
    console.error('Update knowledge error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// DELETE /api/knowledge/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await prisma.knowledgeBase.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Đã xóa' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy' });
    console.error('Delete knowledge error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
