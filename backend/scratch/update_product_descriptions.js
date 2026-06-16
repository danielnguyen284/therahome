require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { prisma } = require('../config/db');

async function run() {
  const neckDesc = "Thiết bị giãn cơ, kích hoạt lưu thông máu vùng cổ vai gáy. Hỗ trợ giảm mỏi cơ sâu do ngồi sai tư thế làm việc dài ngày.";
  const backDesc = "Thiết bị massage thắt lưng với nhiệt trị liệu hồng ngoại. Giúp kéo giãn cơ lưng thắt lưng, phục hồi đường cong cột sống tự nhiên.";

  try {
    const products = await prisma.product.findMany();
    console.log('Current products in DB:', products);

    for (const prod of products) {
      const key = prod.key.toLowerCase();
      const name = prod.name.toLowerCase();
      if (key === 'ech' || name.includes('neck') || name.includes('co vai')) {
        await prisma.product.update({
          where: { id: prod.id },
          data: { description: neckDesc },
        });
        console.log(`Updated product ${prod.name} (key: ${prod.key}) with Neck description.`);
      } else if (key === 'rung' || name.includes('back') || name.includes('lung')) {
        await prisma.product.update({
          where: { id: prod.id },
          data: { description: backDesc },
        });
        console.log(`Updated product ${prod.name} (key: ${prod.key}) with Back description.`);
      }
    }
    console.log('Update completed successfully.');
  } catch (error) {
    console.error('Update script failed:', error);
  }

  process.exit(0);
}

run();
