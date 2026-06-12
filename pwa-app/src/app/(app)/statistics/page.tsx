'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../stores/authStore';
import { api } from '../../../lib/api';
import {
  ArrowLeft,
  Activity,
  Calendar,
  Flame,
  TrendingUp,
  Award,
  CircleDot
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar
} from 'recharts';

interface StatSummary {
  totalWorkouts: number;
  totalDays: number;
  currentStreak: number;
  painLogs: number;
  avgPainLevel: number;
}

export default function StatisticsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatSummary>({
    totalWorkouts: 0,
    totalDays: 0,
    currentStreak: 0,
    painLogs: 0,
    avgPainLevel: 0,
  });

  const [painChartData, setPainChartData] = useState<any[]>([]);
  const [workoutChartData, setWorkoutChartData] = useState<any[]>([]);
  const [streakCalendar, setStreakCalendar] = useState<{ [key: string]: boolean }>({});

  const calculateStreak = (workouts: any[]) => {
    if (!workouts.length) return 0;
    const sortedDates = workouts
      .map((w: any) => new Date(w.completed_at || w.created_at).toDateString())
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const uniqueDates = [...new Set(sortedDates)];
    let streak = 0;

    for (let i = 0; i < uniqueDates.length; i++) {
      const date = new Date(uniqueDates[i]);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);

      if (date.toDateString() === expectedDate.toDateString()) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const preparePainChartData = (painLogs: any[]) => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const data = last7Days.map(day => {
      const logsForDay = painLogs.filter((log: any) => log.created_at.startsWith(day));
      const value = logsForDay.length === 0
        ? 0
        : logsForDay.reduce((sum: number, log: any) => sum + log.pain_level, 0) / logsForDay.length;

      const dateObj = new Date(day);
      return {
        name: `${dateObj.getDate()}/${dateObj.getMonth() + 1}`,
        'Mức đau': Math.round(value * 10) / 10,
      };
    });

    setPainChartData(data);
  };

  const prepareWorkoutChartData = (workouts: any[]) => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const data = last7Days.map(day => {
      const count = workouts.filter((w: any) => (w.completed_at || w.created_at).startsWith(day)).length;
      const dateObj = new Date(day);
      return {
        name: `${dateObj.getDate()}/${dateObj.getMonth() + 1}`,
        'Bài tập': count,
      };
    });

    setWorkoutChartData(data);
  };

  const prepareStreakCalendar = (workouts: any[]) => {
    const calendar: { [key: string]: boolean } = {};
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const hasWorkout = workouts.some((w: any) => (w.completed_at || w.created_at).startsWith(dateStr));
      calendar[dateStr] = hasWorkout;
    }
    setStreakCalendar(calendar);
  };

  const loadStatistics = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [workouts, painLogs] = await Promise.all([
        api.get<any[]>(`/exercises/workout-history/${user.id}?limit=1000`),
        api.get<any[]>('/pain-logs')
      ]);

      const workoutList = workouts || [];
      const painList = painLogs || [];

      const uniqueDays = new Set(
        workoutList.map((w: any) => new Date(w.completed_at || w.created_at).toDateString())
      );

      const avgPain = painList.length
        ? painList.reduce((sum: number, log: any) => sum + log.pain_level, 0) / painList.length
        : 0;

      const streak = calculateStreak(workoutList);

      setStats({
        totalWorkouts: workoutList.length,
        totalDays: uniqueDays.size,
        currentStreak: streak,
        painLogs: painList.length,
        avgPainLevel: Math.round(avgPain * 10) / 10,
      });

      preparePainChartData(painList);
      prepareWorkoutChartData(workoutList);
      prepareStreakCalendar(workoutList);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, [user]);

  const getPainColor = (level: number) => {
    if (level <= 3) return 'text-emerald-500';
    if (level <= 6) return 'text-amber-500';
    return 'text-rose-500';
  };

  const renderStreakCalendar = () => {
    const days = Object.keys(streakCalendar).sort().reverse();
    const weeks: string[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <div className="space-y-2">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-2">
            {week.map((day) => {
              const dateObj = new Date(day);
              const hasWorkout = streakCalendar[day];
              const isToday = day === new Date().toISOString().split('T')[0];

              return (
                <div
                  key={day}
                  className={`aspect-square rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${
                    hasWorkout
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-600'
                  } ${isToday ? 'border-2 border-indigo-500' : ''}`}
                >
                  {dateObj.getDate()}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 mt-2">Đang xử lý biểu đồ thống kê...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto space-y-6">
      
      {/* Header toolbar */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-slate-700 dark:text-slate-350"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-black text-slate-850 dark:text-white text-center">
          Thống Kê Cải Thiện
        </h1>
        <div className="w-10"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Total workouts */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-5 rounded-3xl text-white space-y-3 shadow-md">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-black block">{stats.totalWorkouts}</span>
            <span className="text-[10px] opacity-80 font-bold uppercase tracking-wider">Bài tập hoàn thành</span>
          </div>
        </div>

        {/* Days improvements */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 rounded-3xl text-white space-y-3 shadow-md">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-black block">{stats.totalDays}</span>
            <span className="text-[10px] opacity-80 font-bold uppercase tracking-wider">Ngày cải thiện</span>
          </div>
        </div>

        {/* Streak days */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-5 rounded-3xl text-white space-y-3 shadow-md">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-black block">{stats.currentStreak}</span>
            <span className="text-[10px] opacity-80 font-bold uppercase tracking-wider">Ngày liên tiếp</span>
          </div>
        </div>

        {/* Average Pain level */}
        <div className="bg-gradient-to-br from-violet-500 to-violet-600 p-5 rounded-3xl text-white space-y-3 shadow-md">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-black block">{stats.avgPainLevel}/10</span>
            <span className="text-[10px] opacity-80 font-bold uppercase tracking-wider">Mức đau TB</span>
          </div>
        </div>

      </div>

      {/* Pain level chart */}
      {stats.painLogs > 0 && painChartData.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
            Biểu đồ mức độ đau (7 ngày)
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={painChartData}>
                <XAxis dataKey="name" stroke="#8b5cf6" fontSize={10} tickLine={false} />
                <YAxis domain={[0, 10]} stroke="#8b5cf6" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="Mức đau"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Workouts completed chart */}
      {stats.totalWorkouts > 0 && workoutChartData.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
            Bài tập hoàn thành (7 ngày)
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workoutChartData}>
                <XAxis dataKey="name" stroke="#6366f1" fontSize={10} tickLine={false} />
                <YAxis stroke="#6366f1" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                <Bar dataKey="Bài tập" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Pain statistics block */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
          Nhật ký cơn đau
        </h3>
        <div className="divide-y divide-slate-50 dark:divide-slate-850">
          <div className="flex justify-between py-2 text-xs">
            <span className="text-slate-500">Tổng số lần ghi nhận</span>
            <span className="font-bold text-slate-800 dark:text-white">{stats.painLogs}</span>
          </div>
          <div className="flex justify-between py-2 text-xs">
            <span className="text-slate-500">Mức đau trung bình</span>
            <span className={`font-bold ${getPainColor(stats.avgPainLevel)}`}>
              {stats.avgPainLevel}/10
            </span>
          </div>
        </div>
      </div>

      {/* Achievements unlocked */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
          Huy hiệu đạt được
        </h3>
        <div className="grid grid-cols-2 gap-3">
          
          <div className={`p-4 rounded-2xl border text-center space-y-2 ${stats.totalWorkouts >= 1 ? 'border-amber-200 dark:border-amber-950/40 bg-amber-50/30 dark:bg-amber-950/10' : 'border-slate-100 dark:border-slate-850 opacity-40'}`}>
            <Award className="w-8 h-8 text-amber-500 mx-auto" />
            <h4 className="text-xs font-black text-slate-850 dark:text-white">Bước đầu tiên</h4>
            <p className="text-[10px] text-slate-500">Bài tập đầu tiên</p>
          </div>

          <div className={`p-4 rounded-2xl border text-center space-y-2 ${stats.totalDays >= 7 ? 'border-emerald-200 dark:border-emerald-950/40 bg-emerald-50/30 dark:bg-emerald-950/10' : 'border-slate-100 dark:border-slate-850 opacity-40'}`}>
            <Award className="w-8 h-8 text-emerald-500 mx-auto" />
            <h4 className="text-xs font-black text-slate-850 dark:text-white">Kiên trì 1 tuần</h4>
            <p className="text-[10px] text-slate-500">Cải thiện 7 ngày</p>
          </div>

          <div className={`p-4 rounded-2xl border text-center space-y-2 ${stats.currentStreak >= 3 ? 'border-indigo-200 dark:border-indigo-950/40 bg-indigo-50/30 dark:bg-indigo-950/10' : 'border-slate-100 dark:border-slate-850 opacity-40'}`}>
            <Award className="w-8 h-8 text-indigo-650 mx-auto" />
            <h4 className="text-xs font-black text-slate-850 dark:text-white">Chuỗi 3 ngày</h4>
            <p className="text-[10px] text-slate-500">Liên tiếp 3 ngày</p>
          </div>

          <div className={`p-4 rounded-2xl border text-center space-y-2 ${stats.totalWorkouts >= 10 ? 'border-violet-200 dark:border-violet-950/40 bg-violet-50/30 dark:bg-violet-950/10' : 'border-slate-100 dark:border-slate-850 opacity-40'}`}>
            <Award className="w-8 h-8 text-violet-500 mx-auto" />
            <h4 className="text-xs font-black text-slate-850 dark:text-white">Chuyên cần</h4>
            <p className="text-[10px] text-slate-500">Hoàn thành 10 bài tập</p>
          </div>

        </div>
      </div>

      {/* Streak calendar heatmap */}
      {stats.totalWorkouts > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-850 dark:text-white uppercase tracking-wider">
              Lịch cải thiện (30 ngày gần nhất)
            </h3>
          </div>
          <div className="flex items-center justify-end gap-3 text-[10px] text-slate-400 font-bold pb-2 border-b border-slate-50 dark:border-slate-850">
            <div className="flex items-center gap-1">
              <CircleDot className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
              <span>Đã tập</span>
            </div>
            <div className="flex items-center gap-1">
              <CircleDot className="w-3.5 h-3.5 text-slate-300 fill-slate-100 dark:text-slate-800 dark:fill-slate-950" />
              <span>Chưa tập</span>
            </div>
          </div>
          {renderStreakCalendar()}
        </div>
      )}

    </div>
  );
}
