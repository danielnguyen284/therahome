const express = require('express');
const router = express.Router();
const { prisma } = require('../config/db');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/exercises - Get all exercises (with filters)
router.get('/', protect, async (req, res) => {
  try {
    const { category, is_pro, pain_areas } = req.query;
    const where = {};

    if (category && category !== 'all') where.category = category;
    if (is_pro !== undefined) where.is_pro = is_pro === 'true';

    if (pain_areas) {
      const areas = pain_areas.split(',');
      where.category = { in: areas };
    }

    const exercises = await prisma.exercise.findMany({
      where,
      orderBy: { order_index: 'asc' },
    });
    res.json(exercises);
  } catch (error) {
    console.error('Get exercises error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /api/exercises/:id - Get exercise by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const exercise = await prisma.exercise.findUnique({
      where: { id: req.params.id },
    });
    if (!exercise) return res.status(404).json({ error: 'Không tìm thấy bài tập' });
    res.json(exercise);
  } catch (error) {
    console.error('Get exercise error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/exercises - Create exercise (admin)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const exercise = await prisma.exercise.create({ data: req.body });
    res.status(201).json(exercise);
  } catch (error) {
    console.error('Create exercise error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /api/exercises/:id - Update exercise (admin)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const exercise = await prisma.exercise.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(exercise);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy bài tập' });
    console.error('Update exercise error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// DELETE /api/exercises/:id - Delete exercise (admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await prisma.exercise.delete({ where: { id: req.params.id } });
    res.json({ message: 'Đã xóa bài tập' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Không tìm thấy bài tập' });
    console.error('Delete exercise error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/exercises/workout-log - Log a workout
router.post('/workout-log', protect, async (req, res) => {
  try {
    const { exercise_id, plan_id, day_number, started_at, completed_at, is_completed, skipped, feedback, duration_seconds } = req.body;
    const log = await prisma.workoutLog.create({
      data: {
        user_id: req.user.id,
        exercise_id,
        plan_id: plan_id || null,
        day_number: day_number || null,
        started_at: started_at ? new Date(started_at) : new Date(),
        completed_at: completed_at ? new Date(completed_at) : null,
        is_completed: is_completed || false,
        skipped: skipped || false,
        feedback: feedback || null,
        duration_seconds: duration_seconds || 0,
      },
    });
    res.status(201).json(log);
  } catch (error) {
    console.error('Create workout log error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /api/exercises/workout-log/:id - Update workout log
router.put('/workout-log/:id', protect, async (req, res) => {
  try {
    const existing = await prisma.workoutLog.findFirst({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy log' });

    const log = await prisma.workoutLog.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(log);
  } catch (error) {
    console.error('Update workout log error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /api/exercises/workout-history/:userId - Get workout history
router.get('/workout-history/:userId', protect, async (req, res) => {
  try {
    // Prevent IDOR: users can only access their own data, admins can access any
    if (req.user.role !== 'admin' && req.params.userId !== req.user.id) {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    const limit = parseInt(req.query.limit) || 30;
    const logs = await prisma.workoutLog.findMany({
      where: { user_id: req.params.userId },
      include: { exercise: true },
      orderBy: { created_at: 'desc' },
      take: limit,
    });

    res.json(logs);
  } catch (error) {
    console.error('Get workout history error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /api/exercises/user-behavior/:userId - Get user behavior (computed at runtime)
router.get('/user-behavior/:userId', protect, async (req, res) => {
  try {
    // Prevent IDOR: users can only access their own data, admins can access any
    if (req.user.role !== 'admin' && req.params.userId !== req.user.id) {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    const totalWorkouts = await prisma.workoutLog.count({
      where: { user_id: req.params.userId, is_completed: true },
    });

    // Compute streak from recent completed logs
    const recentLogs = await prisma.workoutLog.findMany({
      where: { user_id: req.params.userId, is_completed: true },
      orderBy: { created_at: 'desc' },
      take: 60,
      select: { created_at: true },
    });

    let streakDays = 0;
    if (recentLogs.length > 0) {
      const dates = [...new Set(recentLogs.map(l => l.created_at.toISOString().slice(0, 10)))].sort().reverse();
      const today = new Date().toISOString().slice(0, 10);
      if (dates[0] === today || dates[0] === new Date(Date.now() - 86400000).toISOString().slice(0, 10)) {
        streakDays = 1;
        for (let i = 1; i < dates.length; i++) {
          const prev = new Date(dates[i - 1]);
          const curr = new Date(dates[i]);
          const diff = (prev - curr) / 86400000;
          if (diff === 1) streakDays++;
          else break;
        }
      }
    }

    const avgDuration = await prisma.workoutLog.aggregate({
      where: { user_id: req.params.userId, is_completed: true },
      _avg: { duration_seconds: true },
    });

    res.json({
      user_id: req.params.userId,
      total_workouts: totalWorkouts,
      streak_days: streakDays,
      favorite_exercises: [],
      avoided_exercises: [],
      avg_session_duration: Math.round(avgDuration._avg.duration_seconds || 0),
    });
  } catch (error) {
    console.error('Get user behavior error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
