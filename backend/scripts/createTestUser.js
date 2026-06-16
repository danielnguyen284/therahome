/**
 * Create Test User and generate JWT
 * Run: node scripts/createTestUser.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { prisma } = require('../config/db');
const { generateToken } = require('../utils/jwt');

async function main() {
  try {
    const user = await prisma.user.upsert({
      where: { email: 'testuser@theraease.vn' },
      update: {
        onboarding_completed: true,
        role: 'user',
        is_pro: true,
        full_name: 'Test User Thera',
      },
      create: {
        email: 'testuser@theraease.vn',
        full_name: 'Test User Thera',
        role: 'user',
        is_pro: true,
        onboarding_completed: true,
      }
    });

    const product = await prisma.product.findFirst({ where: { key: 'ech' } });
    if (product) {
      const existingDevice = await prisma.userDevice.findFirst({
        where: { user_id: user.id, product_id: product.id }
      });
      if (!existingDevice) {
        await prisma.userDevice.create({
          data: {
            user_id: user.id,
            product_id: product.id,
            activation_code: 'TESTCODE123',
          }
        });
      }
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        user_devices: {
          include: {
            product: true
          }
        }
      }
    });

    const formatUser = (u) => {
      if (!u) return null;
      const owned_devices = (u.user_devices || []).map(ud => ({
        key: ud.product?.key || '',
        name: ud.product?.name || '',
        activation_code: ud.activation_code,
      }));
      const formatted = { ...u, owned_devices };
      delete formatted.password;
      delete formatted.user_devices;
      return formatted;
    };

    const token = generateToken(user.id, user.role);
    console.log('---TOKEN_START---');
    console.log(token);
    console.log('---TOKEN_END---');
    console.log('---USER_START---');
    console.log(JSON.stringify(formatUser(fullUser)));
    console.log('---USER_END---');
    process.exit(0);
  } catch (err) {
    console.error('Error creating test user:', err);
    process.exit(1);
  }
}

main();
