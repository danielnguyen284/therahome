'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Exercise {
  id: string;
  title: string;
  category: string;
}

interface DayExercise {
  id?: string;
  day: number;
  exercise_id: string;
  order: number;
}

export default function EditWorkoutPlanPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  
  // Form data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationDays, setDurationDays] = useState(7);
  const [targetArea, setTargetArea] = useState('neck');
  const [difficulty, setDifficulty] = useState('easy');
  const [isPro, setIsPro] = useState(false);
  const [dayExercises, setDayExercises] = useState<DayExercise[]>([]);

  useEffect(() => {
    loadExercises();
    if (params.id) {
      loadPlan();
    }
  }, [params.id]);

  const loadExercises = async () => {
    try {
      const data = await api.get('/exercises');
      setExercises(data || []);
    } catch (error) {
      console.error('Load exercises error:', error);
    }
  };

  const loadPlan = async () => {
    try {
      // Load plan
      const planData = await api.get(`/workout-plans/${params.id}`);
      
      setTitle(planData.title);
      setDescription(planData.description || '');
      setDurationDays(planData.duration_days);
      setTargetArea(planData.target_area);
      setDifficulty(planData.difficulty);
      setIsPro(planData.is_pro);

      // Load exercises
      const exercisesData = await api.get(`/workout-plans/${params.id}/exercises`);
      
      const loadedExercises = (exercisesData || []).map((ex: any) => ({
        id: ex._id || ex.id,
        day: ex.day_number,
        exercise_id: ex.exercise_id?._id || ex.exercise_id,
        order: ex.order_in_day,
      }));
      
      setDayExercises(loadedExercises);
    } catch (error) {
      console.error('Load plan error:', error);
    }
  };

  const addExerciseToDay = (day: number) => {
    if (exercises.length === 0) return;
    
    const dayExs = dayExercises.filter(de => de.day === day);
    const newOrder = dayExs.length + 1;
    
    setDayExercises([
      ...dayExercises,
      {
        day,
        exercise_id: exercises[0].id,
        order: newOrder,
      },
    ]);
  };

  const removeExerciseFromDay = (day: number, order: number) => {
    setDayExercises(
      dayExercises
        .filter(de => !(de.day === day && de.order === order))
        .map(de => {
          if (de.day === day && de.order > order) {
            return { ...de, order: de.order - 1 };
          }
          return de;
        })
    );
  };

  const updateExercise = (day: number, order: number, exerciseId: string) => {
    setDayExercises(
      dayExercises.map(de => {
        if (de.day === day && de.order === order) {
          return { ...de, exercise_id: exerciseId };
        }
        return de;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update plan
      await api.put(`/workout-plans/${params.id}`, {
        title,
        description,
        duration_days: durationDays,
        target_area: targetArea,
        difficulty,
        is_pro: isPro,
      });

      // Delete old exercises + insert new ones via backend
      // Backend handles deletion on POST with replace strategy
      if (dayExercises.length > 0) {
        const planExercises = dayExercises.map(de => ({
          exercise_id: de.exercise_id,
          day_number: de.day,
          order_in_day: de.order,
        }));

        await api.post(`/workout-plans/${params.id}/exercises`, { exercises: planExercises });
      }

      router.push('/admin/workout-plans');
    } catch (error) {
      console.error('Update plan error:', error);
      alert('Lỗi khi cập nhật workout plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/workout-plans" className="p-2 hover:bg-slate-100">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Sửa Workout Plan</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Thông tin cơ bản
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tên Plan *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mô tả
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Thời lượng (ngày) *
                </label>
                <input
                  type="number"
                  value={durationDays}
                  onChange={(e) => setDurationDays(parseInt(e.target.value))}
                  className="input"
                  min="1"
                  max="90"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Vùng mục tiêu *
                </label>
                <select
                  value={targetArea}
                  onChange={(e) => setTargetArea(e.target.value)}
                  className="input"
                  required
                >
                  <option value="neck">Cổ</option>
                  <option value="back">Lưng</option>
                  <option value="shoulder">Vai</option>
                  <option value="full_body">Toàn thân</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Độ khó *
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="input"
                  required
                >
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="hard">Khó</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPro"
                checked={isPro}
                onChange={(e) => setIsPro(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="isPro" className="text-sm font-medium text-slate-700">
                Chỉ dành cho PRO
              </label>
            </div>
          </div>
        </div>

        {/* Exercises by Day */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Bài tập theo ngày
          </h2>

          <div className="space-y-6">
            {Array.from({ length: durationDays }, (_, i) => i + 1).map((day) => {
              const dayExs = dayExercises.filter(de => de.day === day);
              
              return (
                <div key={day} className="border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-slate-900">Ngày {day}</h3>
                    <button
                      type="button"
                      onClick={() => addExerciseToDay(day)}
                      className="btn btn-secondary btn-sm"
                    >
                      <Plus size={16} />
                      Thêm bài tập
                    </button>
                  </div>

                  {dayExs.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">
                      Chưa có bài tập nào
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {dayExs.map((de) => (
                        <div key={de.order} className="flex items-center gap-3">
                          <span className="text-sm text-slate-600 w-8">
                            {de.order}.
                          </span>
                          <select
                            value={de.exercise_id}
                            onChange={(e) => updateExercise(day, de.order, e.target.value)}
                            className="input flex-1"
                          >
                            {exercises.map((ex) => (
                              <option key={ex.id} value={ex.id}>
                                {ex.title}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => removeExerciseFromDay(day, de.order)}
                            className="p-2 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Link href="/admin/workout-plans" className="btn btn-secondary">
            Hủy
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Đang lưu...' : 'Cập nhật'}
          </button>
        </div>
      </form>
    </div>
  );
}
