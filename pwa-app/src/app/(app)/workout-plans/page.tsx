'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../../stores/authStore';
import { api } from '../../../lib/api';
import { Calendar, Target, Lock, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';

interface WorkoutPlan {
  id: string;
  title: string;
  description: string;
  target_area: string;
  age_group: string;
  duration_days: number;
  is_pro: boolean;
}

const FIXED_PLAN_DAYS = 14;

export default function WorkoutPlansPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const painAreaParam = searchParams.get('painArea') || '';
  const painAreaLabelParam = searchParams.get('painAreaLabel') || '';

  const loadPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get<WorkoutPlan[]>('/workout-plans');
      if (res && Array.isArray(res)) {
        setPlans(res);
      }
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const mapPainAreaToPlanTargets = (area: string) => {
    switch (area) {
      case 'neck':
      case 'shoulder_left':
      case 'shoulder_right':
        return ['neck', 'both', 'shoulder'];
      case 'upper_back':
      case 'middle_back':
      case 'lower_back':
        return ['upper_back', 'back', 'both'];
      default:
        return area ? [area, 'both'] : [];
    }
  };

  const visiblePlans = useMemo(() => {
    if (!user) return plans;

    const userAge = user.age || 0;
    const ageGroup = userAge < 45 ? 'young' : 'elder';
    
    const activePainArea = painAreaParam || user.pain_areas?.[0] || '';
    const focusArea = activePainArea || user.focus_area || '';
    
    let targetArea = 'full';
    if (focusArea.toLowerCase().includes('cổ') || focusArea.toLowerCase().includes('neck') || focusArea.toLowerCase().includes('vai') || focusArea.toLowerCase().includes('shoulder')) {
      targetArea = 'neck';
    } else if (focusArea.toLowerCase().includes('lưng') || focusArea.toLowerCase().includes('back')) {
      targetArea = 'back';
    }

    const matched = plans.filter((plan) => plan.age_group === ageGroup && plan.target_area === targetArea);
    if (matched.length > 0) return matched;
    
    const areaMatched = plans.filter((plan) => plan.target_area === targetArea);
    if (areaMatched.length > 0) return areaMatched;

    return plans.slice(0, 1);
  }, [plans, painAreaParam, user]);

  const buildPlanTitle = (plan: WorkoutPlan) => {
    if (painAreaLabelParam) {
      return `Lộ trình cải thiện ${painAreaLabelParam.toLocaleLowerCase('vi-VN')} ${FIXED_PLAN_DAYS} ngày`;
    }
    return plan.title.replace(/\d+\s*ngày/i, `${FIXED_PLAN_DAYS} ngày`);
  };

  const handlePlanPress = (plan: WorkoutPlan) => {
    if (plan.is_pro && !user?.is_pro) {
      alert('Lộ trình này yêu cầu tài khoản PRO. Hãy kích hoạt sản phẩm trong trang Cá nhân!');
      return;
    }
    router.push(`/workout-plan-detail/${plan.id}?selectedArea=${painAreaParam}&selectedAreaLabel=${painAreaLabelParam}`);
  };

  const getTargetAreaName = (area: string) => {
    const names: Record<string, string> = {
      neck: 'Cổ',
      shoulder: 'Vai',
      upper_back: 'Lưng trên',
      middle_back: 'Lưng giữa',
      lower_back: 'Lưng dưới',
      arm: 'Tay',
      leg: 'Chân',
      full_body: 'Toàn thân',
      back: 'Lưng',
      both: 'Cổ & Lưng',
    };
    return names[area] || area;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Đang tải các lộ trình...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto space-y-6">
      
      {/* Intro section */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-850 dark:text-white flex items-center gap-2">
          Lộ trình cải thiện
          {painAreaLabelParam && (
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
              {painAreaLabelParam}
            </span>
          )}
        </h1>
        <p className="text-xs text-slate-505 dark:text-slate-400 mt-1">
          Theo dõi tiến độ tập luyện hằng ngày với sự hỗ trợ của các thiết bị thông minh Thera
        </p>
      </div>

      {visiblePlans.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-sm">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-slate-800 dark:text-slate-200 font-bold text-sm">Chưa có lộ trình nào</h3>
          <p className="text-slate-400 text-xs">Hiện hệ thống đang cập nhật thêm các bài tập mới.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {visiblePlans.map((plan) => {
            const isLocked = plan.is_pro && !user?.is_pro;
            return (
              <div
                key={plan.id}
                onClick={() => handlePlanPress(plan)}
                className="group relative overflow-hidden bg-gradient-to-tr from-indigo-600 to-purple-650 text-white rounded-3xl p-6 shadow-md hover:shadow-lg transition-all cursor-pointer min-h-[220px] flex flex-col justify-between"
              >
                
                {/* Header indicators */}
                <div className="flex justify-between items-start">
                  
                  {/* Duration Badge */}
                  <span className="px-3 py-1 bg-white/20 hover:bg-white/30 transition-all rounded-full text-[10px] font-bold flex items-center gap-1.5 backdrop-blur-sm">
                    <Calendar className="w-3.5 h-3.5" />
                    {FIXED_PLAN_DAYS} ngày
                  </span>

                  {/* PRO badge */}
                  {plan.is_pro && (
                    <span className="px-2.5 py-1 bg-black/30 text-amber-300 border border-amber-300/30 rounded-full text-[10px] font-black tracking-wider flex items-center gap-1">
                      {isLocked ? <Lock className="w-3 h-3 text-amber-405" /> : <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                      PRO
                    </span>
                  )}
                </div>

                {/* Plan Title */}
                <div className="mt-8 space-y-2">
                  <h3 className="text-lg md:text-xl font-black leading-tight drop-shadow-sm group-hover:translate-x-1 transition-transform">
                    {buildPlanTitle(plan)}
                  </h3>
                  <p className="text-white/80 text-xs line-clamp-2 leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                {/* Footer with badges */}
                <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="px-2.5 py-0.5 bg-white/10 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-3 h-3" />
                    {painAreaLabelParam || getTargetAreaName(plan.target_area)}
                  </span>
                  
                  <span className="px-4 py-1.5 bg-white text-indigo-700 hover:bg-slate-50 transition-all rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm">
                    {isLocked ? 'Nâng cấp PRO' : 'Bắt đầu ngay'}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Daily tips for workouts */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 space-y-3 shadow-sm">
        <h3 className="text-xs font-black uppercase text-indigo-650 dark:text-indigo-400 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" />
          Lời khuyên luyện tập
        </h3>
        <ul className="text-xs text-slate-600 dark:text-slate-450 space-y-2 leading-relaxed list-disc list-inside">
          <li>Nên khởi động nhẹ khớp vai cổ trong 2 phút trước khi kích hoạt xung điện.</li>
          <li>Kết hợp sử dụng TheraNECK/TheraBACK đều đặn mỗi ngày để thư giãn cơ cơ học sâu.</li>
          <li>Nếu cảm thấy đau tăng cấp độ trong khi tập, hãy tạm ngưng và chuyển sang chế độ chườm ấm hồng ngoại.</li>
        </ul>
      </div>

    </div>
  );
}
