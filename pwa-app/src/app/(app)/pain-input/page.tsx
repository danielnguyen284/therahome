'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../stores/authStore';
import { api } from '../../../lib/api';
import { format } from 'date-fns';
import { AlertCircle, Sparkles, TrendingDown, TrendingUp, Minus, Check, Target } from 'lucide-react';
import BodyMap from '../../../components/BodyMap';

interface PainLog {
  id?: string;
  date: string;
  pain_areas: Record<string, number>;
  pain_level: number;
  notes?: string;
}

export default function PainInputPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedAreas, setSelectedAreas] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [successLog, setSuccessLog] = useState<PainLog | null>(null);
  const [comparisonLog, setComparisonLog] = useState<PainLog | null>(null);
  const [aiInsight, setAiInsight] = useState('');

  // Pre-load today's pain log if exists
  useEffect(() => {
    if (!user) return;
    const fetchTodayLog = async () => {
      try {
        const today = await api.get<PainLog>('/pain-logs/today');
        if (today) {
          setSelectedAreas(today.pain_areas || {});
          setNotes(today.notes || '');
          setSuccessLog(today);
          loadComparison(today);
        }
      } catch (err) {
        console.warn('Failed to load today pain log:', err);
      }
    };
    fetchTodayLog();
  }, [user]);

  // Load Yesterday's pain log for comparison
  const loadComparison = async (todayLog: PainLog) => {
    try {
      const history = await api.get<PainLog[]>('/pain-logs?days=7');
      if (history && history.length > 1) {
        const prev = history[1];
        setComparisonLog(prev);
        generateInsight(todayLog, prev);
      } else {
        generateInsight(todayLog, null);
      }
    } catch (err) {
      console.warn('Failed to load history comparison:', err);
    }
  };

  const generateInsight = (today: PainLog, yesterday: PainLog | null) => {
    if (!yesterday) {
      setAiInsight(
        `Hôm nay mức đau của bạn được ghi nhận là ${today.pain_level}/10. Hãy tiếp tục ghi nhận hằng ngày để AI theo dõi chiều hướng phục hồi và đưa ra khuyến nghị bài tập phù hợp nhất.`
      );
      return;
    }

    const diff = today.pain_level - yesterday.pain_level;
    if (diff < 0) {
      setAiInsight(
        `Tuyệt vời! Mức độ đau đã giảm từ ${yesterday.pain_level}/10 xuống còn ${today.pain_level}/10 (giảm ${Math.abs(diff)} điểm). Cơ thể bạn đang đáp ứng tốt với các bài tập phục hồi hiện tại. Hãy tiếp tục duy trì lộ trình này!`
      );
    } else if (diff > 0) {
      setAiInsight(
        `Cảnh báo: Mức độ đau tăng từ ${yesterday.pain_level}/10 lên ${today.pain_level}/10. Khuyên dùng thiết bị TheraNECK/TheraBACK kết hợp nhiệt hồng ngoại ở mức thấp (mức 1-2), giảm cường độ vận động cơ học và dành thêm thời gian nghỉ ngơi.`
      );
    } else {
      setAiInsight(
        `Mức độ đau hôm nay ổn định ở mức ${today.pain_level}/10 so với hôm qua. Bạn nên tiếp tục duy trì đều đặn các bài tập kéo giãn cơ cốt lõi nhẹ nhàng.`
      );
    }
  };

  const handleAreaPress = (area: string, level: number) => {
    setSelectedAreas((prev) => ({
      ...prev,
      [area]: level,
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(selectedAreas).length === 0) return;
    setLoading(true);

    try {
      const values = Object.values(selectedAreas);
      const avgLevel = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;

      const payload = {
        date: format(new Date(), 'yyyy-MM-dd'),
        pain_areas: selectedAreas,
        pain_level: avgLevel,
        notes,
      };

      const result = await api.post<PainLog>('/pain-logs', payload);
      if (result) {
        setSuccessLog(result);
        loadComparison(result);
      }
    } catch (err) {
      alert('Đã xảy ra lỗi khi lưu nhật ký đau. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto space-y-6">

      {/* Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-850 dark:text-white">Ghi nhận mức đau</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Theo dõi sát sao sức khỏe cơ xương khớp của bạn hằng ngày
        </p>
      </div>

      {!successLog ? (
        <div className="space-y-6">
          {/* Interactive Body Map */}
          <BodyMap
            selectedAreas={selectedAreas}
            onAreaPress={handleAreaPress}
          />

          {/* Notes */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Ghi chú triệu chứng thêm (nếu có)
            </label>
            <textarea
              placeholder="VD: Cơn đau nhức mỏi nhói lên khi cúi gập đầu, tê bì ngón tay cái..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 outline-none text-xs text-slate-800 dark:text-slate-200 min-h-[80px]"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || Object.keys(selectedAreas).length === 0}
            className="w-full py-3 bg-indigo-600 disabled:bg-slate-100 text-white disabled:text-slate-400 rounded-2xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 dark:shadow-none"
          >
            {loading ? 'Đang gửi ghi nhận...' : 'Lưu & Phân tích ngay'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Success Summary Banner */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-5 flex items-center gap-4 text-emerald-800 dark:text-emerald-300">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs md:text-sm">Ghi nhận thành công hôm nay!</h3>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                Cập nhật lúc: {format(new Date(), 'HH:mm')}
              </p>
            </div>
          </div>

          {/* Comparison Cards */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">So sánh với hôm qua</h3>

            <div className="flex items-center justify-around">
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400">Hôm qua</p>
                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mt-2">
                  <span className="font-black text-sm text-slate-650 dark:text-slate-350">
                    {comparisonLog ? `${comparisonLog.pain_level}/10` : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center">
                {comparisonLog ? (
                  successLog.pain_level < comparisonLog.pain_level ? (
                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-100">
                      <TrendingDown className="w-5 h-5 stroke-[2.5]" />
                    </div>
                  ) : successLog.pain_level > comparisonLog.pain_level ? (
                    <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-100">
                      <TrendingUp className="w-5 h-5 stroke-[2.5]" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-100">
                      <Minus className="w-5 h-5 stroke-[2.5]" />
                    </div>
                  )
                ) : (
                  <span className="text-[10px] text-slate-400">Mới bắt đầu</span>
                )}
              </div>

              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400">Hôm nay</p>
                <div className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center mt-2 shadow-lg shadow-indigo-150">
                  <span className="font-black text-sm">{successLog.pain_level}/10</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-indigo-650 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-xs font-black uppercase tracking-wider">Tư vấn Phục hồi AI</h3>
            </div>
            <p className="text-slate-650 dark:text-slate-350 text-xs md:text-sm leading-relaxed whitespace-pre-line">
              {aiInsight || 'Đang chuẩn bị tư vấn lộ trình phục hồi...'}
            </p>
          </div>

          {/* Action Button */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setSuccessLog(null)}
              className="flex-1 py-3 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl font-bold text-xs transition-all"
            >
              Cập nhật lại
            </button>
            <button
              onClick={() => router.push('/home')}
              className="flex-1 py-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-100 dark:shadow-none"
            >
              <Target className="w-4 h-4" />
              Xem bài tập phục hồi
            </button>
          </div>
        </div>
      )}

      {/* Warning info box */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 text-amber-800 dark:text-amber-300">
        <AlertCircle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
        <p className="text-[10px] leading-relaxed">
          <strong>Lưu ý y tế:</strong> Nhật ký đau chỉ mang tính chất theo dõi triệu chứng và tư vấn hỗ trợ từ xa. Nếu xuất hiện các triệu chứng đau dữ dội đột ngột, tê liệt cơ thể hoặc khó thở, bạn vui lòng liên hệ ngay cơ sở y tế gần nhất!
        </p>
      </div>

    </div>
  );
}
