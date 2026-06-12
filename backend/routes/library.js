const express = require('express');
const router = express.Router();
const { prisma } = require('../config/db');

// Lấy danh sách thư viện
router.get('/', async (req, res) => {
  try {
    const items = await prisma.library.findMany({
      orderBy: { created_at: 'desc' },
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Thêm mục thư viện mới
router.post('/', async (req, res) => {
  try {
    const { title, category, coverImage, link } = req.body;
    const newItem = await prisma.library.create({
      data: {
        title: title || '',
        category,
        coverImage,
        link,
      },
    });
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Cập nhật mục thư viện
router.put('/:id', async (req, res) => {
  try {
    const { title, category, coverImage, link } = req.body;
    const data = {};
    if (title !== undefined) data.title = title;
    if (category !== undefined) data.category = category;
    if (coverImage !== undefined) data.coverImage = coverImage;
    if (link !== undefined) data.link = link;

    const updatedItem = await prisma.library.update({
      where: { id: req.params.id },
      data,
    });
    res.json(updatedItem);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy dữ liệu' });
    res.status(400).json({ error: err.message });
  }
});

// Xóa mục thư viện
router.delete('/:id', async (req, res) => {
  try {
    await prisma.library.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Đã xóa thành công' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy dữ liệu' });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
