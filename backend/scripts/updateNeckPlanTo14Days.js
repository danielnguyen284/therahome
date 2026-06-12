require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { prisma } = require('../config/db');

async function updatePlan() {
  const dryRun = process.argv.includes('--dry-run');

  const targets = await prisma.workoutPlan.findMany({
    where: {
      target_area: 'neck',
      OR: [
        { title: { contains: '7 ngày', mode: 'insensitive' } },
        { description: { contains: '7 ngày', mode: 'insensitive' } },
        { duration_days: 7 },
      ],
    },
  });

  if (!targets.length) {
    console.log('No neck workout plans matching 7-day criteria were found.');
    process.exit(0);
  }

  console.log(`Found ${targets.length} plan(s) to update.`);

  for (const plan of targets) {
    const nextTitle = (plan.title || '').replace(/7 ngày/gi, '14 ngày');
    const nextDescription = (plan.description || '').replace(/7 ngày/gi, '14 ngày');

    console.log(
      `${dryRun ? '[dry-run] ' : ''}${plan.id}: "${plan.title}" (${plan.duration_days} ngày) -> "${nextTitle}" (14 ngày)`
    );

    if (!dryRun) {
      await prisma.workoutPlan.update({
        where: { id: plan.id },
        data: {
          title: nextTitle || plan.title,
          description: nextDescription || plan.description,
          duration_days: 14,
        },
      });
    }
  }

  console.log(`Done (${dryRun ? 'dry-run' : 'write'} mode).`);
  process.exit(0);
}

updatePlan().catch((error) => {
  console.error('Update failed:', error);
  process.exit(1);
});
