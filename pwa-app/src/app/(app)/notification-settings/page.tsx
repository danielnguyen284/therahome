'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, ShieldCheck } from 'lucide-react';

export default function NotificationSettingsPage() {
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
          Lịch Thông Báo
        </h1>
        <div className="w-10"></div>
      </div>

      <div className="space-y-6">
        
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed max-w-sm mx-auto">
          Khung giờ gửi thông báo được cấu hình tập trung từ xa để nhắc nhở sức khỏe được đồng bộ tốt nhất cho bạn.
        </p>

        {/* Admin control details */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 rounded-xl flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-slate-850 dark:text-white">Giờ nhắc nhở mặc định</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Giờ gửi thông báo nhắc tập luyện/vật lý được cấu hình thông minh và đồng bộ tự động. Bạn không cần bận tâm thiết lập thủ công khung giờ.
          </p>
        </div>

        {/* User permissions notice */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-slate-850 dark:text-white">Quyền nhận thông báo</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Bạn vẫn hoàn toàn kiểm soát quyền cho phép nhận thông báo của TheraHome bằng cách bật/tắt quyền thông báo trong mục Cài đặt thiết bị của trình duyệt hoặc điện thoại.
          </p>
        </div>

        {/* Go back */}
        <button
          onClick={() => router.back()}
          className="w-full py-4 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-indigo-100 dark:shadow-none transition-all"
        >
          Quay lại Cài đặt
        </button>

      </div>

    </div>
  );
}
