'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmDialog from '@/components/ConfirmDialog';
import { showSuccess, showError } from '@/lib/toast';

interface Exercise {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  is_pro: boolean;
  thumbnail_url: string;
  video_urls_by_pain?: {
    no_pain?: string;
    mild?: string;
    moderate?: string;
    severe?: string;
  };
  created_at: string;
}

const getPainVideoCount = (exercise: Exercise) => {
  const painVideos = exercise.video_urls_by_pain || {};
  return ['no_pain', 'mild', 'moderate', 'severe'].filter((key) => {
    const value = painVideos[key as keyof typeof painVideos];
    return typeof value === 'string' && value.trim() !== '';
  }).length;
};

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteTitle, setDeleteTitle] = useState('');

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const data = await api.get('/exercises');
      setExercises(data || []);
    } catch (error) {
      console.error('Load exercises error:', error);
      showError('Không thể tải danh sách bài tập');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await api.delete(`/exercises/${deleteId}`);
      setExercises(exercises.filter(e => e.id !== deleteId));
      showSuccess('Đã xóa bài tập');
    } catch (error) {
      console.error('Delete error:', error);
      showError('Không thể xóa bài tập');
    }
  };

  const filteredExercises = exercises.filter(ex => {
    const matchSearch = ex.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || ex.category === categoryFilter;
    return matchSearch && matchCategory;
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý bài tập</h1>
        <Link href="/admin/exercises/new" className="btn btn-primary">
          <Plus size={20} />
          Thêm bài tập mới
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm bài tập..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input"
          >
            <option value="all">Tất cả danh mục</option>
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
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Thumbnail</th>
              <th>Tên bài tập</th>
              <th>Danh mục</th>
              <th>Video 4 mức</th>
              <th>PRO</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredExercises.map((exercise) => {
              const painVideoCount = getPainVideoCount(exercise);

              return (
              <tr key={exercise.id}>
                <td>
                  <img
                    src={exercise.thumbnail_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23e2e8f0'/%3E%3Ctext x='32' y='36' text-anchor='middle' font-size='20' fill='%2394a3b8'%3E🏋%3C/text%3E%3C/svg%3E"}
                    alt={exercise.title}
                    className="w-16 h-16 object-cover rounded"
                    onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23e2e8f0'/%3E%3Ctext x='32' y='36' text-anchor='middle' font-size='20' fill='%2394a3b8'%3E🏋%3C/text%3E%3C/svg%3E"; }}
                  />
                </td>
                <td className="font-medium">{exercise.title}</td>
                <td>
                  <span className="badge badge-info">
                    {exercise.category === 'neck' && 'Cổ'}
                    {exercise.category === 'shoulder' && 'Vai'}
                    {exercise.category === 'upper_back' && 'Lưng trên'}
                    {exercise.category === 'middle_back' && 'Lưng giữa'}
                    {exercise.category === 'lower_back' && 'Lưng dưới'}
                    {exercise.category === 'arm' && 'Tay'}
                    {exercise.category === 'leg' && 'Chân'}
                    {exercise.category === 'full_body' && 'Toàn thân'}
                    {!['neck', 'shoulder', 'upper_back', 'middle_back', 'lower_back', 'arm', 'leg', 'full_body'].includes(exercise.category) && exercise.category}
                  </span>
                </td>
                <td>
                  <span className={`badge ${painVideoCount === 4 ? 'badge-success' : 'badge-warning'}`}>
                    {painVideoCount === 4 ? 'Đủ 4 mức' : `Thiếu ${4 - painVideoCount}/4`}
                  </span>
                </td>
                <td>
                  {exercise.is_pro && (
                    <span className="badge badge-warning">PRO</span>
                  )}
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/exercises/${exercise.id}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Sửa"
                    >
                      <Edit size={18} />
                    </Link>
                    <button
                      onClick={() => {
                        setDeleteId(exercise.id);
                        setDeleteTitle(exercise.title);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 transition-colors"
                      title="Xóa"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>

        {filteredExercises.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            Không tìm thấy bài tập nào
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-4 text-sm text-slate-600">
        Hiển thị {filteredExercises.length} / {exercises.length} bài tập
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xác nhận xóa"
        message={`Bạn có chắc muốn xóa bài tập "${deleteTitle}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
      />
    </div>
  );
}
