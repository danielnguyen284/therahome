'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../stores/authStore';
import { api } from '../../../lib/api';
import {
  ArrowLeft,
  User,
  Calendar,
  Ruler,
  Scale,
  Target,
  AlertCircle,
  Award
} from 'lucide-react';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [dietType, setDietType] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setAge(user.age?.toString() || '');
      setGender(user.gender || '');
      setHeight(user.height || '');
      setWeight(user.weight || '');
      setTargetWeight(user.target_weight || '');
      setDietType(user.diet_type || '');
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Vui lòng nhập họ tên');
      return;
    }
    const ageVal = parseInt(age, 10);
    if (!age || isNaN(ageVal) || ageVal < 1 || ageVal > 120) {
      setErrorMsg('Vui lòng nhập tuổi hợp lệ (1-120)');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const updated = await api.put<any>('/auth/profile', {
        full_name: fullName.trim(),
        age: ageVal,
        gender: gender.trim(),
        height: height.trim(),
        weight: weight.trim(),
        target_weight: targetWeight.trim(),
        diet_type: dietType.trim(),
      });

      if (updated) {
        setUser(updated);
        setSuccessMsg('Đã cập nhật thông tin hồ sơ thành công!');
        setTimeout(() => {
          router.back();
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      setErrorMsg('Không thể cập nhật hồ sơ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

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
          Chỉnh Sửa Hồ Sơ
        </h1>
        <div className="w-10"></div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Profile Card Intro */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-2">
          <h2 className="text-sm font-black text-slate-850 dark:text-white">Thông tin cá nhân</h2>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Cập nhật những chỉ số cơ bản giúp ứng dụng cá nhân hóa bài tập trị liệu cột sống chính xác hơn.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border border-rose-100 dark:border-rose-950/40 rounded-2xl p-4 flex gap-2 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-950/40 rounded-2xl p-4 flex gap-2 text-xs">
            <Award className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Input Fields */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 shadow-sm divide-y divide-slate-50 dark:divide-slate-850">
          
          {/* Full Name */}
          <div className="flex items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 bg-slate-50 dark:bg-slate-950 text-indigo-650 rounded-xl flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-white">Họ tên</span>
            </div>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ tên"
              disabled={loading}
              className="text-right text-xs bg-transparent border-none outline-none focus:ring-0 text-slate-600 dark:text-slate-300 w-full max-w-xs"
            />
          </div>

          {/* Age */}
          <div className="flex items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 bg-slate-50 dark:bg-slate-950 text-indigo-650 rounded-xl flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-white">Tuổi</span>
            </div>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Nhập tuổi"
              disabled={loading}
              className="text-right text-xs bg-transparent border-none outline-none focus:ring-0 text-slate-600 dark:text-slate-300 w-full max-w-xs"
            />
          </div>

          {/* Gender */}
          <div className="flex items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 bg-slate-50 dark:bg-slate-950 text-indigo-650 rounded-xl flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-white">Giới tính</span>
            </div>
            <input
              type="text"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              placeholder="Ví dụ: Nam/Nữ"
              disabled={loading}
              className="text-right text-xs bg-transparent border-none outline-none focus:ring-0 text-slate-600 dark:text-slate-300 w-full max-w-xs"
            />
          </div>

          {/* Height */}
          <div className="flex items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 bg-slate-50 dark:bg-slate-950 text-indigo-650 rounded-xl flex items-center justify-center">
                <Ruler className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-white">Chiều cao</span>
            </div>
            <input
              type="text"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="Ví dụ: 175 cm"
              disabled={loading}
              className="text-right text-xs bg-transparent border-none outline-none focus:ring-0 text-slate-600 dark:text-slate-300 w-full max-w-xs"
            />
          </div>

          {/* Weight */}
          <div className="flex items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 bg-slate-50 dark:bg-slate-950 text-indigo-650 rounded-xl flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-white">Cân nặng</span>
            </div>
            <input
              type="text"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Ví dụ: 70 kg"
              disabled={loading}
              className="text-right text-xs bg-transparent border-none outline-none focus:ring-0 text-slate-600 dark:text-slate-300 w-full max-w-xs"
            />
          </div>

          {/* Target Weight */}
          <div className="flex items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 bg-slate-50 dark:bg-slate-950 text-indigo-650 rounded-xl flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-white">Cân nặng mục tiêu</span>
            </div>
            <input
              type="text"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              placeholder="Ví dụ: 65 kg"
              disabled={loading}
              className="text-right text-xs bg-transparent border-none outline-none focus:ring-0 text-slate-600 dark:text-slate-300 w-full max-w-xs"
            />
          </div>



        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-indigo-100 dark:shadow-none transition-all disabled:opacity-50"
        >
          {loading ? 'Đang lưu thay đổi...' : 'Lưu hồ sơ'}
        </button>

      </form>

    </div>
  );
}
