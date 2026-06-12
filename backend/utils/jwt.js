const jwt = require('jsonwebtoken');

const generateToken = (userId, role = 'user') => {
  return jwt.sign(
    { id: userId, role },
    (process.env.JWT_SECRET || '').trim(),
    { expiresIn: (process.env.JWT_EXPIRES_IN || '30d').trim() }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, (process.env.JWT_SECRET || '').trim());
};

module.exports = { generateToken, verifyToken };
