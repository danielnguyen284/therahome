'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Users, Dumbbell, Activity, TrendingUp } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalExercises: 0,
    todayWorkouts: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.get('/users/stats');
      setStats({
        totalUsers: data.totalUsers || 0,
        totalExercises: data.totalExercises || 0,
        todayWorkouts: data.todayWorkouts || 0,
        activeUsers: data.activeUsers || 0,
      });
    } catch (error) {
      console.error('Load stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Tổng người dùng',
      value: stats.totalUsers,
      icon: Users,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
    },
    {
      name: 'Tổng bài tập',
      value: stats.totalExercises,
      icon: Dumbbell,
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
    },
    {
      name: 'Workouts hôm nay',
      value: stats.todayWorkouts,
      icon: Activity,
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-600',
    },
    {
      name: 'Users hoạt động (7 ngày)',
      value: stats.activeUsers,
      icon: TrendingUp,
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white border border-slate-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 ${stat.bgColor} transition-transform hover:scale-110`}>
                  <Icon className={stat.textColor} size={24} />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-slate-600">
                {stat.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Thao tác nhanh
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/exercises"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 text-center transition-all duration-200 hover:shadow-md"
          >
            Quản lý bài tập
          </a>
          <a
            href="/admin/users"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 text-center transition-all duration-200 hover:shadow-md"
          >
            Quản lý users
          </a>
          <a
            href="/admin/codes"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 text-center transition-all duration-200 hover:shadow-md"
          >
            Tạo activation codes
          </a>
        </div>
      </div>
    </div>
  );
}
