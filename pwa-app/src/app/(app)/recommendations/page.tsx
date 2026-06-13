'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../stores/authStore';
import { api } from '../../../lib/api';
import {
  Sparkles,
  ArrowLeft,
  PlayCircle,
  Play,
  Pause,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
} from 'lucide-react';

interface PersonalizedPlanDayVideo {
  id: string;
  _id?: string;
  video_group?: 'regular' | 'device_supported';
  title?: string;
  description?: string;
  link: string;
}

const VIDEO_GROUP_LABELS: Record<string, string> = {
  regular: 'Bài tập đơn',
  device_supported: 'Bài tập sử dụng máy',
};

export default function RecommendationsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<PersonalizedPlanDayVideo[]>([]);
  const [todayPainLog, setTodayPainLog] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  // Video metadata & time tracking for HTML5 video
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const activeVideo = activeIndex !== null ? videos[activeIndex] : null;

  const regularVideosCount = useMemo(
    () => videos.filter((item) => item.video_group === 'regular').length,
    [videos]
  );
  const deviceVideosCount = useMemo(
    () => videos.filter((item) => item.video_group === 'device_supported').length,
    [videos]
  );

  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const extractYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)(?:\&v=)?([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const loadRecommendations = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setErrorMessage('');

      // Fetch today's pain log
      let painLog = null;
      try {
        painLog = await api.get<any>('/pain-logs/today');
        setTodayPainLog(painLog);
      } catch (err) {
        console.log('No pain log recorded today');
      }

      if (!painLog) {
        setErrorMessage('Bạn chưa cập nhật mức đau hôm nay. Vui lòng cập nhật mức đau để nhận lộ trình cá nhân hoá.');
        setLoading(false);
        return;
      }

      // Fetch random video list (6 regular, 1 device supported)
      const res = await api.get<any>('/personalized-plan-videos/random?regularCount=6&deviceCount=1');
      const videoItems = res?.items || [];
      setVideos(videoItems);

      if (videoItems.length === 0) {
        setErrorMessage('Chưa có video nào trong hệ thống. Quản trị viên vui lòng thêm video để tạo lộ trình.');
      }
    } catch (err) {
      console.error('Load recommendations error:', err);
      setErrorMessage('Không thể tải lộ trình video cá nhân hoá. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, [user]);

  const openVideo = (index: number) => {
    setActiveIndex(index);
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(0);
  };

  const closeVideo = () => {
    setActiveIndex(null);
  };

  const handleVideoComplete = () => {
    setActiveIndex(null);
    router.push('/daily-recommendations');
  };

  const handleNextVideo = () => {
    if (activeIndex === null) return;
    if (activeIndex >= videos.length - 1) {
      handleVideoComplete();
      return;
    }
    openVideo(activeIndex + 1);
  };

  const handlePreviousVideo = () => {
    if (activeIndex === null || activeIndex <= 0) return;
    openVideo(activeIndex - 1);
  };

  const handleStartWorkout = () => {
    if (videos.length > 0) {
      openVideo(0);
    }
  };

  // Video elements event handlers
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

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (timeInSecs: number) => {
    const min = Math.floor(timeInSecs / 60);
    const sec = Math.floor(timeInSecs % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const getPainLevelLabel = (level: number) => {
    if (level <= 3) return 'Nhẹ';
    if (level <= 7) return 'Trung bình';
    return 'Nặng';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="w-8 h-8 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Đang tạo lộ trình video cá nhân hoá...</p>
      </div>
    );
  }

  const resolvedVideoUrl = activeVideo?.link || '';
  const isYoutube = resolvedVideoUrl ? isYouTubeUrl(resolvedVideoUrl) : false;
  const youtubeId = isYoutube ? extractYouTubeVideoId(resolvedVideoUrl) : null;

  return (
    <div className="w-full max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto space-y-6 pb-24">
      {/* Header toolbar */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-slate-700 dark:text-slate-350 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-black text-slate-850 dark:text-white text-center">
          Lộ trình cá nhân hoá
        </h1>
        <div className="w-10"></div>
      </div>

      {/* Intro card */}
      <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg shadow-indigo-100 dark:shadow-none">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
            <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Chúng tôi đã chuẩn bị {videos.length} video hôm nay</h2>
            {todayPainLog && (
              <p className="text-white/80 text-[11px] mt-0.5">
                Mức đau hiện tại: <span className="font-bold">{getPainLevelLabel(todayPainLog.pain_level)}</span> ({todayPainLog.pain_level}/10)
              </p>
            )}
          </div>
        </div>
        
        {videos.length > 0 && (
          <p className="text-[11px] text-white/95 mt-4 pt-3 border-t border-white/10 font-medium">
            Đã thiết lập {regularVideosCount} bài tập đơn và {deviceVideosCount} bài tập có sử dụng máy phục hồi.
          </p>
        )}
      </div>

      {errorMessage ? (
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-3xl p-6 text-center space-y-4">
          <p className="text-slate-550 dark:text-slate-400 text-xs md:text-sm">{errorMessage}</p>
          {!todayPainLog && (
            <button
              onClick={() => router.push('/pain-input?redirectTo=/recommendations')}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-indigo-105 cursor-pointer"
            >
              Cập nhật mức đau ngay
            </button>
          )}
        </div>
      ) : videos.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 text-center text-slate-500 text-xs md:text-sm">
          Chưa tìm thấy video phù hợp. Vui lòng liên hệ hỗ trợ.
        </div>
      ) : (
        <div className="space-y-4">
          {videos.map((video, index) => {
            const isDevice = video.video_group === 'device_supported';
            return (
              <div
                key={video.id || video._id || `rec-video-${index}`}
                onClick={() => openVideo(index)}
                className="group relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between gap-4 cursor-pointer"
              >
                {/* Priority Badge */}
                <div className="absolute -top-2.5 -left-2 z-10 bg-indigo-600 text-white text-[11px] font-black rounded-full w-6 h-6 flex items-center justify-center shadow-sm">
                  {index + 1}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <h3 className="font-bold text-slate-850 dark:text-white text-sm md:text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {video.title || `Bài tập ${index + 1}`}
                  </h3>
                  <p className="text-slate-450 dark:text-slate-400 text-[11px] md:text-xs leading-relaxed line-clamp-2">
                    {video.description || 'Bài tập tối ưu hóa theo tình trạng sức khỏe hàng ngày của bạn.'}
                  </p>
                  
                  <div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      isDevice 
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {VIDEO_GROUP_LABELS[video.video_group || 'regular']}
                    </span>
                  </div>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <PlayCircle className="w-6 h-6 fill-current" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer sticky bar */}
      {videos.length > 0 && !errorMessage && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-850 py-4 px-6 z-20 flex flex-col gap-2 max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto rounded-t-3xl shadow-xl">
          <button
            onClick={handleStartWorkout}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <PlayCircle className="w-4 h-4" />
            Bắt đầu tập luyện ngay
          </button>
          
          <button
            onClick={() => router.push('/device-recommendation')}
            className="w-full py-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 font-bold text-xs rounded-2xl border border-slate-200 dark:border-slate-800 transition-all cursor-pointer text-center"
          >
            Bỏ qua, đến gợi ý thiết bị
          </button>
        </div>
      )}

      {/* Sequential Video Player Modal */}
      {activeVideo && activeIndex !== null && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col justify-between text-white p-6">
          
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-indigo-400">
                Lộ trình cá nhân hoá • Bài {activeIndex + 1}/{videos.length}
              </span>
              <h3 className="text-sm font-black text-white line-clamp-1 mt-0.5">
                {activeVideo.title}
              </h3>
            </div>
            <button
              onClick={closeVideo}
              className="w-9 h-9 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Video element */}
          <div className="relative aspect-video w-full bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-white/5 my-auto max-w-3xl mx-auto">
            {isYoutube && youtubeId ? (
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1`}
                title={activeVideo.title}
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
                onEnded={handleNextVideo}
                autoPlay
                playsInline
              />
            )}
          </div>

          {/* Controls and Stats */}
          <div className="max-w-2xl w-full mx-auto space-y-6">
            
            {/* HTML5 video progress */}
            {!isYoutube && duration > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-white/60">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Description & Type */}
            <div className="bg-white/5 rounded-2xl p-4 space-y-2 border border-white/5">
              <span className="text-[9px] font-black uppercase text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                {VIDEO_GROUP_LABELS[activeVideo.video_group || 'regular']}
              </span>
              <p className="text-xs text-white/80 leading-relaxed">
                {activeVideo.description || 'Thực hiện động tác theo hướng dẫn chi tiết của chuyên gia Thera.'}
              </p>
            </div>

            {/* Controls panel */}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={handlePreviousVideo}
                disabled={activeIndex === 0}
                className="flex items-center gap-1.5 px-4 py-3 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Bài trước
              </button>

              {!isYoutube && (
                <button
                  onClick={togglePlay}
                  className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </button>
              )}

              <button
                onClick={handleNextVideo}
                className="flex items-center gap-1.5 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-650"
              >
                {activeIndex === videos.length - 1 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Hoàn thành
                  </>
                ) : (
                  <>
                    Bài tiếp
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
