'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, MapPin, Globe } from 'lucide-react';

export default function AboutPage() {
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
          Giới Thiệu
        </h1>
        <div className="w-10"></div>
      </div>

      {/* Main about info */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-850 dark:text-white">Về TheraHome</h2>
          <span className="text-[10px] text-slate-400 font-bold block mt-1">Phiên bản 1.0.0</span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-indigo-50/40 dark:bg-indigo-950/15 p-4 rounded-2xl">
          TheraHome là ứng dụng chăm sóc sức khỏe cột sống thông minh, được thiết kế để giúp bạn quản lý và cải thiện tình trạng đau cổ, đau lưng một cách hiệu quả tại nhà.
        </p>

        {/* Feature list */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-black text-indigo-650 uppercase tracking-wider">Tính năng chính</h3>
          <ul className="text-xs text-slate-500 space-y-1.5 list-disc pl-4 leading-relaxed">
            <li>Theo dõi mức độ đau cột sống, cổ, vai, gáy hàng ngày.</li>
            <li>Bài tập vật lý trị liệu phục hồi chức năng cá nhân hóa.</li>
            <li>Đề xuất vật lý sinh hoạt & trị liệu theo thể trạng.</li>
            <li>Nhắc nhở rèn luyện tư thế, uống nước đều đặn.</li>
            <li>Trợ lý Groq AI tư vấn và giải đáp y tế 24/7.</li>
          </ul>
        </div>

        {/* Mission statement */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-black text-indigo-650 uppercase tracking-wider">Sứ mệnh</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Chúng tôi cam kết mang đến giải pháp chăm sóc sức khỏe cơ xương khớp toàn diện, kết hợp công nghệ hiện đại, giúp người dùng giảm đau nhanh chóng và bền vững.
          </p>
        </div>

        {/* Contact list */}
        <div className="space-y-3 pt-4 border-t border-slate-50 dark:border-slate-850">
          <h3 className="text-xs font-black text-indigo-650 uppercase tracking-wider">Liên hệ hỗ trợ</h3>
          
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-slate-600 dark:text-slate-350">Bacsilong1974@gmail.com</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-slate-600 dark:text-slate-350">0364.263.552</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-slate-600 dark:text-slate-350">234 Phạm Văn Đồng, Hà Nội</span>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-slate-600 dark:text-slate-350">https://therahome.vn</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
