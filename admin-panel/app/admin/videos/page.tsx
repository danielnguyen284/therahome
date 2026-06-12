'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Edit, Trash2, Search, ExternalLink } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmDialog from '@/components/ConfirmDialog';
import { showSuccess, showError } from '@/lib/toast';

interface WorkoutPlan {
  id: string;
  title: string;
  target_area: string;
  duration_days: number;
}

interface VideoItemRaw {
  id?: string;
  _id?: string;
  workout_plan_id: string | WorkoutPlan;
  order: number;
  link: string;
  created_at: string;
}

interface VideoItem {
  id: string;
  workout_plan_id: string;
  workout_plan_title: string;
  order: number;
  link: string;
  created_at: string;
}

const initialForm = {
  workout_plan_id: '',
  order: 1,
  link: '',
};

function normalizeVideo(item: VideoItemRaw): VideoItem {
  const plan = item.workout_plan_id;
  const planId = typeof plan === 'string' ? plan : plan?.id || '';
  const planTitle = typeof plan === 'string' ? plan : plan?.title || 'Không rõ lộ trình';

  return {
    id: item.id || item._id || '',
    workout_plan_id: planId,
    workout_plan_title: planTitle,
    order: item.order,
    link: item.link,
    created_at: item.created_at,
  };
}

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<VideoItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    loadData();
  }, []);

  const planMap = useMemo(() => {
    return new Map(plans.map((plan) => [plan.id, plan]));
  }, [plans]);

  const loadData = async () => {
    try {
      const [plansData, videosData] = await Promise.all([
        api.get<WorkoutPlan[]>('/workout-plans'),
        api.get<VideoItemRaw[]>('/videos'),
      ]);

      const loadedPlans = plansData || [];
      const normalizedVideos = (videosData || []).map((item) => normalizeVideo(item));

      setPlans(loadedPlans);
      setVideos(normalizedVideos);

      if (loadedPlans.length > 0) {
        setFormData((prev) => ({
          ...prev,
          workout_plan_id: prev.workout_plan_id || loadedPlans[0].id,
        }));
      }
    } catch (error) {
      console.error('Load videos data error:', error);
      showError('Không thể tải dữ liệu videos');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      workout_plan_id: plans[0]?.id || '',
      order: 1,
      link: '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData(initialForm);
  };

  const handleEdit = (item: VideoItem) => {
    setEditingItem(item);
    setFormData({
      workout_plan_id: item.workout_plan_id,
      order: item.order,
      link: item.link,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.workout_plan_id) {
      showError('Vui lòng chọn lộ trình');
      return;
    }
    if (!Number.isInteger(formData.order) || formData.order < 1) {
      showError('Order phải là số nguyên >= 1');
      return;
    }
    if (!formData.link.trim()) {
      showError('Vui lòng nhập link video');
      return;
    }

    const payload = {
      workout_plan_id: formData.workout_plan_id,
      order: Number(formData.order),
      link: formData.link.trim(),
    };

    try {
      if (editingItem) {
        await api.put(`/videos/${editingItem.id}`, payload);
        showSuccess('Đã cập nhật video');
      } else {
        await api.post('/videos', payload);
        showSuccess('Đã thêm video');
      }
      closeModal();
      loadData();
    } catch (error) {
      console.error('Save video error:', error);
      showError('Không thể lưu video');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await api.delete(`/videos/${deleteId}`);
      setVideos((prev) => prev.filter((item) => item.id !== deleteId));
      showSuccess('Đã xóa video');
    } catch (error) {
      console.error('Delete video error:', error);
      showError('Không thể xóa video');
    }
  };

  const filteredVideos = videos.filter((item) => {
    const normalizedSearch = search.toLowerCase();
    const matchesSearch =
      item.workout_plan_title.toLowerCase().includes(normalizedSearch) ||
      item.link.toLowerCase().includes(normalizedSearch);
    const matchesPlan = planFilter === 'all' || item.workout_plan_id === planFilter;
    return matchesSearch && matchesPlan;
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
        <h1 className="text-2xl font-bold text-slate-900">Videos Theo Ngày</h1>
        <button onClick={openCreateModal} className="btn btn-primary" disabled={plans.length === 0}>
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
              placeholder="Tìm theo lộ trình hoặc link..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="input"
          >
            <option value="all">Tất cả lộ trình</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Lộ trình</th>
              <th>Order (Ngày)</th>
              <th>Link</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredVideos.map((item) => (
              <tr key={item.id}>
                <td className="font-medium">
                  {item.workout_plan_title}
                  {planMap.get(item.workout_plan_id)?.duration_days ? (
                    <div className="text-xs text-slate-500">
                      {planMap.get(item.workout_plan_id)?.duration_days} ngày
                    </div>
                  ) : null}
                </td>
                <td>
                  <span className="badge badge-info">Ngày {item.order}</span>
                </td>
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
            Chưa có video nào
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {editingItem ? 'Sửa video' : 'Thêm video'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Lộ trình</label>
                <select
                  value={formData.workout_plan_id}
                  onChange={(e) => setFormData({ ...formData, workout_plan_id: e.target.value })}
                  className="input"
                >
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Order (Ngày)</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value || '1', 10) })}
                  className="input"
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
        message="Bạn có chắc muốn xóa video này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
      />
    </div>
  );
}
