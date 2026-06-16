'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../../stores/authStore';
import { api } from '../../../lib/api';
import { ArrowLeft, Play, CheckCircle2 } from 'lucide-react';

interface PainLog {
  pain_areas?: Record<string, number>;
  pain_level?: number;
}

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
  const [todayPainLog, setTodayPainLog] = useState<PainLog | null>(null);

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

      // Fetch exercises + today pain log in parallel
      const [exercisesRes, painRes] = await Promise.allSettled([
        api.get<PlanExercise[]>(`/workout-plans/${planId}/exercises`),
        api.get<PainLog>('/pain-logs/today'),
      ]);

      if (painRes.status === 'fulfilled' && painRes.value) {
        setTodayPainLog(painRes.value);
      }

      const normalized = exercisesRes.status === 'fulfilled' && Array.isArray(exercisesRes.value)
        ? exercisesRes.value
        : [];

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

  // Pain-routing: mirrors TheraEase-APP/src/utils/painRouting.ts logic
  const resolvedVideoUrl = useMemo(() => {
    if (dayVideoUrl) return dayVideoUrl;
    if (!currentExercise) return '';

    const painVideos = currentExercise.video_urls_by_pain;
    if (!painVideos) return currentExercise.video_url || '';

    // Determine pain key from today's log
    let painKey: 'no_pain' | 'mild' | 'moderate' | 'severe' = 'no_pain';
    if (todayPainLog) {
      const targetAreas = currentExercise.target_areas || [];
      let maxPain = 0;

      if (targetAreas.length > 0 && todayPainLog.pain_areas) {
        // Use the max pain level among target areas
        targetAreas.forEach((area) => {
          const areaLevel = todayPainLog.pain_areas?.[area] ?? 0;
          if (areaLevel > maxPain) maxPain = areaLevel;
        });
        // If no target area matched, fall back to overall pain_level
        if (maxPain === 0) maxPain = todayPainLog.pain_level ?? 0;
      } else {
        maxPain = todayPainLog.pain_level ?? 0;
      }

      if (maxPain === 0) painKey = 'no_pain';
      else if (maxPain <= 3) painKey = 'mild';
      else if (maxPain <= 7) painKey = 'moderate';
      else painKey = 'severe';
    }

    // Fallback chain: painKey -> mild -> moderate -> severe -> no_pain -> video_url
    return (
      painVideos[painKey] ||
      painVideos.mild ||
      painVideos.moderate ||
      painVideos.severe ||
      painVideos.no_pain ||
      currentExercise.video_url ||
      ''
    );
  }, [dayVideoUrl, currentExercise, todayPainLog]);

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
    <div className="landscape-video-container relative select-none">
      {/* Video element / iframe */}
      {isYoutube && youtubeId ? (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1`}
          title={currentExercise.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      ) : (
        <video
          ref={videoRef}
          src={resolvedVideoUrl || ''}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleVideoEnded}
          autoPlay
          playsInline
        />
      )}

      {/* Play/Pause tap overlays for HTML5 video */}
      {!isYoutube && (
        <>
          {!isPlaying ? (
            <button
              onClick={togglePlay}
              className="absolute inset-0 m-auto z-40 w-16 h-16 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all border border-white/20 shadow-xl"
            >
              <Play className="w-8 h-8 fill-current ml-1" />
            </button>
          ) : (
            <div
              onClick={togglePlay}
              className="absolute inset-0 z-30 cursor-pointer"
            />
          )}
        </>
      )}

      {/* Floating Back Button */}
      <button
        onClick={() => router.back()}
        className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 border border-white/25 flex items-center justify-center text-white transition-all shadow-lg backdrop-blur-sm"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Floating Title Badge */}
      <div className="absolute top-4 right-4 z-50 bg-black/60 px-4 py-2.5 rounded-2xl border border-white/15 max-w-[50vw] backdrop-blur-sm pointer-events-none">
        <p className="text-[9px] text-indigo-400 font-black uppercase tracking-wider">Đang trị liệu • Ngày {day}</p>
        <h2 className="text-xs font-black text-white truncate mt-0.5">{currentExercise.title}</h2>
      </div>

      {/* Floating Done Button */}
      <button
        onClick={handleComplete}
        disabled={submitting}
        className={`absolute bottom-4 right-4 z-50 px-6 py-3.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all backdrop-blur-sm ${
          videoCompleted || !isPlaying
            ? 'bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-400'
            : 'bg-white/20 hover:bg-white/35 text-white border border-white/15'
        }`}
      >
        {submitting ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4" />
            {videoCompleted ? 'Hoàn thành' : 'Bỏ qua bài tập'}
          </>
        )}
      </button>
    </div>
  );
}
