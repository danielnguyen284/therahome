const express = require('express');
const router = express.Router();
const { prisma } = require('../config/db');

const serializeReview = (item) => ({
  id: item.id,
  authorName: item.authorName || 'Khách hàng',
  image: item.image_url,
  rating: item.rating,
  content: item.content,
  badge: item.badge || undefined,
});

// GET /api/reviews
router.get('/', async (req, res) => {
  try {
    const items = await prisma.motivation.findMany({
      orderBy: { created_at: 'desc' },
    });
    res.json(items.map(serializeReview));
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
