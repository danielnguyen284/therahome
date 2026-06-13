const express = require('express');
const router = express.Router();
const { prisma } = require('../config/db');
const { protect, adminOnly, formatUser } = require('../middleware/auth');

// GET /api/codes
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const codes = await prisma.activationCode.findMany({
      orderBy: { created_at: 'desc' },
      take: 100,
      include: {
        user: { select: { email: true, full_name: true } },
      },
    });

    // Map response to match legacy properties for used_by
    const mapped = codes.map((c) => ({
      id: c.id,
      code: c.code,
      is_used: c.is_used,
      used_by: c.user ? (c.user.full_name || c.user.email) : null,
      used_at: c.used_at,
      created_at: c.created_at,
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Get activation codes error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/codes/generate - Generate batch codes (admin)
router.post('/generate', protect, adminOnly, async (req, res) => {
  try {
    const { quantity = 10, prefix = 'THERA' } = req.body;
    if (quantity < 1 || quantity > 100) {
      return res.status(400).json({ error: 'Số lượng phải từ 1-100' });
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const codes = [];

    for (let i = 0; i < quantity; i++) {
      let code = prefix + '-';
      for (let j = 0; j < 8; j++) {
        if (j === 4) code += '-';
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      codes.push({ code, is_used: false });
    }

    await prisma.activationCode.createMany({ data: codes });
    const created = await prisma.activationCode.findMany({
      where: { code: { in: codes.map(c => c.code) } },
      orderBy: { created_at: 'desc' },
    });

    res.status(201).json(created);
  } catch (error) {
    console.error('Generate activation codes error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/codes/activate - Verify an activated product instance and attach it to user
router.post('/activate', protect, async (req, res) => {
  try {
    const code = typeof req.body.code === 'string' ? req.body.code.trim().toUpperCase() : '';
    if (!code) {
      return res.status(400).json({ error: 'Thiếu mã kích hoạt' });
    }

    // First check if it is a general ActivationCode
    const generalCode = await prisma.activationCode.findUnique({
      where: { code },
    });

    if (generalCode) {
      if (generalCode.is_used) {
        return res.status(400).json({ error: 'Mã kích hoạt này đã được sử dụng' });
      }

      // Mark the general code as used
      await prisma.activationCode.update({
        where: { id: generalCode.id },
        data: {
          is_used: true,
          used_by: req.user.id,
          used_at: new Date(),
        },
      });

      // Update user to pro
      await prisma.user.update({
        where: { id: req.user.id },
        data: { is_pro: true },
      });

      const dbUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          user_devices: { include: { product: true } },
        },
      });

      return res.json({
        message: 'Đã kích hoạt tài khoản PRO thành công',
        is_pro: true,
        user: formatUser(dbUser),
      });
    }

    // If not a general code, verify if it is a ProductInstance code
    const productInstance = await prisma.productInstance.findUnique({
      where: { activation_code: code },
      include: { product: true },
    });

    if (!productInstance) {
      return res.status(400).json({ error: 'Mã kích hoạt không hợp lệ' });
    }

    if (productInstance.is_activated) {
      return res.status(400).json({ error: 'Mã kích hoạt này đã được sử dụng' });
    }

    const product = productInstance.product;
    const deviceEntry = {
      key: product?.key || '',
      name: product?.name || '',
      activation_code: productInstance.activation_code,
    };

    // Upsert UserDevice record
    await prisma.userDevice.upsert({
      where: {
        user_id_activation_code: {
          user_id: req.user.id,
          activation_code: code,
        },
      },
      update: {},
      create: {
        user_id: req.user.id,
        product_id: productInstance.product_id,
        activation_code: code,
      },
    });

    // Update product instance with user who claimed it
    await prisma.productInstance.update({
      where: { id: productInstance.id },
      data: {
        is_activated: true,
        activated_by: req.user.id,
        activated_at: new Date(),
      },
    });

    // Update user to PRO
    await prisma.user.update({
      where: { id: req.user.id },
      data: { is_pro: true },
    });

    const dbUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        user_devices: { include: { product: true } },
      },
    });

    res.json({
      message: 'Đã thêm thiết bị thành công',
      is_pro: true,
      device: deviceEntry,
      user: formatUser(dbUser),
    });
  } catch (error) {
    console.error('Activation Error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/codes/validate - Check if a product instance code is already activated and can be claimed after login
router.post('/validate', async (req, res) => {
  try {
    const code = typeof req.body.code === 'string' ? req.body.code.trim().toUpperCase() : '';
    if (!code) {
      return res.status(400).json({ error: 'Thiếu mã kích hoạt' });
    }

    // Check if it is a general ActivationCode first
    const generalCode = await prisma.activationCode.findUnique({
      where: { code },
    });

    if (generalCode) {
      if (generalCode.is_used) {
        return res.status(400).json({ error: 'Mã kích hoạt này đã được sử dụng' });
      }
      return res.json({
        valid: true,
        code,
        type: 'general',
      });
    }

    // Check if it is a ProductInstance code
    const productInstance = await prisma.productInstance.findUnique({
      where: { activation_code: code },
      include: { product: true },
    });

    if (!productInstance) {
      return res.status(400).json({ error: 'Mã kích hoạt không hợp lệ' });
    }

    if (productInstance.is_activated) {
      return res.status(400).json({ error: 'Mã kích hoạt này đã được sử dụng' });
    }

    const product = productInstance.product;

    res.json({
      valid: true,
      code,
      type: 'product',
      product: {
        key: product?.key || '',
        name: product?.name || '',
      },
    });
  } catch (error) {
    console.error('Validate activation code error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
