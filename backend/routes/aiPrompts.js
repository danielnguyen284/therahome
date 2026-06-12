const express = require('express');
const router = express.Router();
const { prisma } = require('../config/db');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/ai-prompts - Get all prompts
router.get('/', protect, async (req, res) => {
  try {
    const { prompt_type, is_active } = req.query;
    const where = {};
    if (prompt_type) where.prompt_type = prompt_type;
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const prompts = await prisma.aiPrompt.findMany({
      where,
      orderBy: { prompt_type: 'asc' },
    });
    res.json(prompts);
  } catch (error) {
    console.error('Get AI prompts error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /api/ai-prompts/:id - Update prompt (admin)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { system_prompt, temperature, max_tokens, model, is_active } = req.body;

    const data = {};
    if (system_prompt !== undefined) data.system_prompt = system_prompt;
    if (temperature !== undefined) data.temperature = Number(temperature);
    if (max_tokens !== undefined) data.max_tokens = Number(max_tokens);
    if (model !== undefined) data.model = model;
    if (is_active !== undefined) data.is_active = is_active === true || is_active === 'true';

    const prompt = await prisma.aiPrompt.update({
      where: { id: req.params.id },
      data,
    });
    res.json(prompt);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy prompt' });
    console.error('Update AI prompt error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
