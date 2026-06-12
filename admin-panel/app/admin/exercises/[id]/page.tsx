'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmDialog from '@/components/ConfirmDialog';
import { showSuccess, showError } from '@/lib/toast';

export default function EditExercisePage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail_url: '',
    calories: 50,
    difficulty: 'easy',
    category: 'neck',
    target_areas: [] as string[],
    tags: '',
    instructions: '',
    benefits: '',
    is_pro: false,
    video_urls_by_pain: {
      no_pain: '',
      mild: '',
      moderate: '',
      severe: '',
    },
  });

  const loadExercise = useCallback(async () => {
    try {
      const data = await api.get(`/exercises/${params.id}`);

      setFormData({
        title: data.title || '',
        description: data.description || '',
        thumbnail_url: data.thumbnail_url || '',
        calories: data.calories || 50,
        difficulty: data.difficulty || 'easy',
        category: data.category || 'neck',
        target_areas: Array.isArray(data.target_areas) ? data.target_areas : [],
        tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
        instructions: Array.isArray(data.instructions) ? data.instructions.join('\n') : '',
        benefits: Array.isArray(data.benefits) ? data.benefits.join('\n') : '',
        is_pro: data.is_pro || false,
        video_urls_by_pain: {
          no_pain: data.video_urls_by_pain?.no_pain || data.video_url || '',
          mild: data.video_urls_by_pain?.mild || data.video_url || '',
          moderate: data.video_urls_by_pain?.moderate || data.video_url || '',
          severe: data.video_urls_by_pain?.severe || data.video_url || '',
        },
      });
    } catch (error) {
      console.error('Load exercise error:', error);
      showError('Không thể tải bài tập');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadExercise();
  }, [loadExercise]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const instructions = formData.instructions 
        ? formData.instructions.split('\n').filter(s => s.trim())
        : [];
      
      const benefits = formData.benefits
        ? formData.benefits.split('\n').filter(s => s.trim())
        : [];

      const tags = formData.tags
        ? formData.tags.split(',').map(t => t.trim()).filter(t => t)
        : [];

      const painVideos = formData.video_urls_by_pain;
      const hasMissingPainVideo = Object.values(painVideos).some((url) => !url.trim());

      if (hasMissingPainVideo) {
        showError('Vui lòng nhập đủ 4 link video theo mức đau');
        setSaving(false);
        return;
      }

      const fallbackVideoUrl =
        painVideos.mild || painVideos.moderate || painVideos.severe || painVideos.no_pain;

      await api.put(`/exercises/${params.id}`, {
        title: formData.title,
        description: formData.description,
        video_url: fallbackVideoUrl,
        video_urls_by_pain: painVideos,
        thumbnail_url: formData.thumbnail_url,
        calories: formData.calories,
        difficulty: formData.difficulty,
        category: formData.category,
        target_areas: formData.target_areas,
        tags,
        instructions,
        benefits,
        is_pro: formData.is_pro,
      });

      showSuccess('Đã cập nhật bài tập');
      router.push('/admin/exercises');
    } catch (error) {
      console.error('Update exercise error:', error);
      showError('Không thể cập nhật bài tập');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/exercises/${params.id}`);

      showSuccess('Đã xóa bài tập');
      router.push('/admin/exercises');
    } catch (error) {
      console.error('Delete error:', error);
      showError('Không thể xóa bài tập');
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
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/exercises" className="text-slate-600 hover:text-slate-900">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Sửa bài tập</h1>
        </div>
        <button onClick={() => setShowDeleteDialog(true)} className="btn bg-red-600 text-white hover:bg-red-700 transition-colors">
          <Trash2 size={20} className="inline mr-2" />
          Xóa
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Tên bài tập *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Mô tả</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows={3}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-3">Link video theo mức đau *</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-2">Không đau</label>
                  <input
                    type="url"
                    value={formData.video_urls_by_pain.no_pain}
                    onChange={(e) => setFormData({
                      ...formData,
                      video_urls_by_pain: {
                        ...formData.video_urls_by_pain,
                        no_pain: e.target.value,
                      },
                    })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-2">Đau nhẹ (ấm ấm)</label>
                  <input
                    type="url"
                    value={formData.video_urls_by_pain.mild}
                    onChange={(e) => setFormData({
                      ...formData,
                      video_urls_by_pain: {
                        ...formData.video_urls_by_pain,
                        mild: e.target.value,
                      },
                    })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-2">Đau vừa (khó chịu)</label>
                  <input
                    type="url"
                    value={formData.video_urls_by_pain.moderate}
                    onChange={(e) => setFormData({
                      ...formData,
                      video_urls_by_pain: {
                        ...formData.video_urls_by_pain,
                        moderate: e.target.value,
                      },
                    })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-2">Đau nặng/Tê</label>
                  <input
                    type="url"
                    value={formData.video_urls_by_pain.severe}
                    onChange={(e) => setFormData({
                      ...formData,
                      video_urls_by_pain: {
                        ...formData.video_urls_by_pain,
                        severe: e.target.value,
                      },
                    })}
                    className="input"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <ImageUpload
                value={formData.thumbnail_url}
                onChange={(url) => setFormData({ ...formData, thumbnail_url: url })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Calories</label>
              <input
                type="number"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: parseInt(e.target.value) })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Danh mục *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input"
                required
              >
                <option value="neck">Cổ</option>
                <option value="shoulder">Vai</option>
                <option value="upper_back">Lưng trên</option>
                <option value="middle_back">Lưng giữa</option>
                <option value="lower_back">Lưng dưới</option>
                <option value="arm">Tay</option>
                <option value="leg">Chân</option>
                <option value="full_body">Toàn thân</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-3">Vùng tác động *</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { value: 'neck', label: 'Cổ' },
                  { value: 'shoulder_left', label: 'Vai trái' },
                  { value: 'shoulder_right', label: 'Vai phải' },
                  { value: 'upper_back', label: 'Lưng trên' },
                  { value: 'middle_back', label: 'Lưng giữa' },
                  { value: 'lower_back', label: 'Lưng dưới' },
                  { value: 'arm_left', label: 'Cánh tay trái' },
                  { value: 'arm_right', label: 'Cánh tay phải' },
                  { value: 'leg_left', label: 'Chân trái' },
                  { value: 'leg_right', label: 'Chân phải' },
                ].map((area) => (
                  <label key={area.value} className="flex items-center gap-2 p-3 border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.target_areas.includes(area.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, target_areas: [...formData.target_areas, area.value] });
                        } else {
                          setFormData({ ...formData, target_areas: formData.target_areas.filter(a => a !== area.value) });
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-slate-700">{area.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="input"
                placeholder="Người mới, Ngồi, Đứng"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Hướng dẫn</label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                className="input"
                rows={5}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Lợi ích</label>
              <textarea
                value={formData.benefits}
                onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                className="input"
                rows={4}
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_pro}
                  onChange={(e) => setFormData({ ...formData, is_pro: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-slate-700">Bài tập PRO</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button type="submit" disabled={saving} className="btn btn-primary">
            <Save size={20} className="inline mr-2" />
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
          <Link href="/admin/exercises" className="btn btn-secondary">Hủy</Link>
        </div>
      </form>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Xác nhận xóa"
        message={`Bạn có chắc muốn xóa bài tập "${formData.title}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
      />
    </div>
  );
}
