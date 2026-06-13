'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../stores/authStore';
import { useThemeStore } from '../../../stores/themeStore';
import { api } from '../../../lib/api';
import {
  Flame,
  Heart,
  Activity,
  Target,
  Sparkles,
  ChevronRight,
  Plus,
  Minus,
  Droplet,
  Smartphone,
  Info,
  Calendar,
  QrCode,
  Sun,
  Moon,
  Lock,
  ClipboardList,
} from 'lucide-react';

interface PainLog {
  id: string;
  date: string;
  pain_level: number;
  pain_areas: Record<string, boolean>;
  notes: string;
}

interface UserBehavior {
  total_workouts: number;
  streak_days: number;
  avg_session_duration: number;
}

interface WaterData {
  cups: number;
  goal: number;
}

interface Tip {
  id: string;
  title: string;
  content: string;
  category: string;
}

interface Product {
  id: string;
  key: string;
  name: string;
  image_url?: string;
  purchase_link?: string;
}

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [todayPainLog, setTodayPainLog] = useState<PainLog | null>(null);
  const [painHistory, setPainHistory] = useState<PainLog[]>([]);
  const [behavior, setBehavior] = useState<UserBehavior>({
    total_workouts: 0,
    streak_days: 0,
    avg_session_duration: 0,
  });
  const [water, setWater] = useState<WaterData>({ cups: 0, goal: 8 });
  const [dailyTip, setDailyTip] = useState<string>('Hãy duy trì tư thế thẳng khi làm việc mỗi ngày!');
  const [nutritionTip, setNutritionTip] = useState<string>('Uống đủ nước giúp các khớp xương hoạt động trơn tru hơn.');
  const [products, setProducts] = useState<Product[]>([]);
  
  // Dialog state
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const [currentTime] = useState(() => Date.now());

  // Personalized Plan Unlock Check
  const personalizedPlanUnlocked = useMemo(() => {
    if (!user) return false;
    if (!user.personalized_plan_completed_at) return false;
    if (!user.personalized_plan_unlock_at) return false;
    const unlockAt = new Date(user.personalized_plan_unlock_at).getTime();
    return currentTime >= unlockAt;
  }, [currentTime, user]);

  // Rotating Motivation Messages
  const motivationMessages = useMemo(() => [
    'Tiếp tục cố gắng! 💪',
    'Bạn làm tốt lắm! 👍',
    'Đừng bỏ cuộc nhé! ✨',
    'Mỗi ngày một chút! 🌟',
    'Sức khỏe là vàng! 💛',
    'Kiên trì sẽ thành công! 🎯',
  ], []);

  const [motivationIdx, setMotivationIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMotivationIdx((prev) => (prev + 1) % motivationMessages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [motivationMessages.length]);

  const motivationText = motivationMessages[motivationIdx];

  // Health Score Calculation based on requirements:
  // score = ((10 - pain_level) * 0.5 + workout_streak * 0.3 + completion_rate * 0.2) * 10
  const healthScore = useMemo(() => {
    const painVal = todayPainLog ? todayPainLog.pain_level : 4; // default baseline pain is 4
    const painScore = (10 - painVal) * 0.5; // 0 to 5 pts
    const streakScore = Math.min(behavior.streak_days, 30) * 0.3; // max 9 pts
    
    // Completion rate calculations
    const completionRate = behavior.total_workouts > 0 
      ? Math.min(behavior.total_workouts / 20, 1) 
      : 0;
    const completionScore = completionRate * 10 * 0.2; // max 2 pts

    const score = Math.round((painScore + streakScore + completionScore) * 10);
    return Math.min(Math.max(score, 10), 100);
  }, [todayPainLog, behavior]);

  // Load Data
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Parallel requests with independent error catches
        const [
          todayPainRes,
          painHistoryRes,
          behaviorRes,
          waterRes,
          healthTipsRes,
          nutritionTipsRes,
          productsRes,
        ] = await Promise.allSettled([
          api.get<PainLog>('/pain-logs/today'),
          api.get<PainLog[]>('/pain-logs?days=7'),
          api.get<UserBehavior>(`/exercises/user-behavior/${user.id}`),
          api.get<WaterData>('/water/today'),
          api.get<Tip[]>('/health-tips?limit=1'),
          api.get<Tip[]>('/nutrition-tips?limit=1'),
          api.get<Product[]>('/products'),
        ]);

        if (todayPainRes.status === 'fulfilled') {
          setTodayPainLog(todayPainRes.value);
        }
        if (painHistoryRes.status === 'fulfilled') {
          setPainHistory(painHistoryRes.value);
        }
        if (behaviorRes.status === 'fulfilled') {
          setBehavior(behaviorRes.value);
        }
        if (waterRes.status === 'fulfilled' && waterRes.value) {
          setWater(waterRes.value);
        }
        if (healthTipsRes.status === 'fulfilled' && healthTipsRes.value?.length) {
          setDailyTip(healthTipsRes.value[0].content);
        }
        if (nutritionTipsRes.status === 'fulfilled' && nutritionTipsRes.value?.length) {
          setNutritionTip(nutritionTipsRes.value[0].content);
        }
        if (productsRes.status === 'fulfilled' && Array.isArray(productsRes.value)) {
          setProducts(productsRes.value);
        }
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Water Increment
  const handleWaterChange = async (delta: number) => {
    const nextCups = Math.max(0, Math.min(water.goal, water.cups + delta));
    setWater((prev) => ({ ...prev, cups: nextCups }));
    try {
      const response = await api.post<WaterData>('/water/increment', {
        delta,
        goal: water.goal,
      });
      if (response) {
        setWater(response);
      }
    } catch (err) {
      console.error('Failed to sync water change:', err);
    }
  };

  // Device recommendation based on pain zone (neck / back)
  const deviceRecommendation = useMemo(() => {
    if (!user) return null;
    const areas = user.pain_areas || [];
    const findProduct = (targets: string[]) =>
      products.find((product) => {
        const key = product.key.toLowerCase();
        const name = product.name.toLowerCase();
        return targets.some((target) => key.includes(target) || name.includes(target));
      });
    
    // Neck device offer
    if (areas.includes('neck') || areas.includes('head')) {
      const product = findProduct(['ech', 'neck']);
      return {
        name: product?.name || 'TheraNECK',
        benefit: 'Giúp giảm mỏi cổ vai gáy với xung nhiệt tự động và tia hồng ngoại.',
        purchaseLink: product?.purchase_link || '',
      };
    }
    // Back device offer
    const product = findProduct(['rung', 'back']);
    return {
      name: product?.name || 'TheraBACK',
      benefit: 'Định hình đốt sống lưng, giảm áp lực cột sống khi ngồi làm việc lâu.',
      purchaseLink: product?.purchase_link || '',
    };
  }, [user, products]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm animate-pulse">Đang chuẩn bị bảng điều khiển của bạn...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10 md:space-y-6">
      {/* Header Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Xin chào, {user?.full_name || 'Người dùng'} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1">
            Bắt đầu ngày mới đầy năng lượng cùng TheraHome!
          </p>
        </div>

        {/* Top Actions: Theme & Streak */}
        <div className="flex items-center gap-3">
          {behavior.streak_days > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Flame className="w-4 h-4 fill-amber-500 animate-bounce" />
              <span className="text-xs font-bold">{behavior.streak_days} Ngày</span>
            </div>
          )}
          
          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition active:scale-95 cursor-pointer shadow-xs"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Health Score Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white shadow-xl shadow-indigo-100 dark:shadow-none">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
        
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white/90 text-sm">Điểm sức khỏe</h3>
              <span className="text-[10px] text-white/60">Tính dựa trên mức độ đau & luyện tập</span>
            </div>
          </div>

          <button
            onClick={() => setShowScoreInfo(true)}
            className="text-white/70 hover:text-white transition-all"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        <div className="my-6 flex items-baseline gap-2">
          <span className="text-5xl font-extrabold tracking-tight">{healthScore}</span>
          <span className="text-white/60 text-lg">/100</span>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-2 w-full bg-white/25 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${healthScore}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[11px] text-white/75 font-medium">
            <span>Cần cải thiện</span>
            <span>Rất tốt</span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 text-xs text-white/95 font-medium transition-all duration-500">
          <Sparkles className="w-4 h-4 fill-white/20 shrink-0 text-amber-300 animate-pulse" />
          <span>{motivationText}</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="p-2.5 w-fit rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-slate-850 dark:text-slate-100">{painHistory.length}</p>
            <p className="text-slate-450 text-[11px] mt-0.5">Ngày theo dõi</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="p-2.5 w-fit rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <Target className="w-5 h-5" />
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-slate-850 dark:text-slate-100">
              {todayPainLog ? `${todayPainLog.pain_level}/10` : '-'}
            </p>
            <p className="text-slate-450 text-[11px] mt-0.5">Mức đau hôm nay</p>
          </div>
        </div>
      </div>

      {/* 14 ngày phục hồi chuyên sâu */}
      <Link
        href="/pain-input"
        className="relative flex min-h-[148px] cursor-pointer flex-col justify-between overflow-hidden rounded-[22px] bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-400 p-4 text-white shadow-lg shadow-emerald-100 transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] dark:shadow-none md:p-6"
      >
        <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/20 blur-2xl"></div>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/25 backdrop-blur-md md:h-12 md:w-12">
            <ClipboardList className="h-5 w-5 text-white md:h-6 md:w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="mb-1.5 inline-flex w-fit rounded-full bg-white/20 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/90">
              Lộ trình 14 ngày
            </span>
            <h3 className="text-base font-black leading-snug text-white md:text-lg">14 ngày phục hồi chuyên sâu</h3>
            <p className="mt-1 text-[11px] leading-snug text-white/85">Theo dõi tiến độ và bắt đầu bài tập hôm nay</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 shadow-sm">
            {todayPainLog ? 'Bắt đầu bài tập' : 'Cập nhật mức đau'}
          </span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/25">
            <ChevronRight className="h-4 w-4 text-white" />
          </span>
        </div>
      </Link>

      {/* Water Tracker Widget */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[160px]">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-slate-850 dark:text-slate-100 text-base flex items-center gap-2 mb-1">
              <Droplet className="w-5 h-5 text-blue-500 fill-blue-500" />
              Nước uống
            </h3>
            <p className="text-[11px] text-slate-450 dark:text-slate-400 leading-relaxed">
              Mục tiêu uống đủ nước giúp hỗ trợ lưu thông máu.
            </p>
          </div>

          <div className="text-right">
            <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{water.cups}</span>
            <span className="text-[11px] text-slate-400 font-medium">/{water.goal} cốc</span>
          </div>
        </div>

        {/* Water progress indicator */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full my-3 overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${Math.min((water.cups / water.goal) * 100, 100)}%` }}
          ></div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleWaterChange(-1)}
            className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-855 text-slate-655 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer active:scale-95"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleWaterChange(1)}
            className="flex-1 py-2 rounded-xl bg-blue-650 hover:bg-blue-700 text-white flex items-center justify-center transition-all shadow-md shadow-blue-100 dark:shadow-none cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cá nhân hoá lộ trình hôm nay */}
      {personalizedPlanUnlocked ? (
        <Link
          href={todayPainLog ? '/recommendations' : '/pain-input?redirectTo=/recommendations'}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-650 p-6 text-white shadow-lg shadow-indigo-150 dark:shadow-none hover:shadow-xl hover:scale-[1.02] active:scale-98 transition-all cursor-pointer flex flex-col justify-between min-h-[148px]"
        >
          <div className="absolute right-0 top-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-lg pointer-events-none"></div>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/25 backdrop-blur-md md:h-12 md:w-12">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="mb-1.5 inline-flex w-fit rounded-full bg-white/20 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/90">
                Cá nhân hóa
              </span>
              <h3 className="text-base font-black leading-snug text-white md:text-lg">Cá nhân hoá lộ trình hôm nay</h3>
              <p className="mt-1 text-[11px] leading-snug text-white/85">Tập luyện phục hồi tối ưu bằng AI</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-indigo-700 shadow-sm">
              Bắt đầu lộ trình
            </span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/25">
              <ChevronRight className="h-4 w-4 text-white" />
            </span>
          </div>
        </Link>
      ) : (
        <div className="relative overflow-hidden rounded-[22px] bg-slate-100 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-6 text-slate-400 dark:text-slate-500 flex flex-col justify-between min-h-[148px]">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-450 dark:text-slate-505">
              <Lock className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="mb-1.5 inline-flex w-fit rounded-full bg-slate-200 dark:bg-slate-800 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500/80 dark:text-slate-400/80">
                Cá nhân hóa
              </span>
              <h3 className="text-base font-black leading-snug text-slate-700 dark:text-slate-350">Cá nhân hoá lộ trình hôm nay</h3>
              <p className="mt-1 text-[11px] leading-snug text-slate-450 dark:text-slate-500">
                Mở khóa vào ngày 15 sau khi hoàn thành ngày 14
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-[9px] font-bold text-slate-450 dark:text-slate-505 uppercase tracking-wider">
            <span>Đang khóa</span>
            <Lock className="w-3.5 h-3.5 opacity-60" />
          </div>
        </div>
      )}

      {/* Daily Tips (Health & Nutrition) */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Lời khuyên trong ngày</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded uppercase">
              Sức khỏe
            </span>
            <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 mt-2.5 leading-relaxed">
              {dailyTip}
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded uppercase">
              Dinh dưỡng
            </span>
            <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 mt-2.5 leading-relaxed">
              {nutritionTip}
            </p>
          </div>
        </div>
      </div>

      {/* Info Modal on Health Score */}
      {showScoreInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-fade-in border border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Cách tính Điểm sức khỏe</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed space-y-2">
              Bảng điểm sức khỏe được tính dựa trên 3 chỉ số quan trọng:
            </p>
            <ul className="text-xs text-slate-600 dark:text-slate-300 list-disc list-inside mt-3 space-y-1.5 leading-relaxed">
              <li><strong className="text-slate-800 dark:text-white">Mức độ đau hôm nay (50%):</strong> Ghi nhận sớm giúp tối ưu cơn đau. Càng đau ít điểm càng cao.</li>
              <li><strong className="text-slate-800 dark:text-white">Chuỗi ngày luyện tập (30%):</strong> Số ngày bạn duy trì tập liên tiếp (streak).</li>
              <li><strong className="text-slate-800 dark:text-white">Tỷ lệ hoàn thành (20%):</strong> Tỷ lệ phần trăm các bài tập bạn hoàn thành đầy đủ trong tháng.</li>
            </ul>
            <button
              onClick={() => setShowScoreInfo(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 transition-all"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
