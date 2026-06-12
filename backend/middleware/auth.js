const { verifyToken } = require('../utils/jwt');
const { prisma } = require('../config/db');

// Helper to format user response with owned_devices array
const formatUser = (user) => {
  if (!user) return null;
  const owned_devices = (user.user_devices || []).map(ud => ({
    key: ud.product?.key || '',
    name: ud.product?.name || '',
    activation_code: ud.activation_code,
  }));

  const formatted = {
    ...user,
    owned_devices,
  };

  delete formatted.password;
  delete formatted.user_devices;
  return formatted;
};

// Protect routes - require valid JWT
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Không được phép truy cập' });
    }

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        user_devices: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    req.user = formatUser(user);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ error: 'Token không hợp lệ hoặc hết hạn' });
  }
};

// Admin only
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Chỉ admin mới được truy cập' });
  }
};

module.exports = { protect, adminOnly, formatUser };
