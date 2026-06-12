'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../../stores/authStore';
import { api } from '../../../lib/api';
import { ArrowLeft, Play, Pause, RotateCcw, RotateCw, CheckCircle2, ChevronRight, Volume2 } from 'lucide-react';

interface Exercise {
  id: string;
  title: string;
  video_url: string;
  video_urls_by_pain?: {
    no_pain?: string;
    mild?: string;
    moderate?: string;
    severe?: string;
  };
  target_areas?: string[];
  duration: number;
}

interface PlanExercise {
  id: string;
  day_number: number;
  order_in_day: number;
  exercise: Exercise;
}

interface PlanDayVideo {
  id: string;
  workout_plan_id: string;
  order: number;
  link: string;
}

export default function WorkoutSequencePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  const planId = searchParams.get('planId') || '';
  const day = searchParams.get('day') || '';
  const selectedAreaParam = searchParams.get('selectedArea') || '';
  const selectedAreaLabelParam = searchParams.get('selectedAreaLabel') || '';

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dayVideoUrl, setDayVideoUrl] = useState<string | null>(null);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const extractYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const loadExercises = async () => {
    if (!planId || !day) return;
    try {
      setLoading(true);
      const res = await api.get<PlanExercise[]>(`/workout-plans/${planId}/exercises`);
      const normalized = Array.isArray(res) ? res : [];
      
      const dayNum = parseInt(day);
      const dayExercises = normalized.filter((item) => item.day_number === dayNum);
      const exerciseList = dayExercises.map((item) => item.exercise).filter(Boolean);
      setExercises(exerciseList);

      // Resolve video collection for this plan day
      try {
        const dayVideo = await api.get<PlanDayVideo | null>(
          `/videos/resolve?planId=${encodeURIComponent(planId)}&order=${encodeURIComponent(String(dayNum))}`
        );
        if (dayVideo && dayVideo.link) {
          setDayVideoUrl(dayVideo.link);
        }
      } catch (err) {
        console.log('No video resolved from collection, using exercise defaults.', err);
      }
    } catch (err) {
      console.error('Failed to load exercises:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExercises();
  }, [planId, day]);

  const currentExercise = exercises[0] ?? null;

  // Simple pain-routing fallback inside PWA to resolve exercise video URL if no collection video
  const resolvedVideoUrl = useMemo(() => {
    if (dayVideoUrl) return dayVideoUrl;
    if (!currentExercise) return '';

    // Standard fallback structure
    return (
      currentExercise.video_urls_by_pain?.no_pain ||
      currentExercise.video_url ||
      ''
    );
  }, [dayVideoUrl, currentExercise]);

  const isYoutube = resolvedVideoUrl ? isYouTubeUrl(resolvedVideoUrl) : false;
  const youtubeId = isYoutube && resolvedVideoUrl ? extractYouTubeVideoId(resolvedVideoUrl) : null;

  // HTML5 Video event handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setVideoCompleted(true);
  };

  const togglePlay = () => {
    if (isYoutube) {
      setIsPlaying(!isPlaying);
      return;
    }
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (seconds: number) => {
    if (isYoutube) return; // YouTube iframe seeks require Youtube Player API, fallback to default controls
    if (videoRef.current) {
      const newTime = Math.min(Math.max(videoRef.current.currentTime + seconds, 0), duration);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleComplete = async () => {
    if (!user || !planId || !day) return;
    try {
      setSubmitting(true);
      const completedAt = new Date().toISOString();

      // Submit workout log for each exercise of the day
      const promises = exercises.map((ex) =>
        api.post('/exercises/workout-log', {
          exercise_id: ex.id,
          plan_id: planId,
          day_number: parseInt(day),
          is_completed: true,
          completed_at: completedAt,
        })
      );
      await Promise.all(promises);

      // Check for 14-day completion
      if (parseInt(day) === 14) {
        const completedAtDate = new Date();
        const nextDayStart = new Date(completedAtDate);
        nextDayStart.setDate(nextDayStart.getDate() + 1);
        nextDayStart.setHours(0, 0, 0, 0);

        await api.put('/auth/profile', {
          personalized_plan_completed_at: completedAtDate.toISOString(),
          personalized_plan_unlock_at: nextDayStart.toISOString(),
        });
      }

      router.push(`/daily-recommendations?selectedArea=${selectedAreaParam}&selectedAreaLabel=${selectedAreaLabelParam}`);
    } catch (err) {
      console.error('Failed to submit workout logs:', err);
      // Fallback redirect
      router.push(`/daily-recommendations?selectedArea=${selectedAreaParam}&selectedAreaLabel=${selectedAreaLabelParam}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (timeInSecs: number) => {
    const min = Math.floor(timeInSecs / 60);
    const sec = Math.floor(timeInSecs % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 mt-2">Đang thiết lập phòng tập...</p>
      </div>
    );
  }

  if (!currentExercise) {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-4">
        <p className="text-slate-500 text-xs">Không có bài tập nào cho ngày hôm nay.</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      
      {/* Header toolbar */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-slate-700 dark:text-slate-350"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-sm font-black text-slate-850 dark:text-white text-center">
            Đang phục hồi • Ngày {day}
          </h1>
          <p className="text-[10px] text-slate-405 dark:text-slate-400 text-center mt-0.5">
            Lộ trình điều trị công nghệ cao Thera
          </p>
        </div>
        <div className="w-10"></div>
      </div>

      {/* Video Container */}
      <div className="relative aspect-video w-full bg-black rounded-3xl overflow-hidden shadow-lg border border-slate-900 md:rounded-[2rem]">
        {isYoutube && youtubeId ? (
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1`}
            title={currentExercise.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        ) : (
          <video
            ref={videoRef}
            src={resolvedVideoUrl}
            className="w-full h-full object-cover"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleVideoEnded}
            autoPlay
            playsInline
          />
        )}
      </div>

      {/* Progress & Controls - Only show custom controls for HTML5 videos */}
      {!isYoutube && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          
          {/* Progress row */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-slate-450 dark:text-slate-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          {/* Buttons Row */}
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => handleSeek(-10)}
              className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-100 dark:border-slate-850"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 shadow-md shadow-indigo-100 dark:shadow-none"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
            </button>

            <button
              onClick={() => handleSeek(10)}
              className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-100 dark:border-slate-850"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Routine Detail Box */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div>
          <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">Động tác hiện tại</span>
          <h2 className="text-base font-black text-slate-800 dark:text-white mt-0.5">{currentExercise.title}</h2>
        </div>

        <div className="flex gap-4 text-xs">
          <div className="flex-1 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl p-3 text-center">
            <p className="text-slate-400 text-[10px]">Thời lượng đề xuất</p>
            <p className="text-sm font-black text-slate-850 dark:text-slate-205 mt-1">{currentExercise.duration}s</p>
          </div>
          <div className="flex-1 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl p-3 text-center">
            <p className="text-slate-400 text-[10px]">Thiết bị hỗ trợ</p>
            <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-1">Xung điện Thera</p>
          </div>
        </div>

        <button
          onClick={handleComplete}
          disabled={submitting}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-50 dark:shadow-none transition-all disabled:opacity-50"
        >
          {submitting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Hoàn thành phiên tập & Nhận gợi ý
            </>
          )}
        </button>
      </div>

    </div>
  );
}
