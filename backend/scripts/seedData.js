/**
 * Seed data script - Seeds the PostgreSQL with essential data
 * Run: node scripts/seedData.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db');

async function seedData() {
  console.log('🌱 Starting seed...\n');

  // 1. Create admin user
  const email = process.env.ADMIN_EMAIL || 'admin@theraease.vn';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: {
      full_name: 'Admin TheraHome',
      password: hashedPassword,
    },
    create: {
      email,
      full_name: 'Admin TheraHome',
      role: 'admin',
      password: hashedPassword,
    },
  });
  console.log('✅ Admin user ensured and updated');

  // 2. Seed AI Prompts
  const promptCount = await prisma.aiPrompt.count();
  if (promptCount === 0) {
    await prisma.aiPrompt.createMany({
      data: [
        {
          prompt_type: 'recommendation',
          system_prompt: 'Bạn là chuyên gia vật lý trị liệu. Nhiệm vụ của bạn là gợi ý bài tập phù hợp dựa trên tình trạng sức khỏe và hành vi của người dùng. Trả lời bằng tiếng Việt.',
          temperature: 0.7,
          max_tokens: 1000,
          model: 'llama-3.3-70b-versatile',
          is_active: true,
        },
        {
          prompt_type: 'chatbot',
          system_prompt: 'Bạn là trợ lý sức khỏe AI của TheraHome, chuyên về giảm đau cổ, vai, lưng. Hãy trả lời câu hỏi một cách chuyên nghiệp nhưng dễ hiểu. Luôn trả lời bằng tiếng Việt. Khuyến khích người dùng tập trị liệu đều đặn.',
          temperature: 0.7,
          max_tokens: 800,
          model: 'llama-3.3-70b-versatile',
          is_active: true,
        },
        {
          prompt_type: 'tips',
          system_prompt: 'Bạn là chuyên gia sức khỏe. Tạo mẹo sức khỏe ngắn gọn, hữu ích về giảm đau cổ, vai, lưng. Trả lời bằng tiếng Việt.',
          temperature: 0.7,
          max_tokens: 200,
          model: 'llama-3.3-70b-versatile',
          is_active: true,
        },
        {
          prompt_type: 'nutrition',
          system_prompt: 'Bạn là chuyên gia dinh dưỡng. Tạo gợi ý dinh dưỡng cho người bị đau cổ/lưng. Trả lời bằng tiếng Việt, ngắn gọn 2-3 câu.',
          temperature: 0.7,
          max_tokens: 200,
          model: 'llama-3.3-70b-versatile',
          is_active: true,
        },
      ],
    });
    console.log('✅ AI Prompts seeded (4 prompts)');
  }

  // 3. Seed sample exercises
  const exerciseCount = await prisma.exercise.count();
  if (exerciseCount === 0) {
    await prisma.exercise.createMany({
      data: [
        {
          title: 'Xoay cổ nhẹ nhàng',
          description: 'Bài tập xoay cổ cơ bản giúp giảm căng thẳng vùng cổ',
          video_url: 'https://www.youtube.com/watch?v=example1',
          video_url_no_pain: 'https://www.youtube.com/watch?v=example1',
          video_url_mild: 'https://www.youtube.com/watch?v=example1',
          video_url_moderate: 'https://www.youtube.com/watch?v=example1',
          video_url_severe: 'https://www.youtube.com/watch?v=example1',
          thumbnail_url: '',
          duration: 300,
          calories: 20,
          difficulty: 'easy',
          target_areas: ['neck'],
          category: 'neck',
          tags: ['cổ', 'người mới', 'nhẹ nhàng'],
          instructions: [
            { step: 1, text: 'Ngồi thẳng lưng, thả lỏng vai' },
            { step: 2, text: 'Từ từ xoay cổ sang trái rồi sang phải' },
            { step: 3, text: 'Lặp lại 10 lần mỗi bên' }
          ],
          benefits: ['Giảm đau cổ', 'Tăng linh hoạt', 'Giảm căng thẳng'],
          is_pro: false,
          order_index: 1,
        },
        {
          title: 'Kéo giãn vai',
          description: 'Bài tập kéo giãn vùng vai giúp giảm đau vai và cổ',
          video_url: 'https://www.youtube.com/watch?v=example2',
          video_url_no_pain: 'https://www.youtube.com/watch?v=example2',
          video_url_mild: 'https://www.youtube.com/watch?v=example2',
          video_url_moderate: 'https://www.youtube.com/watch?v=example2',
          video_url_severe: 'https://www.youtube.com/watch?v=example2',
          thumbnail_url: '',
          duration: 300,
          calories: 25,
          difficulty: 'easy',
          target_areas: ['shoulder_left', 'shoulder_right'],
          category: 'shoulder',
          tags: ['vai', 'người mới'],
          instructions: [
            { step: 1, text: 'Đứng thẳng, hai tay buông tự nhiên' },
            { step: 2, text: 'Nâng vai lên cao, giữ 5 giây' },
            { step: 3, text: 'Thả lỏng vai xuống, lặp lại 15 lần' }
          ],
          benefits: ['Giảm đau vai', 'Giảm căng cơ'],
          is_pro: false,
          order_index: 2,
        },
        {
          title: 'Kéo giãn lưng trên',
          description: 'Bài tập kéo giãn lưng trên, giảm đau cho dân văn phòng',
          video_url: 'https://www.youtube.com/watch?v=example3',
          video_url_no_pain: 'https://www.youtube.com/watch?v=example3',
          video_url_mild: 'https://www.youtube.com/watch?v=example3',
          video_url_moderate: 'https://www.youtube.com/watch?v=example3',
          video_url_severe: 'https://www.youtube.com/watch?v=example3',
          thumbnail_url: '',
          duration: 420,
          calories: 30,
          difficulty: 'medium',
          target_areas: ['upper_back'],
          category: 'upper_back',
          tags: ['lưng', 'văn phòng'],
          instructions: [
            { step: 1, text: 'Ngồi trên ghế, hai tay đan trước ngực' },
            { step: 2, text: 'Cong lưng về phía trước, giữ 10 giây' }
          ],
          benefits: ['Giảm đau lưng trên', 'Cải thiện tư thế'],
          is_pro: false,
          order_index: 3,
        },
        {
          title: 'Cat-Cow Stretch',
          description: 'Bài tập phối hợp lưng giữa và lưng dưới theo kiểu yoga',
          video_url: 'https://www.youtube.com/watch?v=example4',
          video_url_no_pain: 'https://www.youtube.com/watch?v=example4',
          video_url_mild: 'https://www.youtube.com/watch?v=example4',
          video_url_moderate: 'https://www.youtube.com/watch?v=example4',
          video_url_severe: 'https://www.youtube.com/watch?v=example4',
          thumbnail_url: '',
          duration: 600,
          calories: 40,
          difficulty: 'medium',
          target_areas: ['middle_back', 'lower_back'],
          category: 'middle_back',
          tags: ['yoga', 'lưng'],
          instructions: [
            { step: 1, text: 'Quỳ gối, hai tay chống sàn' },
            { step: 2, text: 'Cong lưng lên (cat), giữ 5 giây' },
            { step: 3, text: 'Uốn lưng xuống (cow), giữ 5 giây' }
          ],
          benefits: ['Giảm đau lưng', 'Tăng linh hoạt cột sống'],
          is_pro: false,
          order_index: 4,
        },
        {
          title: 'Bài tập toàn thân nâng cao',
          description: 'Bài tập PRO kết hợp nhiều vùng cơ thể',
          video_url: 'https://www.youtube.com/watch?v=example5',
          video_url_no_pain: 'https://www.youtube.com/watch?v=example5',
          video_url_mild: 'https://www.youtube.com/watch?v=example5',
          video_url_moderate: 'https://www.youtube.com/watch?v=example5',
          video_url_severe: 'https://www.youtube.com/watch?v=example5',
          thumbnail_url: '',
          duration: 900,
          calories: 80,
          difficulty: 'hard',
          target_areas: ['neck', 'shoulder_left', 'shoulder_right', 'upper_back', 'lower_back'],
          category: 'full_body',
          tags: ['nâng cao', 'toàn thân', 'PRO'],
          instructions: [
            { step: 1, text: 'Khởi động 5 phút' },
            { step: 2, text: 'Thực hiện các bài tập theo hướng dẫn video' }
          ],
          benefits: ['Giảm đau toàn diện', 'Tăng sức bền'],
          is_pro: true,
          order_index: 5,
        },
      ],
    });
    console.log('✅ Exercises seeded (5 exercises)');
  }

  // 4. Seed sample workout plan
  await prisma.workoutPlan.deleteMany({});
  console.log('🧹 Cleaned existing workout plans');

  const plansToSeed = [
    {
      title: 'Lộ trình Cổ vai gáy - Dưới 45 tuổi',
      description: 'Bài tập giảm căng cơ, mỏi cổ vai gáy thiết kế riêng cho người trẻ dưới 45 tuổi',
      duration_days: 14,
      target_area: 'neck',
      age_group: 'young',
      difficulty: 'easy',
      is_pro: false,
    },
    {
      title: 'Lộ trình Cổ vai gáy - Từ 45 tuổi trở lên',
      description: 'Bài tập nhẹ nhàng, tăng tính linh hoạt khớp cổ cho người trung và cao tuổi',
      duration_days: 14,
      target_area: 'neck',
      age_group: 'elder',
      difficulty: 'easy',
      is_pro: false,
    },
    {
      title: 'Lộ trình Lưng & cột sống - Dưới 45 tuổi',
      description: 'Lộ trình củng cố cơ cốt lõi (core) và giảm đau mỏi lưng cho người trẻ dưới 45 tuổi',
      duration_days: 14,
      target_area: 'back',
      age_group: 'young',
      difficulty: 'medium',
      is_pro: false,
    },
    {
      title: 'Lộ trình Lưng & cột sống - Từ 45 tuổi trở lên',
      description: 'Bài tập kéo giãn nhẹ nhàng và tăng độ vững chắc cột sống cho người trên 45 tuổi',
      duration_days: 14,
      target_area: 'back',
      age_group: 'elder',
      difficulty: 'easy',
      is_pro: false,
    },
    {
      title: 'Lộ trình Toàn thân - Dưới 45 tuổi',
      description: 'Lộ trình phục hồi toàn diện, cải thiện tư thế và tăng sức mạnh cơ bắp cho người dưới 45 tuổi',
      duration_days: 14,
      target_area: 'full',
      age_group: 'young',
      difficulty: 'medium',
      is_pro: false,
    },
    {
      title: 'Lộ trình Toàn thân - Từ 45 tuổi trở lên',
      description: 'Chương trình vận động toàn thân nhẹ nhàng, hỗ trợ lưu thông khí huyết cho người trên 45 tuổi',
      duration_days: 14,
      target_area: 'full',
      age_group: 'elder',
      difficulty: 'easy',
      is_pro: false,
    },
  ];

  const allExercises = await prisma.exercise.findMany();

  for (const planData of plansToSeed) {
    const plan = await prisma.workoutPlan.create({ data: planData });
    console.log(`✅ Created plan: ${plan.title}`);

    let targetExercises = [];
    if (plan.target_area === 'neck') {
      targetExercises = allExercises.filter(ex => ex.category === 'neck' || ex.category === 'shoulder');
    } else if (plan.target_area === 'back') {
      targetExercises = allExercises.filter(ex => ex.category === 'upper_back' || ex.category === 'middle_back' || ex.category === 'lower_back');
    } else {
      targetExercises = allExercises;
    }

    if (targetExercises.length === 0) {
      targetExercises = allExercises;
    }

    const planExercises = [];
    const planVideos = [];

    for (let day = 1; day <= 14; day++) {
      const ex1 = targetExercises[day % targetExercises.length];
      const ex2 = targetExercises[(day + 1) % targetExercises.length];

      planExercises.push({
        plan_id: plan.id,
        exercise_id: ex1.id,
        day_number: day,
        order_in_day: 1,
      });

      if (ex1.id !== ex2.id) {
        planExercises.push({
          plan_id: plan.id,
          exercise_id: ex2.id,
          day_number: day,
          order_in_day: 2,
        });
      }

      planVideos.push({
        workout_plan_id: plan.id,
        order: day,
        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      });
    }

    await prisma.planExercise.createMany({ data: planExercises });
    await prisma.video.createMany({ data: planVideos });
    console.log(`   - Seeded exercises & 14 daily videos for ${plan.title}`);
  }

  // 5. Seed knowledge base
  const kbCount = await prisma.knowledgeBase.count();
  if (kbCount === 0) {
    await prisma.knowledgeBase.createMany({
      data: [
        { title: 'Tư thế ngồi đúng', content: 'Ngồi thẳng lưng, vai thả lỏng, mắt ngang màn hình. Đặt chân phẳng trên sàn, gối vuông 90 độ.', category: 'tips', tags: ['tư thế', 'văn phòng'] },
        { title: 'Thực phẩm chống viêm', content: 'Cá hồi, quả mọng, rau xanh đậm, nghệ, gừng là những thực phẩm tốt cho người bị đau cổ lưng.', category: 'nutrition', tags: ['dinh dưỡng', 'chống viêm'] },
        { title: 'Dấu hiệu cần gặp bác sĩ', content: 'Nếu đau kéo dài hơn 2 tuần, tê bì tay chân, hoặc đau sau chấn thương, hãy đi khám bác sĩ ngay.', category: 'symptoms', tags: ['cảnh báo', 'bác sĩ'] },
      ],
    });
    console.log('✅ Knowledge base seeded');
  }

  // 6. Seed products
  await prisma.product.upsert({
    where: { key: 'ech' },
    update: {
      name: 'TheraNECK',
      image_url: '/images/anh-sp-theraneck.png',
      purchase_link: 'https://therahome.vn/san-pham/theraneck',
      is_active: true,
    },
    create: {
      key: 'ech',
      name: 'TheraNECK',
      image_url: '/images/anh-sp-theraneck.png',
      purchase_link: 'https://therahome.vn/san-pham/theraneck',
      is_active: true,
    },
  });
  await prisma.product.upsert({
    where: { key: 'rung' },
    update: {
      name: 'TheraBACK',
      image_url: '/images/theraback.png',
      purchase_link: 'https://therahome.vn/san-pham/theraback',
      is_active: true,
    },
    create: {
      key: 'rung',
      name: 'TheraBACK',
      image_url: '/images/theraback.png',
      purchase_link: 'https://therahome.vn/san-pham/theraback',
      is_active: true,
    },
  });
  console.log('✅ Products seeded (TheraNECK & TheraBACK)');

  // 7. Seed motivations (onboarding reviews)
  const motivationCount = await prisma.motivation.count();
  if (motivationCount === 0) {
    await prisma.motivation.createMany({
      data: [
        {
          authorName: 'Khánh An',
          image_url: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=1080',
          rating: 5,
          content: 'Điều tôi yêu thích nhất là ứng dụng giúp tôi duy trì thói quen tập luyện và cảm thấy tốt hơn mỗi ngày.',
          badge: '-13kg',
        },
        {
          authorName: 'Minh Tuấn',
          image_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1080',
          rating: 5,
          content: 'Sau 2 tuần tập luyện theo lộ trình cá nhân hóa của TheraHome, cơn đau lưng của tôi giảm đáng kể.',
          badge: 'Giảm 80% đau',
        },
        {
          authorName: 'Hồng Hạnh',
          image_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1080',
          rating: 4,
          content: 'Giao diện dễ dùng, bài tập được hướng dẫn chi tiết và phù hợp với sức khỏe của mình.',
          badge: 'Sống khỏe',
        },
        {
          authorName: 'Quốc Bảo',
          image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1080',
          rating: 5,
          content: 'Từ ngày có TheraHome, tôi đã hình thành thói quen vận động lành mạnh và hết mỏi vai gáy.',
          badge: 'Cải thiện 95%',
        },
        {
          authorName: 'Thu Trang',
          image_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1080',
          rating: 5,
          content: 'Lộ trình thiết kế riêng cực kỳ hiệu quả, tập 15 phút mỗi ngày vô cùng tiện lợi.',
          badge: 'Tiện lợi & Hiệu quả',
        },
      ],
    });
    console.log('✅ Motivations seeded (5 items)');
  }

  console.log('\n🎉 Seed completed!');
  process.exit(0);
}

seedData().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
