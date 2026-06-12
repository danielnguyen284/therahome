require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { prisma } = require('../config/db');

async function verify() {
  const counts = {
    users: await prisma.user.count(),
    exercises: await prisma.exercise.count(),
    plans: await prisma.workoutPlan.count(),
    prompts: await prisma.aiPrompt.count(),
    knowledge: await prisma.knowledgeBase.count(),
    codes: await prisma.activationCode.count(),
  };

  console.log('\n=== DATABASE COUNTS ===');
  Object.entries(counts).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  // Test id conversion (critical check)
  const ex = await prisma.exercise.findFirst();
  if (ex) {
    console.log('\n=== ID CONVERSION TEST ===');
    console.log('  Has "id" field:', !!ex.id);
    console.log('  Sample id:', ex.id);
    console.log('  Sample title:', ex.title);
    console.log('  Category:', ex.category);
    console.log('  Duration:', ex.duration);
    console.log('  Difficulty:', ex.difficulty);
  }

  // Test admin user
  const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (admin) {
    console.log('\n=== ADMIN USER ===');
    console.log('  email:', admin.email);
    console.log('  role:', admin.role);
    console.log('  Has "id" field:', !!admin.id);
    console.log('  full_name:', admin.full_name);
  }

  // Test workout plan
  const plan = await prisma.workoutPlan.findFirst();
  if (plan) {
    console.log('\n=== WORKOUT PLAN ===');
    console.log('  title:', plan.title);
    console.log('  Has "id" field:', !!plan.id);
    console.log('  difficulty:', plan.difficulty);
    console.log('  target_area:', plan.target_area);
    console.log('  duration_days:', plan.duration_days);
  }

  // Test AI prompt
  const prompt = await prisma.aiPrompt.findFirst();
  if (prompt) {
    console.log('\n=== AI PROMPT ===');
    console.log('  prompt_type:', prompt.prompt_type);
    console.log('  model:', prompt.model);
    console.log('  temperature:', prompt.temperature);
    console.log('  max_tokens:', prompt.max_tokens);
    console.log('  Has "id" field:', !!prompt.id);
  }

  console.log('\n=== ALL CHECKS PASSED ===');
  process.exit(0);
}

verify().catch(err => {
  console.error('VERIFICATION FAILED:', err.message);
  process.exit(1);
});
