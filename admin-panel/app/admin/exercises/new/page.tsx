'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';
import { showSuccess, showError } from '@/lib/toast';

export default function NewExercisePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
    variations: '',
    is_pro: false,
    video_urls_by_pain: {
      no_pain: '',
      mild: '',
      moderate: '',
      severe: '',
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Parse JSON fields
      const instructions = formData.instructions 
        ? formData.instructions.split('\n').filter(s => s.trim())
        : [];
      
      const benefits = formData.benefits
        ? formData.benefits.split('\n').filter(s => s.trim())
        : [];

      const tags = formData.tags
        ? formData.tags.split(',').map(t => t.trim()).filter(t => t)
        : [];

      let variations = null;
      if (formData.variations) {
        try {
          variations = JSON.parse(formData.variations);
        } catch {
          variations = { text: formData.variations };
        }
      }

      const painVideos = formData.video_urls_by_pain;
      const hasMissingPainVideo = Object.values(painVideos).some((url) => !url.trim());

      if (hasMissingPainVideo) {
        showError('Vui lòng nhập đủ 4 link video theo mức đau');
        setLoading(false);
        return;
      }

      const fallbackVideoUrl =
        painVideos.mild || painVideos.moderate || painVideos.severe || painVideos.no_pain;

      await api.post('/exercises', {
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
        variations,
        is_pro: formData.is_pro,
      });

      showSuccess('Đã thêm bài tập thành công');
      router.push('/admin/exercises');
    } catch (error) {
      console.error('Create exercise error:', error);
      showError('Không thể thêm bài tập');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/exercises" className="text-slate-600 hover:text-slate-900">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Thêm bài tập mới</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Thông tin cơ bản</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tên bài tập *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
                required
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mô tả
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows={3}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Link video theo mức đau *
              </label>
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
                    placeholder="https://www.youtube.com/watch?v=..."
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
                    placeholder="https://www.youtube.com/watch?v=..."
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
                    placeholder="https://www.youtube.com/watch?v=..."
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
                    placeholder="https://www.youtube.com/watch?v=..."
                    required
                  />
                </div>
              </div>
            </div>

            {/* Thumbnail */}
            <div className="md:col-span-2">
              <ImageUpload
                value={formData.thumbnail_url}
                onChange={(url) => setFormData({ ...formData, thumbnail_url: url })}
              />
            </div>

            {/* Calories */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Calories
              </label>
              <input
                type="number"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: parseInt(e.target.value) })}
                className="input"
                min="0"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Danh mục *
              </label>
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

            {/* Target Areas */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Vùng tác động *
              </label>
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

            {/* Tags */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tags (phân cách bằng dấu phẩy)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="input"
                placeholder="Người mới, Ngồi, Đứng"
              />
            </div>

            {/* Instructions */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Hướng dẫn (mỗi dòng 1 bước)
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                className="input"
                rows={5}
                placeholder="Bước 1: ...&#10;Bước 2: ..."
              />
            </div>

            {/* Benefits */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Lợi ích (mỗi dòng 1 lợi ích)
              </label>
              <textarea
                value={formData.benefits}
                onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                className="input"
                rows={4}
                placeholder="Giảm đau cổ&#10;Tăng linh hoạt"
              />
            </div>

            {/* PRO */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_pro}
                  onChange={(e) => setFormData({ ...formData, is_pro: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-slate-700">
                  Bài tập PRO (yêu cầu kích hoạt)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            <Save size={20} className="inline mr-2" />
            {loading ? 'Đang lưu...' : 'Lưu bài tập'}
          </button>
          <Link href="/admin/exercises" className="btn btn-secondary">
            Hủy
          </Link>
        </div>
      </form>
    </div>
  );
}
