'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../../stores/authStore';
import { api } from '../../../lib/api';
import { generateDailyRecommendations } from '../../../lib/groq';
import { Sparkles, Apple, Dumbbell, ArrowLeft } from 'lucide-react';

interface DailyRec {
  nutrition_advice: string;
  sport_advice: string;
}

export default function DailyRecommendationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [nutritionAdvice, setNutritionAdvice] = useState('');
  const [sportAdvice, setSportAdvice] = useState('');

  const selectedAreaParam = searchParams.get('selectedArea') || '';
  const selectedAreaLabelParam = searchParams.get('selectedAreaLabel') || '';

  const loadRecommendations = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      // 1. Try to fetch already generated recommendations from DB
      const dbRecs = await api.get<DailyRec[]>(`/daily-recommendations?date=${today}`);

      if (dbRecs && dbRecs.length > 0) {
        setNutritionAdvice(dbRecs[0].nutrition_advice);
        setSportAdvice(dbRecs[0].sport_advice);
        setLoading(false);
        return;
      }

      // 2. Fetch today's pain log if present to build AI prompt context
      let todayPainLog: any = null;
      try {
        todayPainLog = await api.get<any>('/pain-logs/today');
      } catch (err) {
        console.log('No pain log recorded today, generating general recommendations.', err);
      }

      // 3. Generate new recommendations using Groq AI helper
      const recommendations = await generateDailyRecommendations(todayPainLog);
      
      setNutritionAdvice(recommendations.nutrition);
      setSportAdvice(recommendations.sport);

      // 4. Save generated recommendations to DB
      await api.post('/daily-recommendations', {
        date: today,
        nutrition_advice: recommendations.nutrition,
        sport_advice: recommendations.sport,
      });

    } catch (error) {
      console.error('Failed to load daily recommendations:', error);
      // Clean fallback
      setNutritionAdvice('Bổ sung thêm các loại rau quả nhiều xơ xanh, các béo Omega-3 để giảm phản ứng viêm căng cơ.');
      setSportAdvice('Thực hiện đi bộ nhẹ nhàng hoặc tập yoga thư giãn lưng cổ gáy 15 phút.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, [user]);

  const handleFinish = () => {
    router.push('/home');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-8 h-8 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Trí tuệ nhân tạo Thera đang tổng hợp lời khuyên...</p>
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
          Gợi ý chăm sóc ngày mai
        </h1>
        <div className="w-10"></div>
      </div>

      {/* Intro Message */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 text-center space-y-3 shadow-sm">
        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <h2 className="text-lg font-black text-slate-850 dark:text-white">Hoàn thành xuất sắc!</h2>
        <p className="text-xs text-slate-505 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
          Bạn vừa hoàn thành ngày tập luyện. Dưới đây là lời khuyên về dinh dưỡng và sinh hoạt tối ưu cho thể trạng của bạn ngày mai.
        </p>
      </div>

      {/* Advice Cards */}
      <div className="space-y-4">
        
        {/* Nutrition advice */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
              <Apple className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-slate-850 dark:text-white">Dinh dưỡng khuyên dùng</h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-1">
            {nutritionAdvice}
          </p>
        </div>

        {/* Sport advice */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 rounded-xl flex items-center justify-center shrink-0">
              <Dumbbell className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-slate-850 dark:text-white">Sinh hoạt & Tập luyện</h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-1">
            {sportAdvice}
          </p>
        </div>

      </div>

      {/* Complete button */}
      <button
        onClick={handleFinish}
        className="w-full py-4 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-indigo-100 dark:shadow-none transition-all"
      >
        Trở về Trang chủ
      </button>

    </div>
  );
}
