'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../../lib/api';
import { ArrowLeft, Zap, CheckCircle2, Play, Pause, Square } from 'lucide-react';

const DEVICE_DURATION = 10 * 60; // 10 minutes in seconds

function DeviceUsageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [timeLeft, setTimeLeft] = useState(DEVICE_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [todayPainLog, setTodayPainLog] = useState<any>(null);

  const deviceLevel = parseInt(searchParams.get('level') || '3') || 3;

  useEffect(() => {
    // Fetch today's pain log if present to link to the device usage log
    const fetchPainLog = async () => {
      try {
        const log = await api.get<any>('/pain-logs/today');
        setTodayPainLog(log);
      } catch (err) {
        console.log('No today pain log to link', err);
      }
    };
    fetchPainLog();
  }, []);

  useEffect(() => {
    let interval: any;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleStart = () => {
    setIsRunning(true);
    if (!startedAt) {
      setStartedAt(new Date());
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleComplete = async () => {
    if (isCompleted) return;

    setIsRunning(false);
    setIsCompleted(true);

    const actualDurationSeconds = DEVICE_DURATION - timeLeft;
    const durationMinutes = Math.max(1, Math.floor(actualDurationSeconds / 60));

    try {
      await api.post('/device-usage', {
        pain_log_id: todayPainLog?.id || null,
        device_level: deviceLevel,
        duration_minutes: durationMinutes,
        started_at: startedAt ? startedAt.toISOString() : new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to save device usage:', error);
    }

    // Redirect to daily recommendations after 2 seconds
    setTimeout(() => {
      router.push('/daily-recommendations');
    }, 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = ((DEVICE_DURATION - timeLeft) / DEVICE_DURATION) * 100;

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
          Sử Dụng Thiết Bị
        </h1>
        <div className="w-10"></div>
      </div>

      {/* Device level indicator */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 fill-indigo-650" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-800 dark:text-white">Trị liệu kích thích</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Sóng giảm đau xung điện nhẹ</p>
          </div>
        </div>
        <span className="text-sm font-black bg-indigo-50 dark:bg-indigo-950/50 text-indigo-650 px-4 py-2 rounded-2xl">
          Mức {deviceLevel}
        </span>
      </div>

      {/* Timer Display */}
      <div className="flex flex-col items-center justify-center py-10 space-y-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        
        {/* Progress Ring */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          
          {/* Wave Background Ring */}
          <div className="absolute inset-0 rounded-full border-8 border-slate-50 dark:border-slate-850"></div>
          
          {/* Active wave ring fill */}
          <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 240 240">
            <circle
              cx="120"
              cy="120"
              r="108"
              stroke="#6366f1"
              strokeWidth="8"
              fill="none"
              strokeDasharray={2 * Math.PI * 108}
              strokeDashoffset={2 * Math.PI * 108 * (1 - progressPercent / 100)}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>

          {/* Time text */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-5xl font-black text-slate-800 dark:text-white tabular-nums">
              {formatTime(timeLeft)}
            </span>
            <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">
              {isCompleted ? 'Hoàn thành!' : isRunning ? 'Đang chạy' : 'Sẵn sàng'}
            </span>
          </div>

        </div>

        {/* Action Controls */}
        <div className="w-full flex justify-center gap-4">
          {!isCompleted && (
            <>
              {!isRunning ? (
                <button
                  onClick={handleStart}
                  className="px-8 py-3.5 bg-indigo-650 text-white font-bold text-xs rounded-2xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-md shadow-indigo-100 dark:shadow-none"
                >
                  <Play className="w-4 h-4 fill-white" />
                  {timeLeft === DEVICE_DURATION ? 'Bắt đầu' : 'Tiếp tục'}
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="px-8 py-3.5 bg-amber-500 text-white font-bold text-xs rounded-2xl hover:bg-amber-600 transition-all flex items-center gap-2"
                >
                  <Pause className="w-4 h-4 fill-white" />
                  Tạm dừng
                </button>
              )}

              {timeLeft < DEVICE_DURATION && (
                <button
                  onClick={handleComplete}
                  className="px-6 py-3.5 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 font-bold text-xs rounded-2xl text-slate-600 dark:text-slate-400 flex items-center gap-2"
                >
                  <Square className="w-3.5 h-3.5 fill-slate-405" />
                  Kết thúc sớm
                </button>
              )}
            </>
          )}
        </div>

      </div>

      {/* Manual Instructions */}
      {!isRunning && !isCompleted && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
          <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
            Hướng dẫn trị liệu
          </h4>
          <ol className="text-xs text-slate-500 space-y-2 pl-4 list-decimal leading-relaxed">
            <li>Đính kèm điện cực thiết bị massage lên vùng đau tương ứng.</li>
            <li>Bật nguồn thiết bị và tăng dần cường độ đến mức {deviceLevel}.</li>
            <li>Bấm nút bắt đầu để bắt đầu đếm thời gian.</li>
            <li>Nằm nghỉ ngơi thư giãn và hít thở sâu trong suốt quá trình.</li>
          </ol>
        </div>
      )}

      {/* Completion Modal */}
      {isCompleted && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 text-center space-y-3 shadow-sm animate-pulse">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-black text-slate-850 dark:text-white">Hoàn thành trị liệu!</h3>
          <p className="text-[10px] text-slate-500">Đang lưu nhật ký sử dụng thiết bị...</p>
        </div>
      )}

    </div>
  );
}

export default function DeviceUsagePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-indigo-655 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 mt-2">Đang tải...</p>
      </div>
    }>
      <DeviceUsageContent />
    </Suspense>
  );
}
