require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { prisma } = require('../config/db');

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasItems(value) {
  return Array.isArray(value) && value.length > 0;
}

function inferOnboardingCompleted(user) {
  // Check user_devices from user's relation
  const ownedDevicesCount = user.user_devices ? user.user_devices.length : 0;

  const signals = {
    fullName: hasText(user.full_name),
    age: Number(user.age) > 0,
    occupation: hasText(user.occupation),
    gender: hasText(user.gender),
    primaryGoal: hasText(user.primary_goal),
    focusArea: hasText(user.focus_area),
    painAreas: hasItems(user.pain_areas),
    symptoms: hasItems(user.symptoms),
    surgeryHistory: hasText(user.surgery_history),
    preferredTime: hasText(user.preferred_time) && user.preferred_time !== '08:00',
    ownedDevices: ownedDevicesCount > 0,
    targetWeight: hasText(user.target_weight),
    limitations: hasText(user.limitations),
    dietType: hasText(user.diet_type),
  };

  const identityReady =
    signals.fullName && (signals.age || signals.occupation || signals.gender);

  const onboardingJourneyReady =
    signals.primaryGoal ||
    signals.focusArea ||
    signals.painAreas ||
    signals.symptoms ||
    signals.surgeryHistory ||
    signals.preferredTime ||
    signals.ownedDevices ||
    signals.targetWeight ||
    signals.limitations ||
    signals.dietType;

  const signalCount = Object.values(signals).filter(Boolean).length;

  return identityReady && (onboardingJourneyReady || signalCount >= 5);
}

async function migrate() {
  const dryRun = process.argv.includes('--dry-run');

  const users = await prisma.user.findMany({
    where: {
      role: { not: 'admin' },
    },
    include: {
      user_devices: true,
    },
  });

  let unchanged = 0;
  let migratedTrue = 0;
  let migratedFalse = 0;

  console.log(`Scanning ${users.length} user(s)...`);

  for (const user of users) {
    const nextValue = inferOnboardingCompleted(user);
    const currentValue = user.onboarding_completed;

    if (currentValue === nextValue) {
      unchanged += 1;
      continue;
    }

    if (!dryRun) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          onboarding_completed: nextValue,
          updated_at: new Date(),
        },
      });
    }

    if (nextValue) {
      migratedTrue += 1;
    } else {
      migratedFalse += 1;
    }

    console.log(
      `${dryRun ? '[dry-run] ' : ''}${user.email} -> onboarding_completed=${nextValue}`
    );
  }

  console.log('\nMigration summary');
  console.log(`- Unchanged: ${unchanged}`);
  console.log(`- Set true: ${migratedTrue}`);
  console.log(`- Set false: ${migratedFalse}`);
  console.log(`- Mode: ${dryRun ? 'dry-run' : 'write'}`);

  process.exit(0);
}

migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
