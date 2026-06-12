const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { prisma } = require('../config/db');
const { generateToken } = require('../utils/jwt');
const { protect, formatUser } = require('../middleware/auth');

const googleClient = new OAuth2Client();
const GOOGLE_WEB_CLIENT_ID = process.env.GOOGLE_WEB_CLIENT_ID;
const GOOGLE_WEB_CLIENT_SECRET = process.env.GOOGLE_WEB_CLIENT_SECRET;
const API_PUBLIC_URL = (process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 5001}`).replace(/\/$/, '');
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${API_PUBLIC_URL}/api/auth/callback/google`;

const GOOGLE_AUDIENCES = [
  GOOGLE_WEB_CLIENT_ID,
  process.env.GOOGLE_ANDROID_CLIENT_ID,
  process.env.GOOGLE_IOS_CLIENT_ID,
].filter(Boolean);

const getStateSecret = () => (process.env.JWT_SECRET || 'therahome-dev-google-oauth-state').trim();

const toBase64Url = (value) => Buffer.from(value).toString('base64url');
const fromBase64Url = (value) => Buffer.from(value, 'base64url').toString('utf8');

const signOAuthState = (redirectTo) => {
  const payload = toBase64Url(JSON.stringify({ redirectTo, ts: Date.now() }));
  const signature = crypto.createHmac('sha256', getStateSecret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
};

const verifyOAuthState = (state) => {
  if (!state || typeof state !== 'string' || !state.includes('.')) {
    throw new Error('Invalid OAuth state');
  }

  const [payload, signature] = state.split('.');
  const expected = crypto.createHmac('sha256', getStateSecret()).update(payload).digest('base64url');

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    throw new Error('Invalid OAuth state signature');
  }

  const parsed = JSON.parse(fromBase64Url(payload));
  if (!parsed.ts || Date.now() - parsed.ts > 10 * 60 * 1000) {
    throw new Error('Expired OAuth state');
  }

  return parsed.redirectTo;
};

const allowedFrontendOrigins = () => {
  const origins = new Set([
    FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ]);

  if (process.env.CORS_ORIGINS) {
    process.env.CORS_ORIGINS
      .split(',')
      .map(origin => origin.trim().replace(/\/$/, ''))
      .filter(Boolean)
      .forEach(origin => origins.add(origin));
  }

  return origins;
};

const fallbackFrontendCallback = () => `${FRONTEND_URL}/auth/google/callback`;

const sanitizeFrontendRedirect = (redirectTo) => {
  if (!redirectTo || typeof redirectTo !== 'string') return fallbackFrontendCallback();

  try {
    const url = new URL(redirectTo);
    if (!['http:', 'https:'].includes(url.protocol)) return fallbackFrontendCallback();
    if (!allowedFrontendOrigins().has(url.origin)) return fallbackFrontendCallback();
    return url.toString();
  } catch {
    return fallbackFrontendCallback();
  }
};

const isValidPreferredTime = (value) => {
  if (typeof value !== 'string') return false;
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value.trim());
};

const createRedirectOAuthClient = () => {
  if (!GOOGLE_WEB_CLIENT_ID || !GOOGLE_WEB_CLIENT_SECRET) {
    throw new Error('Missing GOOGLE_WEB_CLIENT_ID or GOOGLE_WEB_CLIENT_SECRET');
  }

  return new OAuth2Client(GOOGLE_WEB_CLIENT_ID, GOOGLE_WEB_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
};

const redirectWithOAuthError = (res, redirectTo, message) => {
  const target = new URL(sanitizeFrontendRedirect(redirectTo));
  target.hash = new URLSearchParams({ error: message }).toString();
  return res.redirect(target.toString());
};

const createGoogleSessionFromPayload = async (payload) => {
  if (!payload) {
    throw new Error('Google token payload is empty');
  }

  const {
    sub: googleId,
    email,
    name,
    picture,
    email_verified,
  } = payload;

  if (!email || !email_verified) {
    throw new Error('Google email is not verified');
  }

  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { googleId },
        { email }
      ]
    },
    include: {
      user_devices: {
        include: {
          product: true
        }
      }
    }
  });

  if (user) {
    const updates = {};
    if (!user.googleId) updates.googleId = googleId;
    if (picture && user.avatar_url !== picture) updates.avatar_url = picture;
    if (name && !user.full_name) updates.full_name = name;

    if (Object.keys(updates).length > 0) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: updates,
        include: {
          user_devices: {
            include: {
              product: true
            }
          }
        }
      });
    }
  } else {
    user = await prisma.user.create({
      data: {
        googleId,
        email,
        full_name: name || '',
        avatar_url: picture || '',
        role: 'user',
      },
      include: {
        user_devices: {
          include: {
            product: true
          }
        }
      }
    });
  }

  return {
    token: generateToken(user.id, user.role),
    user: formatUser(user),
  };
};

// POST /api/auth/admin-login - Admin email/password login
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email và mật khẩu là bắt buộc' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.role !== 'admin') {
      return res.status(401).json({ error: 'Bạn không có quyền truy cập admin panel' });
    }

    if (!user.password) {
      return res.status(401).json({ error: 'Mật khẩu chưa được thiết lập cho admin' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    const token = generateToken(user.id, 'admin');

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /api/auth/google/start - Browser redirect Google OAuth login
router.get('/google/start', (req, res) => {
  try {
    const redirectTo = sanitizeFrontendRedirect(req.query.redirectTo);
    const oauthClient = createRedirectOAuthClient();
    const url = oauthClient.generateAuthUrl({
      scope: ['openid', 'email', 'profile'],
      prompt: 'select_account',
      state: signOAuthState(redirectTo),
    });

    res.redirect(url);
  } catch (error) {
    console.error('Google OAuth start error:', error);
    redirectWithOAuthError(res, req.query.redirectTo, 'Google OAuth is not configured on the server');
  }
});

// Google OAuth browser callback handler
const handleGoogleCallback = async (req, res) => {
  let redirectTo = fallbackFrontendCallback();

  try {
    if (req.query.error) {
      return redirectWithOAuthError(res, redirectTo, String(req.query.error));
    }

    redirectTo = sanitizeFrontendRedirect(verifyOAuthState(req.query.state));

    if (!req.query.code || typeof req.query.code !== 'string') {
      return redirectWithOAuthError(res, redirectTo, 'Missing Google authorization code');
    }

    const oauthClient = createRedirectOAuthClient();
    const { tokens } = await oauthClient.getToken(req.query.code);

    if (!tokens.id_token) {
      return redirectWithOAuthError(res, redirectTo, 'Google did not return an id_token');
    }

    const ticket = await oauthClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_WEB_CLIENT_ID,
    });

    const authResponse = await createGoogleSessionFromPayload(ticket.getPayload());
    const target = new URL(redirectTo);
    target.hash = new URLSearchParams({ token: authResponse.token }).toString();

    return res.redirect(target.toString());
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return redirectWithOAuthError(res, redirectTo, 'Google authentication failed');
  }
};

// GET /api/auth/google/callback - Google OAuth browser callback (deprecated standard URI)
router.get('/google/callback', handleGoogleCallback);

// GET /api/auth/callback/google - Google OAuth browser callback (configured Console URI)
router.get('/callback/google', handleGoogleCallback);

// POST /api/auth/google - Google Sign-In (mobile app)
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'idToken là bắt buộc' });
    }

    if (!GOOGLE_AUDIENCES.length) {
      return res.status(500).json({ error: 'Google OAuth chưa được cấu hình trên server' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_AUDIENCES,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({ error: 'Google token không hợp lệ' });
    }

    const {
      sub: googleId,
      email,
      name,
      picture,
      email_verified,
    } = payload;

    if (!email || !email_verified) {
      return res.status(401).json({ error: 'Email Google chưa được xác minh' });
    }

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email }
        ]
      },
      include: {
        user_devices: {
          include: {
            product: true
          }
        }
      }
    });

    if (user) {
      const updates = {};
      if (!user.googleId) updates.googleId = googleId;
      if (picture && user.avatar_url !== picture) updates.avatar_url = picture;
      if (name && !user.full_name) updates.full_name = name;

      if (Object.keys(updates).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updates,
          include: {
            user_devices: {
              include: {
                product: true
              }
            }
          }
        });
      }
    } else {
      user = await prisma.user.create({
        data: {
          googleId,
          email,
          full_name: name || '',
          avatar_url: picture || '',
          role: 'user',
        },
        include: {
          user_devices: {
            include: {
              product: true
            }
          }
        }
      });
    }

    const token = generateToken(user.id, user.role);
    const formattedUser = formatUser(user);

    res.json({
      token,
      user: formattedUser,
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Google authentication failed' });
  }
});

// GET /api/auth/me - Get current user profile
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

// PUT /api/auth/profile - Update user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const allowedFields = [
      'full_name', 'age', 'occupation', 'gender', 'height', 'weight',
      'target_weight', 'primary_goal', 'focus_area', 'limitations',
      'diet_type', 'pain_areas', 'symptoms', 'surgery_history',
      'preferred_time', 'avatar_url', 'onboarding_completed', 'notifications_enabled',
      'personalized_plan_started_at', 'personalized_plan_completed_at',
      'personalized_plan_unlock_at'
    ];

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field.endsWith('_at') && req.body[field] !== null) {
          updates[field] = new Date(req.body[field]);
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    if (req.body.preferred_time !== undefined) {
      if (!isValidPreferredTime(req.body.preferred_time)) {
        return res.status(400).json({ error: 'preferred_time phải có định dạng HH:mm' });
      }
      updates.preferred_time = req.body.preferred_time.trim();
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updates,
      include: {
        user_devices: {
          include: {
            product: true
          }
        }
      }
    });

    res.json(formatUser(updatedUser));
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/auth/profile/sync - Upsert profile (mobile app background sync)
router.post('/profile/sync', protect, async (req, res) => {
  try {
    const allowedSyncFields = [
      'full_name', 'age', 'occupation', 'gender', 'height', 'weight',
      'target_weight', 'primary_goal', 'focus_area', 'limitations',
      'diet_type', 'pain_areas', 'symptoms', 'surgery_history',
      'preferred_time', 'avatar_url', 'onboarding_completed', 'notifications_enabled',
      'personalized_plan_started_at', 'personalized_plan_completed_at',
      'personalized_plan_unlock_at',
    ];

    const updates = {};
    allowedSyncFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field.endsWith('_at') && req.body[field] !== null) {
          updates[field] = new Date(req.body[field]);
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    if (req.body.preferred_time !== undefined) {
      if (!isValidPreferredTime(req.body.preferred_time)) {
        return res.status(400).json({ error: 'preferred_time phải có định dạng HH:mm' });
      }
      updates.preferred_time = req.body.preferred_time.trim();
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updates,
      include: {
        user_devices: {
          include: {
            product: true
          }
        }
      }
    });

    res.json({ success: true, data: formatUser(updatedUser) });
  } catch (error) {
    console.error('Profile sync error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
