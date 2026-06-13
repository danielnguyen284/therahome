'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Edit, Trash2, Search, ExternalLink } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmDialog from '@/components/ConfirmDialog';
import { showSuccess, showError } from '@/lib/toast';

interface PersonalizedVideoRaw {
  id?: string;
  _id?: string;
  video_group?: 'regular' | 'device_supported';
  title?: string;
  description?: string;
  link: string;
  is_active?: boolean;
  created_at: string;
}

interface PersonalizedVideoItem {
  id: string;
  video_group: 'regular' | 'device_supported';
  title: string;
  description: string;
  link: string;
  is_active: boolean;
  created_at: string;
}

const initialForm = {
  video_group: 'regular' as 'regular' | 'device_supported',
  title: '',
  description: '',
  link: '',
  is_active: true,
};

const videoGroupOptions = [
  { value: 'regular', label: 'Bài tập đơn' },
  { value: 'device_supported', label: 'Bài tập sử dụng máy' },
];

const getVideoGroupLabel = (group: 'regular' | 'device_supported') => {
  return videoGroupOptions.find((item) => item.value === group)?.label || group;
};

function normalizeItem(item: PersonalizedVideoRaw): PersonalizedVideoItem {
  return {
    id: item.id || item._id || '',
    video_group: item.video_group || 'regular',
    title: item.title || '',
    description: item.description || '',
    link: item.link,
    is_active: item.is_active !== false,
    created_at: item.created_at,
  };
}

export default function PersonalizedVideosPage() {
  const [videos, setVideos] = useState<PersonalizedVideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<'all' | 'regular' | 'device_supported'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PersonalizedVideoItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await api.get<PersonalizedVideoRaw[]>('/personalized-plan-videos');
      setVideos((data || []).map((item) => normalizeItem(item)));
    } catch (error) {
      console.error('Load personalized videos error:', error);
      showError('Không thể tải video lộ trình cá nhân hoá');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData(initialForm);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData(initialForm);
  };

  const handleEdit = (item: PersonalizedVideoItem) => {
    setEditingItem(item);
    setFormData({
      video_group: item.video_group,
      title: item.title,
      description: item.description,
      link: item.link,
      is_active: item.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.link.trim()) {
      showError('Vui lòng nhập link video');
      return;
    }

    const payload = {
      video_group: formData.video_group,
      title: formData.title.trim(),
      description: formData.description.trim(),
      link: formData.link.trim(),
      is_active: formData.is_active,
    };

    try {
      if (editingItem) {
        await api.put(`/personalized-plan-videos/${editingItem.id}`, payload);
        showSuccess('Đã cập nhật video lộ trình cá nhân hoá');
      } else {
        await api.post('/personalized-plan-videos', payload);
        showSuccess('Đã thêm video lộ trình cá nhân hoá');
      }
      closeModal();
      loadData();
    } catch (error) {
      console.error('Save personalized video error:', error);
      showError('Không thể lưu video lộ trình cá nhân hoá');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await api.delete(`/personalized-plan-videos/${deleteId}`);
      setVideos((prev) => prev.filter((item) => item.id !== deleteId));
      showSuccess('Đã xóa video lộ trình cá nhân hoá');
    } catch (error) {
      console.error('Delete personalized video error:', error);
      showError('Không thể xóa video lộ trình cá nhân hoá');
    }
  };

  const filteredVideos = videos.filter((item) => {
    const normalizedSearch = search.toLowerCase();
    const matchesSearch = (
      item.title.toLowerCase().includes(normalizedSearch) ||
      item.description.toLowerCase().includes(normalizedSearch) ||
      getVideoGroupLabel(item.video_group).toLowerCase().includes(normalizedSearch) ||
      item.link.toLowerCase().includes(normalizedSearch)
    );
    const matchesGroup = groupFilter === 'all' || item.video_group === groupFilter;
    return matchesSearch && matchesGroup;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Video Lộ Trình Cá Nhân Hoá</h1>
          <p className="text-sm text-slate-500 mt-1">Danh sách video để hệ thống AI tự động đề xuất trong lộ trình cá nhân hóa 14 ngày.</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          <Plus size={20} className="inline mr-2" />
          Thêm video
        </button>
      </div>

      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Tìm theo tiêu đề, mô tả hoặc link..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value as 'all' | 'regular' | 'device_supported')}
            className="input"
          >
            <option value="all">Tất cả nhóm video</option>
            {videoGroupOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Nhóm</th>
              <th>Tiêu đề</th>
              <th>Link</th>
              <th>AI Đề Xuất Tự Động</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredVideos.map((item) => (
              <tr key={item.id}>
                <td>
                  <span className={`badge ${item.video_group === 'device_supported' ? 'badge-warning' : 'badge-success'}`}>
                    {getVideoGroupLabel(item.video_group)}
                  </span>
                </td>
                <td className="font-medium">{item.title || 'Không có tiêu đề'}</td>
                <td className="max-w-md">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 break-all"
                  >
                    {item.link}
                    <ExternalLink size={14} />
                  </a>
                </td>
                <td>
                  <span className={`badge ${item.is_active ? 'badge-success' : 'badge-secondary'}`}>
                    {item.is_active ? 'Cho phép' : 'Không dùng'}
                  </span>
                </td>
                <td className="text-sm text-slate-600">
                  {new Date(item.created_at).toLocaleDateString('vi-VN')}
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => setDeleteId(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredVideos.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            Chưa có video lộ trình cá nhân hoá nào
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {editingItem ? 'Sửa video lộ trình cá nhân hoá' : 'Thêm video lộ trình cá nhân hoá'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nhóm video</label>
                <select
                  value={formData.video_group}
                  onChange={(e) => setFormData({
                    ...formData,
                    video_group: e.target.value as 'regular' | 'device_supported',
                  })}
                  className="input"
                >
                  {videoGroupOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tiêu đề</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  placeholder="Ví dụ: Kéo giãn cổ cơ bản"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Mô tả ngắn về mục tiêu của video"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Link video</label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="input"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-700">Cho phép AI đề xuất tự động</label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.is_active ? 'bg-green-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.is_active ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-slate-500">
                  {formData.is_active ? 'Bật (AI có thể chọn)' : 'Tắt (AI bỏ qua)'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button onClick={handleSave} className="btn btn-primary flex-1">
                Lưu
              </button>
              <button onClick={closeModal} className="btn btn-secondary flex-1">
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xác nhận xóa video"
        message="Bạn có chắc muốn xóa video lộ trình cá nhân hoá này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
      />
    </div>
  );
}
