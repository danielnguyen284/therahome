'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../stores/authStore';
import { api } from '../../../lib/api';
import {
  User,
  Crown,
  Bell,
  Settings,
  LogOut,
  Calendar,
  Activity,
  BarChart3,
  ChevronRight,
  Shield,
  Moon,
  Volume2,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [activationCode, setActivationCode] = useState('');
  const [showProModal, setShowProModal] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(user?.notifications_enabled ?? true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Count pain areas safely
  const painCount = useMemo(() => {
    if (!user?.pain_areas) return 0;
    return user.pain_areas.length;
  }, [user]);

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.replace('/login');
  };

  // Activate Code
  const handleActivateCode = async () => {
    if (!activationCode.trim() || !user) return;
    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      
      const response = await api.post<{ user: any }>('/codes/activate', {
        code: activationCode.trim(),
      });
      
      if (response && response.user) {
        setUser(response.user);
      } else {
        setUser({ ...user, is_pro: true });
      }

      setSuccessMsg('Kích hoạt gói PRO thành công! 🎉');
      setActivationCode('');
      setTimeout(() => {
        setShowProModal(false);
        setSuccessMsg('');
      }, 1500);
    } catch (err: any) {
      console.error('Activate error:', err);
      setErrorMsg(err.response?.data?.error || 'Mã kích hoạt không đúng hoặc đã được sử dụng.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle Notifications
  const handleToggleNotifications = async () => {
    const nextVal = !notifEnabled;
    setNotifEnabled(nextVal);
    try {
      await api.put('/users/profile', { notifications_enabled: nextVal });
      if (user) {
        setUser({ ...user, notifications_enabled: nextVal });
      }
    } catch (err) {
      console.warn('Failed to update notifications settings:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-lg shadow-indigo-100 dark:shadow-none">
          {user?.full_name?.charAt(0) || <User className="w-10 h-10" />}
        </div>
        
        <h2 className="text-xl font-bold text-slate-850 dark:text-white">
          {user?.full_name || 'Người dùng'}
        </h2>
        <p className="text-slate-400 text-xs mt-1">{user?.occupation || 'Người sử dụng TheraHome'}</p>

        {user?.is_pro ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider mt-4">
            <Crown className="w-3.5 h-3.5 fill-amber-500" />
            Thành viên PRO
          </div>
        ) : (
          <button
            onClick={() => setShowProModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider mt-4 transition-all shadow-md shadow-indigo-150"
          >
            <Crown className="w-3.5 h-3.5 fill-white" />
            Nâng cấp PRO
          </button>
        )}
      </div>

      {/* Profile Demographics Indicators */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-center">
          <Calendar className="w-5 h-5 text-indigo-500 mx-auto mb-2" />
          <span className="block text-lg font-bold text-slate-800 dark:text-white">{user?.age || '--'}</span>
          <span className="text-slate-400 text-[10px]">Tuổi</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-center">
          <Activity className="w-5 h-5 text-indigo-500 mx-auto mb-2" />
          <span className="block text-lg font-bold text-slate-800 dark:text-white">{painCount}</span>
          <span className="text-slate-400 text-[10px]">Vùng đau</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-center">
          <BarChart3 className="w-5 h-5 text-indigo-500 mx-auto mb-2" />
          <span className="block text-lg font-bold text-slate-800 dark:text-white">0</span>
          <span className="text-slate-400 text-[10px]">Ngày tập</span>
        </div>
      </div>

      {/* Settings Options list */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-2 shadow-sm overflow-hidden">
        {/* Toggle Notification */}
        <div className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-950 transition-all rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 rounded-xl">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <span className="block font-bold text-slate-800 dark:text-white text-xs md:text-sm">Thông báo nhắc nhở</span>
              <span className="text-[10px] text-slate-400">Nhận thông báo lịch tập & lời khuyên sức khỏe</span>
            </div>
          </div>
          <button
            onClick={handleToggleNotifications}
            className={`w-11 h-6 rounded-full transition-all duration-300 relative ${
              notifEnabled ? 'bg-indigo-600' : 'bg-slate-350 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                notifEnabled ? 'left-6' : 'left-1'
              }`}
            ></div>
          </button>
        </div>

        {/* Change info link */}
        <button
          onClick={() => router.push('/settings')}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-950 transition-all rounded-2xl text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <span className="block font-bold text-slate-800 dark:text-white text-xs md:text-sm">Cài đặt tài khoản</span>
              <span className="text-[10px] text-slate-400">Thay đổi họ tên, tuổi, nghề nghiệp</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Device Management link */}
        <button
          onClick={() => router.push('/explore')}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-950 transition-all rounded-2xl text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="block font-bold text-slate-800 dark:text-white text-xs md:text-sm">Thiết bị của tôi</span>
              <span className="text-[10px] text-slate-400">Xem và kích hoạt thiết bị trị liệu</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Logout button */}
      <button
        onClick={() => setShowSignOutModal(true)}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-3xl border border-rose-200 dark:border-rose-950/40 hover:bg-rose-50/50 dark:hover:bg-rose-950/10 text-rose-500 text-xs md:text-sm font-bold transition-all"
      >
        <LogOut className="w-4 h-4" />
        Đăng xuất khỏi thiết bị
      </button>

      {/* PRO activation modal */}
      {showProModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 relative">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 fill-amber-500" />
            </div>

            <h3 className="text-center font-bold text-slate-900 dark:text-white text-base md:text-lg">Kích hoạt gói PRO</h3>
            <p className="text-center text-slate-500 dark:text-slate-400 text-xs mt-2">
              Nhập mã kích hoạt nhận được từ sản phẩm trị liệu của bạn.
            </p>

            <input
              type="text"
              placeholder="Nhập mã (ví dụ: PRO-XXXXXX)"
              value={activationCode}
              onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
              className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 mt-5 text-center font-mono font-bold placeholder-slate-400 text-xs md:text-sm dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {errorMsg && (
              <p className="text-rose-500 text-center text-[10px] mt-2 font-medium">{errorMsg}</p>
            )}
            {successMsg && (
              <p className="text-emerald-600 text-center text-[10px] mt-2 font-bold">{successMsg}</p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                disabled={loading}
                onClick={() => setShowProModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-550 dark:text-slate-350 text-xs font-bold transition-all"
              >
                Hủy
              </button>
              <button
                disabled={loading || !activationCode.trim()}
                onClick={handleActivateCode}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white text-xs font-bold transition-all"
              >
                {loading ? 'Đang xử lý...' : 'Kích hoạt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out confirmation modal */}
      {showSignOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-base md:text-lg">Xác nhận đăng xuất</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 leading-relaxed">
              Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng TheraHome? Phiên làm việc của bạn sẽ kết thúc.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSignOutModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-550 dark:text-slate-350 text-xs font-bold transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
