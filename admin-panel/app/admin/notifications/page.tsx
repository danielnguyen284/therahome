'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Bell, Clock, Save, Search, X } from 'lucide-react';
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

export default function NotificationsPage() {
  const [templates, setTemplates] = useState<NotificationTemplateConfig[]>([]);
  const [editData, setEditData] = useState<Record<string, Partial<NotificationTemplateConfig>>>({});
  const [loading, setLoading] = useState(true);
  const [savingTemplateKey, setSavingTemplateKey] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPageData();
  }, []);

  const buildTemplateDrafts = (items: NotificationTemplateConfig[]) => {
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
  };

  const loadPageData = async () => {
    try {
      const templateData = await api.get<NotificationTemplateConfig[]>('/notification-templates/admin');

      setTemplates(templateData || []);
      setEditData(buildTemplateDrafts(templateData || []));
    } catch (error) {
      console.error('Load notification page error:', error);
      showError('Không thể tải dữ liệu thông báo');
    } finally {
      setLoading(false);
    }
  };

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
