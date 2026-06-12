'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield, Eye, Lock } from 'lucide-react';

export default function PrivacyPage() {
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
          Chính Sách Bảo Mật
        </h1>
        <div className="w-10"></div>
      </div>

      {/* Main privacy card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-850 dark:text-white">Bảo mật thông tin của bạn</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Cập nhật lần cuối: 10/06/2026</p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-850 dark:text-white flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-slate-400" />
              1. Thu thập thông tin
            </h3>
            <p>
              Chúng tôi chỉ thu thập các thông tin cần thiết phục vụ cho việc theo dõi sức khỏe cơ xương khớp của bạn, bao gồm: thông tin tài khoản cá nhân, lịch sử ghi nhận đau đớn, thời gian tập luyện trị liệu, nhật ký uống nước và lịch sử hội thoại với Trợ lý AI.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-850 dark:text-white flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-slate-400" />
              2. Sử dụng thông tin
            </h3>
            <p>
              Thông tin của bạn được sử dụng duy nhất để cá nhân hóa đề xuất tập luyện, chẩn đoán mức đau và tối ưu câu trả lời từ Groq AI. Chúng tôi cam kết không chia sẻ dữ liệu y tế này với bất kỳ bên thứ ba nào vì mục đích thương mại.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-850 dark:text-white flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-slate-400" />
              3. Bảo mật kỹ thuật
            </h3>
            <p>
              Tất cả các kết nối trao đổi dữ liệu từ thiết bị của bạn đến server TheraHome đều được mã hóa SSL/TLS 256-bit. Dữ liệu nhạy cảm được lưu trữ an toàn trên cơ sở dữ liệu Supabase và PostgreSQL.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-850 dark:text-white">
              4. Quyền kiểm soát dữ liệu
            </h3>
            <p>
              Bạn có toàn quyền xóa dữ liệu nhật ký đau đớn hoặc lịch sử cuộc chuyện trò với AI bất cứ lúc nào trực tiếp trong cài đặt ứng dụng.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
