'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { ArrowLeft, Zap, CheckCircle2 } from 'lucide-react';

const DEVICE_LEVELS = [
  { level: 1, name: 'Mức 1', description: 'Rất nhẹ nhàng', intensity: 'Thư giãn', color: 'bg-emerald-500' },
  { level: 2, name: 'Mức 2', description: 'Nhẹ', intensity: 'Dễ chịu', color: 'bg-emerald-400' },
  { level: 3, name: 'Mức 3', description: 'Trung bình nhẹ', intensity: 'Thoải mái', color: 'bg-amber-300' },
  { level: 4, name: 'Mức 4', description: 'Trung bình', intensity: 'Vừa phải', color: 'bg-amber-500' },
  { level: 5, name: 'Mức 5', description: 'Mạnh', intensity: 'Cảm giác rõ', color: 'bg-orange-500' },
  { level: 6, name: 'Mức 6', description: 'Rất mạnh', intensity: 'Chuyên sâu', color: 'bg-rose-500' },
];

export default function DeviceRecommendationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [recommendedLevel, setRecommendedLevel] = useState(3);
  const [selectedLevel, setSelectedLevel] = useState(3);
  const [todayPainLevel, setTodayPainLevel] = useState<number | null>(null);

  const loadRecommendation = async () => {
    try {
      setLoading(true);
      // Fetch today's pain log if recorded
      const todayPainLog = await api.get<any>('/pain-logs/today');
      
      let level = 3;
      if (todayPainLog) {
        const painLevel = todayPainLog.pain_level;
        setTodayPainLevel(painLevel);

        if (painLevel <= 3) {
          level = Math.min(painLevel, 2) || 1;
        } else if (painLevel <= 6) {
          level = Math.min(Math.floor(painLevel / 2) + 1, 4);
        } else {
          level = Math.min(Math.floor(painLevel / 2) + 1, 6);
        }
      }

      setRecommendedLevel(level);
      setSelectedLevel(level);
    } catch (err) {
      console.error('Failed to generate device recommendation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendation();
  }, []);

  const handleContinue = () => {
    router.push(`/device-usage?level=${selectedLevel}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-indigo-655 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 mt-2">Đang tải mức đề xuất...</p>
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
          Gợi Ý Sử Dụng Thiết Bị
        </h1>
        <div className="w-10"></div>
      </div>

      {/* Intro info card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 text-center space-y-3 shadow-sm">
        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl flex items-center justify-center text-indigo-650 mx-auto">
          <Zap className="w-6 h-6 animate-pulse" />
        </div>
        <h2 className="text-lg font-black text-slate-850 dark:text-white">Chọn mức phù hợp</h2>
        <p className="text-xs text-slate-505 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
          {todayPainLevel !== null 
            ? `Dựa trên mức đau ${todayPainLevel}/10 của bạn ngày hôm nay, chúng tôi khuyến nghị bạn nên sử dụng mức kích thích ${recommendedLevel}.`
            : `Hôm nay bạn chưa ghi nhận cơn đau. Chúng tôi đề xuất mức kích thích an toàn mặc định là mức ${recommendedLevel}.`
          }
        </p>
      </div>

      {/* Levels list */}
      <div className="grid grid-cols-2 gap-4">
        {DEVICE_LEVELS.map((item) => {
          const isSelected = selectedLevel === item.level;
          const isRecommended = item.level === recommendedLevel;

          return (
            <button
              key={item.level}
              onClick={() => setSelectedLevel(item.level)}
              className={`p-5 rounded-3xl border text-left transition-all relative flex flex-col justify-between h-36 bg-white dark:bg-slate-900 ${
                isSelected 
                  ? 'border-indigo-600 ring-2 ring-indigo-650/15' 
                  : isRecommended 
                    ? 'border-emerald-500' 
                    : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <div className={`w-10 h-10 ${item.color} text-white rounded-xl flex items-center justify-center font-black text-base`}>
                  {item.level}
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-5 h-5 text-indigo-650 fill-indigo-650/10" />
                )}
                {isRecommended && !isSelected && (
                  <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/45 px-2 py-0.5 rounded-full uppercase">
                    Gợi ý
                  </span>
                )}
              </div>

              <div className="mt-3">
                <h4 className="text-xs font-black text-slate-800 dark:text-white">{item.name}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">{item.description}</p>
                <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold block mt-1">{item.intensity}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Start button */}
      <button
        onClick={handleContinue}
        className="w-full py-4 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-indigo-100 dark:shadow-none transition-all flex items-center justify-center gap-2"
      >
        <Zap className="w-4 h-4 fill-white" />
        Bắt đầu phiên trị liệu
      </button>

    </div>
  );
}
