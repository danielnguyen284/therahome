require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { prisma } = require('../config/db');

async function runTest() {
  const user = await prisma.user.findFirst({
    where: { role: 'user' }
  });

  if (!user) {
    console.error('No regular user found to test with.');
    process.exit(1);
  }

  console.log('Testing update on user:', user.id, user.email);

  const updates = {
    full_name: "Dũng",
    age: 24,
    occupation: "Nhân viên văn phòng",
    gender: "Nam",
    height: "",
    weight: "",
    target_weight: "",
    primary_goal: "Ngủ ngon hơn, Giảm đau mỏi tức thì",
    focus_area: "Lưng & cột sống",
    limitations: "",
    diet_type: "",
    pain_areas: ["back"],
    symptoms: [],
    preferred_time: "20:00",
    notifications_enabled: true,
    onboarding_completed: true,
  };

  try {
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updates,
    });
    console.log('Update succeeded! Result:', updatedUser);
  } catch (error) {
    console.error('Update failed with error:', error);
  }

  process.exit(0);
}

runTest();
