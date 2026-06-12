/**
 * Add missing AI prompt types: analysis, motivation
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { prisma } = require('../config/db');

async function addPrompts() {
  const prompts = await prisma.aiPrompt.findMany({
    select: { prompt_type: true },
  });
  const types = prompts.map(p => p.prompt_type);
  console.log('Existing types:', types);

  const toAdd = [];

  if (!types.includes('analysis')) {
    toAdd.push({
      prompt_type: 'analysis',
      system_prompt: 'Bạn là chuyên gia phân tích dữ liệu sức khỏe. Phân tích xu hướng đau, tiến triển tập luyện của người dùng và đưa ra nhận xét chi tiết. Trả lời bằng tiếng Việt.',
      temperature: 0.5,
      max_tokens: 1200,
      model: 'llama-3.3-70b-versatile',
      is_active: true,
    });
  }

  if (!types.includes('motivation')) {
    toAdd.push({
      prompt_type: 'motivation',
      system_prompt: 'Bạn là huấn luyện viên động lực. Tạo thông điệp truyền cảm hứng, khuyến khích người dùng tiếp tục tập luyện caỉ thiện. Ngắn gọn 1-2 câu, nhiệt tình và tích cực. Trả lời bằng tiếng Việt.',
      temperature: 0.8,
      max_tokens: 150,
      model: 'llama-3.3-70b-versatile',
      is_active: true,
    });
  }

  if (toAdd.length > 0) {
    await prisma.aiPrompt.createMany({ data: toAdd });
    console.log('Added', toAdd.length, 'new prompt types:', toAdd.map(t => t.prompt_type));
  } else {
    console.log('All prompt types already exist');
  }

  const finalPrompts = await prisma.aiPrompt.findMany({
    select: { prompt_type: true },
  });
  const final = finalPrompts.map(p => p.prompt_type);
  console.log('Final types:', final, '(' + final.length + ' total)');
  process.exit(0);
}

addPrompts().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
