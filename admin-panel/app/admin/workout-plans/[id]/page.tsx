'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Lock } from 'lucide-react';
import Link from 'next/link';

interface Video {
  id: string;
  order: number;
  link: string;
}

interface WorkoutPlan {
  id: string;
  title: string;
  description: string;
  duration_days: number;
  target_area: string;
  age_group: string;
  difficulty: string;
  is_pro: boolean;
  created_at: string;
  videos?: Video[];
}

interface PlanExercise {
  id: string;
  day_number: number;
  order_in_day: number;
  exercise: {
    id: string;
    title: string;
    category: string;
  } | null;
}

export default function ViewWorkoutPlanPage() {
  const params = useParams();
  const router = useRouter();
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [exercises, setExercises] = useState<PlanExercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadPlan();
    }
  }, [params.id]);

  const loadPlan = async () => {
    try {
      // Load plan
      const planData = await api.get(`/workout-plans/${params.id}`);
      setPlan(planData);

      // Load exercises
      const exercisesData = await api.get(`/workout-plans/${params.id}/exercises`);
      
      // Flatten exercise array to single object
      const flattenedExercises = (exercisesData || []).map((item: any) => ({
        ...item,
        exercise: Array.isArray(item.exercise) ? item.exercise[0] : item.exercise
      }));
      
      setExercises(flattenedExercises);
    } catch (error) {
      console.error('Load plan error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Đang tải...</div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 mb-4">Không tìm thấy workout plan</p>
        <Link href="/admin/workout-plans" className="btn btn-primary">
          Quay lại
        </Link>
      </div>
    );
  }

  // Group exercises by day
  const exercisesByDay: { [key: number]: PlanExercise[] } = {};
  exercises.forEach((ex) => {
    if (!exercisesByDay[ex.day_number]) {
      exercisesByDay[ex.day_number] = [];
    }
    exercisesByDay[ex.day_number].push(ex);
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/workout-plans" className="p-2 hover:bg-slate-100">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Chi tiết Workout Plan</h1>
        </div>
        <Link
          href={`/admin/workout-plans/${plan.id}/edit`}
          className="btn btn-primary"
        >
          <Edit size={20} />
          Sửa
        </Link>
      </div>

      {/* Plan Info */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {plan.title}
            </h2>
            <p className="text-slate-600">{plan.description}</p>
          </div>
          {plan.is_pro && (
            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-700">
              <Lock size={16} />
              <span className="text-sm font-medium">PRO</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
          <div>
            <div className="text-sm text-slate-600 mb-1">Thời lượng</div>
            <div className="font-medium text-slate-900">
              {plan.duration_days} ngày
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-600 mb-1">Vùng mục tiêu</div>
            <div className="font-medium text-slate-900">
              {plan.target_area === 'neck' && 'Cổ'}
              {plan.target_area === 'back' && 'Lưng'}
              {plan.target_area === 'shoulder' && 'Vai'}
              {plan.target_area === 'full_body' && 'Toàn thân'}
              {plan.target_area === 'full' && 'Toàn thân'}
              {!['neck', 'back', 'shoulder', 'full_body', 'full'].includes(plan.target_area) && plan.target_area}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-600 mb-1">Độ tuổi</div>
            <div className="font-medium text-slate-900">
              {plan.age_group === 'young' && 'Dưới 45'}
              {plan.age_group === 'elder' && 'Từ 45+'}
              {!['young', 'elder'].includes(plan.age_group) && plan.age_group}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-600 mb-1">Độ khó</div>
            <div className="font-medium text-slate-900">
              {plan.difficulty === 'easy' && 'Dễ'}
              {plan.difficulty === 'medium' && 'Trung bình'}
              {plan.difficulty === 'hard' && 'Khó'}
            </div>
          </div>
        </div>
      </div>

      {/* Exercises by Day */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Bài tập theo ngày
        </h3>

        <div className="space-y-6">
          {Array.from({ length: plan.duration_days }, (_, i) => i + 1).map((day) => {
            const dayExercises = exercisesByDay[day] || [];
            const dayVideo = plan.videos?.find(v => v.order === day);
            
            return (
              <div key={day} className="border border-slate-200 p-4">
                <h4 className="font-medium text-slate-900 mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span>Ngày {day}</span>
                  {dayVideo?.link && (
                    <span className="text-xs text-blue-600 font-normal">
                      Video URL: <a href={dayVideo.link} target="_blank" rel="noopener noreferrer" className="hover:underline break-all">{dayVideo.link}</a>
                    </span>
                  )}
                </h4>

                {dayExercises.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">
                    Chưa có bài tập nào
                  </p>
                ) : (
                  <div className="space-y-2">
                    {dayExercises.map((ex) => (
                      <div
                        key={ex.id}
                        className="flex items-center gap-3 p-3 bg-slate-50"
                      >
                        <span className="text-sm text-slate-600 w-8">
                          {ex.order_in_day}.
                        </span>
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">
                            {ex.exercise?.title || 'N/A'}
                          </div>
                          <div className="text-sm text-slate-600">
                            {ex.exercise?.category || 'N/A'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
