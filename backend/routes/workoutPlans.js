const express = require('express');
const router = express.Router();
const { prisma } = require('../config/db');
const { protect } = require('../middleware/auth');

// GET /api/workout-plans
router.get('/', protect, async (req, res) => {
  try {
    const where = {};
    if (req.query.is_pro !== undefined) where.is_pro = req.query.is_pro === 'true';
    if (req.query.target_area) where.target_area = req.query.target_area;
    if (req.query.age_group) where.age_group = req.query.age_group;
    const plans = await prisma.workoutPlan.findMany({
      where,
      orderBy: { duration_days: 'asc' },
    });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /api/workout-plans/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const plan = await prisma.workoutPlan.findUnique({
      where: { id: req.params.id },
      include: {
        videos: {
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!plan) return res.status(404).json({ error: 'Không tìm thấy plan' });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/workout-plans
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, duration_days, target_area, difficulty, is_pro, age_group, videos } = req.body;
    const plan = await prisma.workoutPlan.create({
      data: {
        title,
        description: description || '',
        duration_days: Number(duration_days),
        target_area,
        difficulty: difficulty || 'easy',
        is_pro: !!is_pro,
        age_group: age_group || 'young',
      }
    });

    if (videos && Array.isArray(videos)) {
      await prisma.video.createMany({
        data: videos.map(v => ({
          workout_plan_id: plan.id,
          order: Number(v.order),
          link: typeof v.link === 'string' ? v.link.trim() : '',
        })).filter(v => v.link),
      });
    }

    res.status(201).json(plan);
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /api/workout-plans/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const { title, description, duration_days, target_area, difficulty, is_pro, age_group, videos } = req.body;
    const plan = await prisma.workoutPlan.update({
      where: { id: req.params.id },
      data: {
        title,
        description: description !== undefined ? description : undefined,
        duration_days: duration_days !== undefined ? Number(duration_days) : undefined,
        target_area,
        difficulty,
        is_pro: is_pro !== undefined ? !!is_pro : undefined,
        age_group,
      },
    });

    if (videos && Array.isArray(videos)) {
      await prisma.video.deleteMany({
        where: { workout_plan_id: req.params.id },
      });

      await prisma.video.createMany({
        data: videos.map(v => ({
          workout_plan_id: req.params.id,
          order: Number(v.order),
          link: typeof v.link === 'string' ? v.link.trim() : '',
        })).filter(v => v.link),
      });
    }

    res.json(plan);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy plan' });
    console.error('Update plan error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// DELETE /api/workout-plans/:id - Cascade deletes PlanExercises automatically via DB constraint
router.delete('/:id', protect, async (req, res) => {
  try {
    await prisma.workoutPlan.delete({ where: { id: req.params.id } });
    res.json({ message: 'Đã xóa' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy plan' });
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /api/workout-plans/:id/exercises
router.get('/:id/exercises', protect, async (req, res) => {
  try {
    const planExercises = await prisma.planExercise.findMany({
      where: { plan_id: req.params.id },
      include: { exercise: true },
      orderBy: [{ day_number: 'asc' }, { order_in_day: 'asc' }],
    });
    res.json(planExercises);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/workout-plans/:id/exercises - Replace all exercises for a plan
router.post('/:id/exercises', protect, async (req, res) => {
  try {
    // Delete old exercises first (important for edit flow)
    await prisma.planExercise.deleteMany({ where: { plan_id: req.params.id } });

    const exercises = req.body.exercises || req.body;
    const planExercises = (Array.isArray(exercises) ? exercises : [exercises]).map(e => ({
      plan_id: req.params.id,
      exercise_id: e.exercise_id,
      day_number: e.day_number,
      order_in_day: e.order_in_day,
    }));

    await prisma.planExercise.createMany({ data: planExercises });
    const result = await prisma.planExercise.findMany({
      where: { plan_id: req.params.id },
      include: { exercise: true },
      orderBy: [{ day_number: 'asc' }, { order_in_day: 'asc' }],
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /api/workout-plans/:planId/progress/:userId
router.get('/:planId/progress/:userId', protect, async (req, res) => {
  try {
    const logs = await prisma.workoutLog.findMany({
      where: {
        user_id: req.params.userId,
        plan_id: req.params.planId,
        is_completed: true,
      },
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
