'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, BellOff, Clock, Save, ShieldCheck } from 'lucide-react';
import { updateProfile } from '../../../services/auth';
import { useAuthStore } from '../../../stores/authStore';

const isValidTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

export default function NotificationSettingsPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.notifications_enabled !== false);
  const [preferredTime, setPreferredTime] = useState(user?.preferred_time || '20:00');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    const timeoutId = window.setTimeout(() => {
      setNotificationsEnabled(user.notifications_enabled !== false);
      setPreferredTime(user.preferred_time || '20:00');
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [user]);

  const handleSave = async () => {
    if (notificationsEnabled && !isValidTime(preferredTime)) {
      setError('Vui lòng chọn một giờ hợp lệ.');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      setMessage('');
      const updatedUser = await updateProfile({
        notifications_enabled: notificationsEnabled,
        preferred_time: preferredTime,
      });
      setUser(updatedUser);
      setMessage('Đã lưu lịch nhắc nhở.');
    } catch (err) {
      console.error('Save notification settings error:', err);
      setError('Không thể lưu cài đặt. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 md:max-w-3xl lg:max-w-4xl">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-100 text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-center text-sm font-black text-slate-850 dark:text-white">
          Lịch thông báo
        </h1>
        <div className="w-10" />
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          role="switch"
          aria-checked={notificationsEnabled}
          onClick={() => setNotificationsEnabled((value) => !value)}
          className={`flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-4 text-left transition-all ${
            notificationsEnabled
              ? 'bg-indigo-50 text-slate-900 dark:bg-indigo-950/40 dark:text-white'
              : 'bg-slate-50 text-slate-500 dark:bg-slate-800/60'
          }`}
        >
          <span className="flex items-center gap-3">
            <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${notificationsEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-700'}`}>
              {notificationsEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            </span>
            <span>
              <span className="block text-sm font-black">Nhắc nhở trị liệu</span>
              <span className="mt-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                {notificationsEnabled ? 'Đang bật, gửi 1 thông báo mỗi ngày' : 'Đang tắt'}
              </span>
            </span>
          </span>
          <span className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${notificationsEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
            <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${notificationsEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
          </span>
        </button>

        <div className={`mt-4 rounded-2xl bg-slate-50 p-4 transition-opacity dark:bg-slate-800/60 ${notificationsEnabled ? 'opacity-100' : 'opacity-45'}`}>
          <div className="mb-3 flex items-center gap-2 text-xs font-extrabold text-slate-500 dark:text-slate-400">
            <Clock className="h-4 w-4 text-indigo-600" />
            Giờ gửi thông báo
          </div>
          <label className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-slate-900">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Giờ nhắc</span>
            <input
              value={preferredTime}
              onChange={(event) => setPreferredTime(event.target.value)}
              type="time"
              disabled={!notificationsEnabled}
              className="min-w-[128px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-right text-sm font-bold text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:disabled:bg-slate-800"
            />
          </label>
        </div>

        {message && <p className="mt-4 text-center text-xs font-bold text-emerald-600">{message}</p>}
        {error && <p className="mt-4 text-center text-xs font-bold text-red-500">{error}</p>}

        <button
          onClick={handleSave}
          disabled={isSaving || (notificationsEnabled && !isValidTime(preferredTime))}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-650 py-4 text-xs font-bold text-white shadow-md shadow-indigo-100 transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none dark:shadow-none"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Đang lưu...' : 'Lưu cài đặt'}
        </button>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-black text-slate-850 dark:text-white">Quyền nhận thông báo</h3>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          Trình duyệt hoặc thiết bị vẫn cần cho phép quyền thông báo để TheraHome gửi nhắc nhở đúng giờ.
        </p>
      </div>
    </div>
  );
}
