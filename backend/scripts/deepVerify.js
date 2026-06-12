/**
 * Deep Schema Verification Script for PostgreSQL & Prisma
 * Compares all Postgres database table columns against the expected schema
 * Run: node scripts/deepVerify.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db');

// Expected columns for tables in Postgres
const EXPECTED_SCHEMA = {
  exercises: [
    'id', 'title', 'description', 'video_url', 'thumbnail_url', 'duration', 'calories',
    'difficulty', 'target_areas', 'category', 'tags', 'instructions', 'benefits',
    'is_pro', 'order_index', 'created_at', 'updated_at'
  ],
  workout_plans: [
    'id', 'title', 'description', 'duration_days', 'target_area', 'difficulty',
    'thumbnail_url', 'is_pro', 'created_at', 'updated_at'
  ],
  plan_exercises: [
    'id', 'plan_id', 'exercise_id', 'day_number', 'order_in_day', 'created_at'
  ],
  users: [
    'id', 'email', 'full_name', 'avatar_url', 'age', 'occupation', 'pain_areas',
    'symptoms', 'surgery_history', 'preferred_time', 'role', 'is_pro',
    'created_at', 'updated_at'
  ],
  pain_logs: [
    'id', 'user_id', 'date', 'pain_areas', 'pain_level', 'notes', 'created_at'
  ],
  ai_prompts: [
    'id', 'prompt_type', 'system_prompt', 'temperature', 'max_tokens', 'model',
    'is_active', 'updated_at'
  ],
  knowledge_base: [
    'id', 'title', 'content', 'category', 'tags', 'created_at'
  ],
  activation_codes: [
    'id', 'code', 'is_used', 'used_by', 'used_at', 'created_at'
  ],
  workout_logs: [
    'id', 'user_id', 'exercise_id', 'plan_id', 'started_at', 'completed_at',
    'is_completed', 'duration_seconds', 'skipped', 'created_at', 'day_number'
  ],
  workout_feedbacks: [
    'id', 'user_id', 'workout_log_id', 'feeling', 'skip_reason', 'comment', 'created_at'
  ],
  chat_histories: [
    'id', 'user_id', 'message', 'role', 'created_at'
  ],
  daily_recommendations: [
    'id', 'user_id', 'date', 'nutrition_advice', 'sport_advice',
    'device_level', 'device_duration', 'created_at'
  ],
  device_usage_logs: [
    'id', 'user_id', 'pain_log_id', 'device_level', 'duration_minutes',
    'started_at', 'completed_at', 'created_at'
  ],
  tips: [
    'id', 'type', 'title', 'content', 'category', 'target_area', 'created_at'
  ],
  notification_tokens: [
    'id', 'user_id', 'token', 'platform', 'created_at'
  ],
};

async function verify() {
  let allPassed = true;
  let totalFields = 0;
  let matchedFields = 0;

  console.log('====================================');
  console.log('  DEEP SCHEMA VERIFICATION (POSTGRES)');
  console.log('====================================\n');

  for (const [tableName, expectedCols] of Object.entries(EXPECTED_SCHEMA)) {
    try {
      // Query column names from PostgreSQL information_schema
      const colsResult = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = ${tableName} AND table_schema = 'public'
      `;

      const actualCols = colsResult.map(c => c.column_name);

      if (actualCols.length === 0) {
        console.log(`❌ Table ${tableName} does not exist!`);
        allPassed = false;
        continue;
      }

      const missing = [];
      const present = [];

      for (const field of expectedCols) {
        if (actualCols.includes(field)) {
          present.push(field);
          matchedFields++;
        } else {
          missing.push(field);
        }
        totalFields++;
      }

      const status = missing.length === 0 ? '✅' : '❌';
      console.log(`${status} ${tableName} (${present.length}/${expectedCols.length} columns)`);

      if (missing.length > 0) {
        console.log(`   MISSING: ${missing.join(', ')}`);
        allPassed = false;
      }
    } catch (err) {
      console.log(`❌ ${tableName} — ERROR: ${err.message}`);
      allPassed = false;
    }
  }

  console.log('\n====================================');
  console.log(`  TOTAL: ${matchedFields}/${totalFields} columns matched`);
  console.log(`  STATUS: ${allPassed ? 'ALL PASSED ✅' : 'ISSUES FOUND ❌'}`);
  console.log('====================================\n');

  // Verify admin login works
  const admin = await prisma.user.findFirst({
    where: { role: 'admin' },
  });

  if (admin) {
    const loginOk = await bcrypt.compare(process.env.ADMIN_PASSWORD || 'admin123', admin.password);
    console.log(`ADMIN LOGIN: ${loginOk ? '✅ Password matches' : '❌ Password WRONG'}`);
    if (!loginOk) allPassed = false;
  } else {
    console.log('ADMIN LOGIN: ❌ Admin user not found!');
    allPassed = false;
  }

  // Check AI prompts are seeded
  const prompts = await prisma.aiPrompt.findMany();
  const expectedTypes = ['recommendation', 'chatbot', 'tips', 'nutrition'];
  const foundTypes = prompts.map(p => p.prompt_type);
  const missingTypes = expectedTypes.filter(t => !foundTypes.includes(t));
  console.log(`\nAI PROMPTS: ${missingTypes.length === 0 ? '✅' : '❌'} (${foundTypes.length}/4 types)`);
  if (missingTypes.length > 0) {
    console.log(`  Missing: ${missingTypes.join(', ')}`);
    allPassed = false;
  }

  console.log('\n====================================');
  console.log(`  FINAL VERDICT: ${allPassed ? '🟢 PRODUCTION READY' : '🔴 NOT READY'}`);
  console.log('====================================');

  process.exit(allPassed ? 0 : 1);
}

verify().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
