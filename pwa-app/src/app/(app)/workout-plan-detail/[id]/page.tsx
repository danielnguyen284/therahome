'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../../../stores/authStore';
import { api } from '../../../../lib/api';
import { Calendar, Lock, CheckCircle, Play, ChevronRight } from 'lucide-react';

interface WorkoutPlan {
  id: string;
  title: string;
  description: string;
  target_area: string;
  duration_days: number;
}

interface PlanExercise {
  id: string;
  day_number: number;
  order_in_day: number;
  exercise: {
    id: string;
    title: string;
    duration: number;
  };
}

interface DayExercises {
  day: number;
  exercises: PlanExercise[];
  isCompleted: boolean;
  isUnlocked: boolean;
}

const FIXED_PLAN_DAYS = 14;

export default function WorkoutPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [dayExercises, setDayExercises] = useState<DayExercises[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDay, setCurrentDay] = useState(1);

  const planId = params.id as string;
  const selectedAreaParam = searchParams.get('selectedArea') || '';
  const selectedAreaLabelParam = searchParams.get('selectedAreaLabel') || '';

  const loadPlanDetail = async () => {
    if (!planId || !user) return;
    try {
      setLoading(true);

      // 1. Fetch Plan details
      const planRes = await api.get<WorkoutPlan>(`/workout-plans/${planId}`);
      if (!planRes) {
        alert('Không tìm thấy lộ trình!');
        router.push('/workout-plans');
        return;
      }
      setPlan(planRes);

      // 2. Fetch Plan exercises
      const exercisesRes = await api.get<PlanExercise[]>(`/workout-plans/${planId}/exercises`);
      const normalizedExercises = Array.isArray(exercisesRes) ? exercisesRes : [];

      // 3. Fetch user's completion progress
      const progressRes = await api.get<any[]>(`/workout-plans/${planId}/progress/${user.id}`);
      const completedDaysSet = new Set<number>(
        progressRes?.map((log) => log.day_number) || []
      );

      // Group exercises by day
      const grouped: Record<number, PlanExercise[]> = {};
      normalizedExercises.forEach((ex) => {
        if (!grouped[ex.day_number]) {
          grouped[ex.day_number] = [];
        }
        grouped[ex.day_number].push(ex);
      });

      // Construct 14 days checklist with unlock conditions
      const daysList: DayExercises[] = [];
      for (let day = 1; day <= FIXED_PLAN_DAYS; day++) {
        const isCompleted = completedDaysSet.has(day);
        // Unlock Day 1, or subsequent days if previous day is completed
        const isUnlocked = day === 1 || completedDaysSet.has(day - 1);

        daysList.push({
          day,
          exercises: grouped[day] || [],
          isCompleted,
          isUnlocked,
        });
      }

      setDayExercises(daysList);

      // Focus on first uncompleted unlocked day
      const firstIncomplete = daysList.find((d) => !d.isCompleted && d.isUnlocked);
      if (firstIncomplete) {
        setCurrentDay(firstIncomplete.day);
      } else {
        // Fallback to day 1 or last day
        setCurrentDay(1);
      }
    } catch (err) {
      console.error('Failed to load plan details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlanDetail();
  }, [planId, user]);

  const handleDayPress = (day: DayExercises) => {
    if (!day.isUnlocked) {
      alert(`Ngày ${day.day} đang tạm khóa. Bạn hãy hoàn thành bài tập của các ngày trước nhé!`);
      return;
    }
    setCurrentDay(day.day);
  };

  const handleStartDay = () => {
    const targetDay = dayExercises.find((d) => d.day === currentDay);
    if (!targetDay || targetDay.exercises.length === 0) {
      alert('Không có bài tập nào được tìm thấy cho ngày này!');
      return;
    }
    router.push(`/workout-sequence?planId=${planId}&day=${currentDay}&selectedArea=${selectedAreaParam}&selectedAreaLabel=${selectedAreaLabelParam}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 mt-2">Đang tải chi tiết lộ trình...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 text-xs">Không tìm thấy dữ liệu lộ trình này.</p>
      </div>
    );
  }

  const completedCount = dayExercises.filter((d) => d.isCompleted).length;
  const progressPercent = Math.round((completedCount / FIXED_PLAN_DAYS) * 100);
  const currentDayData = dayExercises.find((d) => d.day === currentDay);
  return (
    <div className="w-full max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto space-y-6">

      {/* Progress Card */}
      <div className="bg-gradient-to-tr from-indigo-600 to-purple-650 text-white rounded-3xl p-5 md:p-6 shadow-md space-y-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Tiến trình phục hồi</span>
          <h2 className="text-2xl md:text-3xl font-black mt-1">
            {completedCount}/{FIXED_PLAN_DAYS} <span className="text-sm font-bold opacity-80">ngày đã hoàn thành</span>
          </h2>
        </div>
        
        <div className="space-y-1.5">
          <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progressPercent}%` }}></div>
          </div>
          <p className="text-right text-[10px] font-bold opacity-90">{progressPercent}% Hoàn thành</p>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Calendar className="w-4.5 h-4.5 text-indigo-600 animate-pulse" />
          Lịch 14 Ngày Trị Liệu
        </h3>

        {/* 14 Day Grid */}
        <div className="grid grid-cols-5 gap-2.5">
          {dayExercises.map((day) => {
            const isCompleted = day.isCompleted;
            const isUnlocked = day.isUnlocked;
            const isActive = currentDay === day.day;

            return (
              <button
                key={day.day}
                onClick={() => handleDayPress(day)}
                disabled={!isUnlocked}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center border transition-all p-1.5 ${
                  isCompleted
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-50'
                    : !isUnlocked
                    ? 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-900 text-slate-350 dark:text-slate-700 opacity-60'
                    : isActive
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100'
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-750 dark:text-slate-300 hover:border-slate-200'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 fill-current" />
                ) : !isUnlocked ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <span className="text-lg font-black">{day.day}</span>
                )}
                <span className={`text-[8px] font-bold mt-1 ${isCompleted || isActive ? 'text-white/90' : 'text-slate-400'}`}>
                  Ngày {day.day}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day details and Launch Button */}
      {currentDayData && currentDayData.exercises.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <button
            onClick={handleStartDay}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-100 dark:shadow-none transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            {currentDayData.isCompleted ? 'Tập lại ngày này' : 'Bắt đầu trị liệu hôm nay'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
}
