'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, AlertTriangle } from 'lucide-react';

export default function TermsPage() {
  const router = useRouter();

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
          Điều Khoản Dịch Vụ
        </h1>
        <div className="w-10"></div>
      </div>

      {/* Main terms card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-850 dark:text-white">Điều khoản và Điều kiện</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Cập nhật lần cuối: 10/06/2026</p>
          </div>
        </div>

        {/* Warning notification */}
        <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 flex gap-3 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
          <p className="leading-relaxed">
            <strong>Miễn trừ trách nhiệm y tế:</strong> TheraHome cung cấp bài tập và gợi ý sinh hoạt dựa trên dữ liệu nhập từ bạn. Các thông tin và tư vấn từ Trợ lý AI chỉ mang tính chất tham khảo, không thay thế cho chẩn đoán hoặc can thiệp y khoa chuyên sâu từ bác sĩ chuyên ngành.
          </p>
        </div>

        <div className="space-y-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-850 dark:text-white">1. Quy định sử dụng tài khoản</h3>
            <p>
              Khi đăng ký tài khoản TheraHome, bạn chịu trách nhiệm bảo mật mật khẩu của mình. Bạn cũng cần cam kết cung cấp thông tin cân nặng, chiều cao, vùng đau trung thực để hệ thống gợi ý bài tập chuẩn xác nhất.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-850 dark:text-white">2. Quyền sở hữu trí tuệ</h3>
            <p>
              Toàn bộ bài giảng, hình ảnh động, video hướng dẫn và cấu trúc dữ liệu trên hệ thống thuộc quyền sở hữu trí tuệ của TheraHome. Hành vi sao chép trái phép tài nguyên là vi phạm pháp luật.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-850 dark:text-white">3. Tạm ngưng và chấm dứt</h3>
            <p>
              Chúng tôi có quyền khóa hoặc hủy bỏ quyền truy cập ứng dụng của bạn nếu phát hiện hành vi gian lận tài khoản hoặc có nguy cơ xâm nhập phá hoại cơ sở dữ liệu hệ thống.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
