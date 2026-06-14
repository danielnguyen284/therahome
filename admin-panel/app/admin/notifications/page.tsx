'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Bell, CheckCircle2, Clock, History, Save, Search, Send, Users, X } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { showSuccess, showError } from '@/lib/toast';

interface NotificationTemplateConfig {
  _id: string;
  key: string;
  label: string;
  title: string;
  body: string;
  hour: number;
  minute: number;
  is_active: boolean;
  description: string;
  updated_at: string;
}

interface EligibleNotificationUser {
  id: string;
  full_name: string;
  email: string;
  is_pro: boolean;
  notifications_enabled: boolean;
  has_push_token: boolean;
  token_platform?: string;
}

interface NotificationBroadcast {
  id: string;
  title: string;
  body: string;
  url: string;
  target_type: 'all' | 'selected';
  target_count: number;
  inbox_count: number;
  sent_count: number;
  failed_count: number;
  skipped_count: number;
  created_at: string;
  creator?: {
    full_name?: string;
    email?: string;
  };
}

function getTemplateTone(key: string) {
  if (key.startsWith('message_1_recovery_day_')) {
    return {
      card: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      badge: 'bg-emerald-100 text-emerald-700',
    };
  }

  if (key.startsWith('message_1_personalized_day_')) {
    return {
      card: 'bg-blue-50 border-blue-200 text-blue-700',
      badge: 'bg-blue-100 text-blue-700',
    };
  }

  if (key === 'message_3') {
    return {
      card: 'bg-amber-50 border-amber-200 text-amber-700',
      badge: 'bg-amber-100 text-amber-700',
    };
  }

  if (key === 'message_5') {
    return {
      card: 'bg-orange-50 border-orange-200 text-orange-700',
      badge: 'bg-orange-100 text-orange-700',
    };
  }

  if (key === 'message_7') {
    return {
      card: 'bg-red-50 border-red-200 text-red-700',
      badge: 'bg-red-100 text-red-700',
    };
  }

  return {
    card: 'bg-slate-50 border-slate-200 text-slate-700',
    badge: 'bg-slate-100 text-slate-700',
  };
}

function getTemplateShortKey(key: string) {
  if (key.startsWith('message_1_recovery_day_')) {
    return `Recovery D${key.slice(-2)}`;
  }

  if (key.startsWith('message_1_personalized_day_')) {
    return `Personal D${key.slice(-2)}`;
  }

  return key.replaceAll('_', ' ');
}

function buildTemplateDrafts(items: NotificationTemplateConfig[]) {
  const initial: Record<string, Partial<NotificationTemplateConfig>> = {};
  items.forEach((template) => {
    initial[template.key] = {
      title: template.title,
      body: template.body,
      hour: template.hour,
      minute: template.minute,
      is_active: template.is_active,
    };
  });
  return initial;
}

export default function NotificationsPage() {
  const [templates, setTemplates] = useState<NotificationTemplateConfig[]>([]);
  const [editData, setEditData] = useState<Record<string, Partial<NotificationTemplateConfig>>>({});
  const [loading, setLoading] = useState(true);
  const [savingTemplateKey, setSavingTemplateKey] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [broadcasts, setBroadcasts] = useState<NotificationBroadcast[]>([]);
  const [eligibleUsers, setEligibleUsers] = useState<EligibleNotificationUser[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    body: '',
    url: '/notifications',
    target_type: 'all' as 'all' | 'selected',
  });

  const loadPageData = useCallback(async () => {
    try {
      const [templateData, broadcastData, usersData] = await Promise.all([
        api.get<NotificationTemplateConfig[]>('/notification-templates/admin'),
        api.get<NotificationBroadcast[]>('/admin/notifications/broadcasts?limit=20'),
        api.get<EligibleNotificationUser[]>('/admin/notifications/eligible-users?limit=50'),
      ]);

      setTemplates(templateData || []);
      setEditData(buildTemplateDrafts(templateData || []));
      setBroadcasts(broadcastData || []);
      setEligibleUsers(usersData || []);
    } catch (error) {
      console.error('Load notification page error:', error);
      showError('Không thể tải dữ liệu thông báo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  const handleFieldChange = (key: string, field: string, value: string | number | boolean) => {
    setEditData((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [field]: value,
      },
    }));
  };

  const formatTime = (h: number, m: number) =>
    `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  const templateHasChanges = (template: NotificationTemplateConfig) => {
    const data = editData[template.key];
    if (!data) return false;

    return (
      data.title !== template.title ||
      data.body !== template.body ||
      Number(data.hour) !== template.hour ||
      Number(data.minute) !== template.minute ||
      data.is_active !== template.is_active
    );
  };

  const refreshTemplates = async () => {
    const templateData = await api.get<NotificationTemplateConfig[]>('/notification-templates/admin');
    setTemplates(templateData || []);
    setEditData(buildTemplateDrafts(templateData || []));
  };

  const refreshBroadcasts = async () => {
    const broadcastData = await api.get<NotificationBroadcast[]>('/admin/notifications/broadcasts?limit=20');
    setBroadcasts(broadcastData || []);
  };

  const searchEligibleUsers = async () => {
    try {
      const query = new URLSearchParams({
        search: userSearchTerm.trim(),
        limit: '50',
      });
      const usersData = await api.get<EligibleNotificationUser[]>(`/admin/notifications/eligible-users?${query.toString()}`);
      setEligibleUsers(usersData || []);
    } catch (error) {
      console.error('Search notification users error:', error);
      showError('KhĂ´ng thá»ƒ tĂ¬m user');
    }
  };

  const toggleSelectedUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const handleBroadcastFieldChange = (field: string, value: string) => {
    setBroadcastForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatDateTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const handleSendBroadcast = async () => {
    const title = broadcastForm.title.trim();
    const body = broadcastForm.body.trim();
    const url = broadcastForm.url.trim() || '/notifications';

    if (!title || title.length > 120) {
      showError('TiĂªu Ä‘á» pháº£i tá»« 1 Ä‘áº¿n 120 kĂ½ tá»±');
      return;
    }

    if (!body || body.length > 500) {
      showError('Ná»™i dung pháº£i tá»« 1 Ä‘áº¿n 500 kĂ½ tá»±');
      return;
    }

    if (!url.startsWith('/') || url.startsWith('//')) {
      showError('ÄÆ°á»ng dáº«n pháº£i lĂ  route ná»™i bá»™, vĂ­ dá»¥ /notifications');
      return;
    }

    if (broadcastForm.target_type === 'selected' && selectedUserIds.length === 0) {
      showError('Vui lĂ²ng chá»n Ă­t nháº¥t 1 user');
      return;
    }

    if (
      broadcastForm.target_type === 'all'
      && !window.confirm('Gá»­i tin nháº¯n nĂ y cho táº¥t cáº£ user?')
    ) {
      return;
    }

    setSendingBroadcast(true);
    try {
      const result = await api.post<NotificationBroadcast>('/admin/notifications/broadcast', {
        title,
        body,
        url,
        target_type: broadcastForm.target_type,
        user_ids: broadcastForm.target_type === 'selected' ? selectedUserIds : undefined,
      });

      showSuccess(`ÄĂ£ lÆ°u inbox cho ${result.inbox_count} user, push thĂ nh cĂ´ng ${result.sent_count}`);
      setBroadcastForm({
        title: '',
        body: '',
        url: '/notifications',
        target_type: 'all',
      });
      setSelectedUserIds([]);
      await refreshBroadcasts();
    } catch (error) {
      console.error('Send broadcast notification error:', error);
      showError(error instanceof Error ? error.message : 'KhĂ´ng thá»ƒ gá»­i tin nháº¯n');
    } finally {
      setSendingBroadcast(false);
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredTemplates = templates.filter((template) => {
    if (!normalizedSearch) return true;

    const searchableText = [
      template.key,
      template.label,
      template.title,
      template.body,
      template.description,
      getTemplateShortKey(template.key),
    ]
      .join(' ')
      .toLowerCase();

    return searchableText.includes(normalizedSearch);
  });

  const handleSaveTemplate = async (template: NotificationTemplateConfig) => {
    const data = editData[template.key];
    if (!data) return;

    if (!data.title?.trim()) {
      showError('Vui lòng nhập tiêu đề thông báo');
      return;
    }

    if (!data.body?.trim()) {
      showError('Vui lòng nhập nội dung thông báo');
      return;
    }

    setSavingTemplateKey(template.key);

    try {
      await api.put(`/notification-templates/${template.key}`, {
        title: data.title?.trim(),
        body: data.body?.trim(),
        hour: Number(data.hour),
        minute: Number(data.minute),
        is_active: data.is_active,
      });

      showSuccess(`Đã cập nhật cấu hình chung cho ${template.label}`);
      await refreshTemplates();
    } catch (error) {
      console.error('Save notification template error:', error);
      showError('Không thể lưu cấu hình thông báo');
    } finally {
      setSavingTemplateKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Bell className="text-blue-600" size={28} />
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Thông báo</h1>
        </div>
        <p className="text-slate-500">
          Phần dưới đây là cấu hình chung áp dụng cho toàn bộ user.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <div className="card border border-slate-200 p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Send className="text-blue-600" size={22} />
                <h2 className="text-xl font-bold text-slate-900">Gửi tin nhắn tới PWA</h2>
              </div>
              <p className="text-sm text-slate-500">
                Tin nhắn sẽ được lưu vào hộp thư thông báo. Push chỉ gửi cho user đã bật thông báo và có token hợp lệ.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Tiêu đề</label>
              <input
                value={broadcastForm.title}
                onChange={(e) => handleBroadcastFieldChange('title', e.target.value)}
                maxLength={120}
                className="input"
                placeholder="Ví dụ: Lịch tập hôm nay đã sẵn sàng"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Mở route khi bấm thông báo</label>
              <input
                value={broadcastForm.url}
                onChange={(e) => handleBroadcastFieldChange('url', e.target.value)}
                className="input"
                placeholder="/notifications"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Nội dung</label>
            <textarea
              value={broadcastForm.body}
              onChange={(e) => handleBroadcastFieldChange('body', e.target.value)}
              maxLength={500}
              className="input min-h-[112px]"
              placeholder="Nhập nội dung gửi tới người dùng..."
            />
            <p className="mt-1 text-xs text-slate-400">{broadcastForm.body.length}/500 ký tự</p>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Users size={16} />
              Người nhận
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                broadcastForm.target_type === 'all' ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white'
              }`}>
                <input
                  type="radio"
                  checked={broadcastForm.target_type === 'all'}
                  onChange={() => setBroadcastForm((prev) => ({ ...prev, target_type: 'all' }))}
                />
                <span>
                  <span className="block text-sm font-bold text-slate-800">Tất cả người dùng</span>
                  <span className="text-xs text-slate-500">Gửi inbox cho toàn bộ user không phải admin</span>
                </span>
              </label>
              <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                broadcastForm.target_type === 'selected' ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white'
              }`}>
                <input
                  type="radio"
                  checked={broadcastForm.target_type === 'selected'}
                  onChange={() => setBroadcastForm((prev) => ({ ...prev, target_type: 'selected' }))}
                />
                <span>
                  <span className="block text-sm font-bold text-slate-800">Chọn người dùng</span>
                  <span className="text-xs text-slate-500">Đã chọn {selectedUserIds.length} user</span>
                </span>
              </label>
            </div>

            {broadcastForm.target_type === 'selected' && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                <div className="mb-3 flex gap-2">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') searchEligibleUsers();
                      }}
                      className="input pl-9"
                      placeholder="Tìm theo tên hoặc email..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={searchEligibleUsers}
                    className="rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    Tìm
                  </button>
                </div>

                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {eligibleUsers.map((user) => {
                    const checked = selectedUserIds.includes(user.id);
                    return (
                      <label
                        key={user.id}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 transition ${
                          checked ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSelectedUser(user.id)}
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-slate-800">{user.full_name || 'Chưa đặt tên'}</span>
                            <span className="block truncate text-xs text-slate-500">{user.email}</span>
                          </span>
                        </span>
                        <span className="flex shrink-0 gap-1">
                          {user.notifications_enabled ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Bật</span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">Tắt</span>
                          )}
                          {user.has_push_token && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">Push</span>
                          )}
                        </span>
                      </label>
                    );
                  })}

                  {eligibleUsers.length === 0 && (
                    <p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-500">
                      Không tìm thấy user phù hợp.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Preview</p>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Bell size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{broadcastForm.title || 'Tiêu đề thông báo'}</p>
                <p className="mt-0.5 text-sm text-slate-600">{broadcastForm.body || 'Nội dung sẽ hiển thị tại đây.'}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleSendBroadcast}
              disabled={sendingBroadcast}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sendingBroadcast ? <LoadingSpinner size="sm" /> : <Send size={16} />}
              {sendingBroadcast ? 'Đang gửi...' : 'Gửi tin nhắn'}
            </button>
          </div>
        </div>

        <div className="card border border-slate-200 p-5">
          <div className="mb-4 flex items-center gap-2">
            <History className="text-slate-600" size={20} />
            <h2 className="text-lg font-bold text-slate-900">Lịch sử gửi gần đây</h2>
          </div>
          <div className="space-y-3">
            {broadcasts.map((broadcast) => (
              <div key={broadcast.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{broadcast.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{formatDateTime(broadcast.created_at)}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-600">
                    {broadcast.target_type === 'all' ? 'Tất cả' : 'Đã chọn'}
                  </span>
                </div>
                <p className="line-clamp-2 text-xs text-slate-600">{broadcast.body}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                  <span>Inbox: <b className="text-slate-800">{broadcast.inbox_count}</b></span>
                  <span>Target: <b className="text-slate-800">{broadcast.target_count}</b></span>
                  <span className="flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 size={12} /> Push OK: <b>{broadcast.sent_count}</b>
                  </span>
                  <span>Skip/Fail: <b className="text-slate-800">{broadcast.skipped_count + broadcast.failed_count}</b></span>
                </div>
              </div>
            ))}

            {broadcasts.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
                Chưa có tin nhắn broadcast nào.
              </div>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Cấu hình chung cho tất cả user</h2>
            <p className="text-sm text-slate-500 mt-1">
              Admin chỉnh nội dung, giờ gửi và trạng thái bật hoặc tắt của từng message ngay tại đây.
            </p>
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Tìm kiếm message
          </label>
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo ngày, recovery, personalized, message_3, tiêu đề hoặc nội dung..."
              className="input pl-10 pr-11"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Đang hiển thị {filteredTemplates.length}/{templates.length} message
          </p>
        </div>

        <div className="space-y-6">
          {filteredTemplates.map((template) => {
            const data = editData[template.key] || {};
            const changed = templateHasChanges(template);
            const tone = getTemplateTone(template.key);
            const isActive = Boolean(data.is_active ?? template.is_active);

            return (
              <div
                key={template.key}
                className={`card border-2 overflow-hidden ${
                  isActive ? tone.card : 'bg-slate-50 border-slate-200 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between gap-4 p-5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide ${tone.badge}`}
                    >
                      {getTemplateShortKey(template.key)}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{template.label}</h3>
                      <p className="text-sm text-slate-500 mt-1">{template.description}</p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                      isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isActive ? 'Đang bật' : 'Đang tắt'}
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      <Clock size={14} className="inline mr-1.5 -mt-0.5" />
                      Khung giờ gửi chung
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={data.hour ?? template.hour}
                        onChange={(e) => handleFieldChange(template.key, 'hour', Number(e.target.value))}
                        className="input w-24 text-center font-mono"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {String(i).padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                      <span className="text-xl font-bold text-slate-400">:</span>
                      <select
                        value={data.minute ?? template.minute}
                        onChange={(e) => handleFieldChange(template.key, 'minute', Number(e.target.value))}
                        className="input w-24 text-center font-mono"
                      >
                        {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((minute) => (
                          <option key={minute} value={minute}>
                            {String(minute).padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                      <label className="ml-4 inline-flex items-center gap-2 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => handleFieldChange(template.key, 'is_active', e.target.checked)}
                        />
                        Áp dụng message này
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Tiêu đề thông báo
                    </label>
                    <input
                      type="text"
                      value={data.title ?? template.title}
                      onChange={(e) => handleFieldChange(template.key, 'title', e.target.value)}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Nội dung thông báo
                    </label>
                    <textarea
                      value={data.body ?? template.body}
                      onChange={(e) => handleFieldChange(template.key, 'body', e.target.value)}
                      className="input"
                      rows={3}
                    />
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">
                      Xem trước thông báo chung
                    </p>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                        <Bell size={18} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-slate-900 text-sm">
                            {data.title || template.title}
                          </p>
                          <p className="text-xs text-slate-400 shrink-0">
                            {formatTime(
                              Number(data.hour ?? template.hour),
                              Number(data.minute ?? template.minute),
                            )}
                          </p>
                        </div>
                        <p className="text-sm text-slate-600 mt-0.5">
                          {data.body || template.body}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => handleSaveTemplate(template)}
                      disabled={!changed || savingTemplateKey === template.key}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingTemplateKey === template.key ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Save size={16} />
                      )}
                      Lưu cấu hình chung
                    </button>
                  </div>
                </div>
              </div>
              );
            })}

          {filteredTemplates.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-500">
              Không tìm thấy message nào khớp với từ khóa bạn nhập.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
