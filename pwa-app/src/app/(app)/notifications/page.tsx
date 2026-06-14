'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { ArrowLeft, Bell, Check, BellRing } from 'lucide-react';

interface NotificationInboxItem {
  id: string;
  broadcast_id?: string | null;
  key?: string;
  title: string;
  body: string;
  sent_at?: string;
  created_at: string;
  is_read: boolean;
}

interface NotificationInboxResponse {
  unread_count: number;
  items: NotificationInboxItem[];
}

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationInboxItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get<NotificationInboxResponse>('/notifications?limit=50');
      if (res) {
        setItems(res.items || []);
        setUnreadCount(res.unread_count || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadNotifications();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleMarkOne = async (item: NotificationInboxItem) => {
    if (item.is_read) return;
    try {
      // Optimistic update
      setItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await api.put(`/notifications/${item.id}/read`, {});
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAll = async () => {
    if (markingAll || unreadCount === 0) return;
    try {
      setMarkingAll(true);
      // Optimistic update
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);

      await api.put('/notifications/read-all', {});
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const formatNotificationTime = (value?: string) => {
    if (!value) return 'Vừa xong';
    const date = new Date(value);
    if (isNaN(date.getTime())) return 'Vừa xong';

    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 mt-2">Đang tải thông báo...</p>
      </div>
    );
  }

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
          Thông Báo
        </h1>
        <button
          onClick={handleMarkAll}
          disabled={unreadCount === 0 || markingAll}
          className="px-3.5 py-2 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-50 dark:hover:bg-slate-950 text-indigo-650 disabled:opacity-40 rounded-2xl text-[10px] font-black transition-all flex items-center gap-1.5 shrink-0"
        >
          <Check className="w-3.5 h-3.5" />
          {markingAll ? 'Đang lưu...' : 'Đã xem hết'}
        </button>
      </div>

      {/* Summary card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 rounded-xl flex items-center justify-center">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-805 dark:text-white">Hộp thư hệ thống</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Danh sách thông báo quan trọng đã nhận</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <span className="bg-rose-500 text-white font-black text-[10px] px-2.5 py-1 rounded-full">
            {unreadCount} mới
          </span>
        )}
      </div>

      {/* Notifications list */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3 shadow-sm">
            <Bell className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-xs font-black text-slate-800 dark:text-white">Chưa có thông báo nào</h4>
            <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-relaxed">
              Khi hệ thống gửi hướng dẫn hoặc cập nhật thông báo nhắc nhở, nội dung sẽ xuất hiện tại đây.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMarkOne(item)}
              className={`w-full p-5 rounded-3xl border text-left transition-all flex flex-col gap-2 relative bg-white dark:bg-slate-900 ${
                !item.is_read 
                  ? 'border-indigo-200 dark:border-indigo-950/45 ring-1 ring-indigo-650/5 shadow-sm' 
                  : 'border-slate-100 dark:border-slate-800'
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-[10px] text-slate-400 font-bold">
                  {formatNotificationTime(item.sent_at || item.created_at)}
                </span>
                {!item.is_read && (
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                )}
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-white">{item.title}</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{item.body}</p>
              </div>
            </button>
          ))
        )}
      </div>

    </div>
  );
}
