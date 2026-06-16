'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { ArrowLeft, Droplet, Plus, Minus, Calendar } from 'lucide-react';

interface WaterToday {
  date: string;
  cups: number;
  goal: number;
}

interface WaterWeekDay {
  date: string;
  cups: number;
  goal: number;
}

interface WaterWeekResponse {
  range: { start: string; end: string };
  days: WaterWeekDay[];
  average_cups: number;
}

const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export default function WaterTrackingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState(8);
  const [cups, setCups] = useState(0);
  const [todayDate, setTodayDate] = useState('');
  const [weekDays, setWeekDays] = useState<WaterWeekDay[]>([]);
  const [weekRange, setWeekRange] = useState<{ start: string; end: string } | null>(null);

  const getLocalDateKey = (input = new Date()): string => {
    const year = input.getFullYear();
    const month = String(input.getMonth() + 1).padStart(2, '0');
    const day = String(input.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const toDate = (dateKey: string) => {
    if (!dateKey) return new Date();
    return new Date(`${dateKey}T00:00:00`);
  };

  const toMonthText = (dateKey: string) => {
    const d = toDate(dateKey);
    return `Tháng ${d.getMonth() + 1} ${d.getFullYear()}`;
  };

  const toWeekRangeText = (start: string, end: string) => {
    const s = toDate(start);
    const e = toDate(end);
    return `${String(s.getDate()).padStart(2, '0')}/${s.getMonth() + 1} - ${String(e.getDate()).padStart(2, '0')}/${e.getMonth() + 1}`;
  };

  const toWeekLabel = (dateKey: string) => {
    const d = toDate(dateKey);
    return WEEKDAY_LABELS[d.getDay()];
  };

  const loadWaterData = async () => {
    try {
      setLoading(true);
      const dateKey = getLocalDateKey();
      
      // Fetch today's cups
      const todayRes = await api.get<WaterToday>(`/water/today?date=${encodeURIComponent(dateKey)}`);
      if (todayRes) {
        setTodayDate(todayRes.date);
        setCups(todayRes.cups);
        setGoal(todayRes.goal || 8);
      } else {
        setTodayDate(dateKey);
        setCups(0);
        setGoal(8);
      }

      // Fetch week's cups
      const weekRes = await api.get<WaterWeekResponse>(`/water/week?date=${encodeURIComponent(dateKey)}`);
      if (weekRes) {
        setWeekDays(weekRes.days || []);
        setWeekRange(weekRes.range || null);
      }
    } catch (err) {
      console.error('Failed to load water logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWaterData();
  }, []);

  const handleChange = async (delta: number) => {
    const targetCups = Math.max(0, cups + delta);
    try {
      // Optimistically update
      setCups(targetCups);

      const updated = await api.post<WaterToday>('/water/increment', {
        delta,
        goal,
        date: todayDate,
      });

      if (updated) {
        setCups(updated.cups);
        setGoal(updated.goal);

        // Update the week days array
        setWeekDays((prev) =>
          prev.map((item) =>
            item.date === updated.date ? { ...item, cups: updated.cups, goal: updated.goal } : item
          )
        );
      }
    } catch (err) {
      console.error('Failed to increment water:', err);
    }
  };

  const average = useMemo(() => {
    if (!weekDays.length) return 0;
    const sum = weekDays.reduce((acc, item) => acc + item.cups, 0);
    return parseFloat((sum / weekDays.length).toFixed(1));
  }, [weekDays]);

  const progress = Math.min(1, cups / goal);
  const radius = 55;
  const strokeWidth = 10;
  const circleLength = 2 * Math.PI * radius;
  const strokeDashoffset = circleLength * (1 - progress);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 mt-2">Đang tải lịch trình nước uống...</p>
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
          Theo Dõi Uống Nước
        </h1>
        <div className="w-10"></div>
      </div>

      {/* Ring & Controls Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center justify-between gap-4">
        
        <button
          onClick={() => handleChange(-1)}
          disabled={cups <= 0}
          className="w-12 h-12 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-950 transition-all disabled:opacity-50 text-slate-700 dark:text-slate-200"
        >
          <Minus className="w-5 h-5" strokeWidth={3} />
        </button>

        {/* Circular gauge */}
        <div className="relative w-40 h-40 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
            <circle
              cx="70"
              cy="70"
              r={radius}
              stroke="rgba(56, 189, 248, 0.1)"
              strokeWidth={strokeWidth}
              fill="none"
            />
            <circle
              cx="70"
              cy="70"
              r={radius}
              stroke="#0ea5e9"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circleLength}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <Droplet className="w-5 h-5 text-sky-500 animate-bounce" />
            <span className="text-3xl font-black text-slate-800 dark:text-white mt-1">{cups}</span>
            <span className="text-[10px] font-bold text-slate-400">cốc / mục tiêu {goal}</span>
          </div>
        </div>

        <button
          onClick={() => handleChange(1)}
          className="w-12 h-12 rounded-full bg-sky-500 text-white flex items-center justify-center hover:bg-sky-600 transition-all shadow-md shadow-sky-100 dark:shadow-none"
        >
          <Plus className="w-5 h-5" strokeWidth={3} />
        </button>
      </div>

      {/* Monthly chart block */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
        
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-black text-slate-850 dark:text-white">
              {toMonthText(todayDate)}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Tuần: {weekRange ? toWeekRangeText(weekRange.start, weekRange.end) : ''}
            </p>
          </div>
          <div className="text-right">
            <span className="text-lg font-black text-slate-850 dark:text-white">{average}</span>
            <span className="text-[10px] font-bold text-slate-400 block">Trung bình / ngày</span>
          </div>
        </div>

        {/* Weekly chart bars */}
        <div className="flex justify-between items-end h-32 pt-4 border-b border-slate-50 dark:border-slate-850">
          {weekDays.map((day) => {
            const isToday = day.date === todayDate;
            const barHeightPercent = Math.min(100, (day.cups / Math.max(1, day.goal)) * 100);

            return (
              <div key={day.date} className="flex flex-col items-center space-y-2 w-10">
                
                {/* Visual bar */}
                <div className="w-2.5 h-20 bg-slate-50 dark:bg-slate-950 rounded-full flex flex-col justify-end overflow-hidden">
                  <div
                    className={`w-full rounded-full transition-all duration-300 ${isToday ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-800'}`}
                    style={{ height: `${barHeightPercent}%` }}
                  ></div>
                </div>

                {/* Day label */}
                <span className={`text-[10px] font-bold ${isToday ? 'text-sky-500 font-black' : 'text-slate-400'}`}>
                  {toWeekLabel(day.date)}
                </span>

              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
