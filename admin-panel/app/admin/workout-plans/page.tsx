'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Search, Edit, Trash2, Eye, Lock } from 'lucide-react';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmDialog from '@/components/ConfirmDialog';
import { showSuccess, showError } from '@/lib/toast';

interface WorkoutPlan {
  id: string;
  title: string;
  description: string;
  duration_days: number;
  target_area: string;
  difficulty: string;
  is_pro: boolean;
  created_at: string;
}

export default function WorkoutPlansPage() {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterArea, setFilterArea] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await api.get('/workout-plans');
      setPlans(data || []);
    } catch (error) {
      console.error('Load plans error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await api.delete(`/workout-plans/${deleteId}`);
      setPlans(plans.filter(p => p.id !== deleteId));
      setDeleteId(null);
      showSuccess('Đã xóa workout plan');
    } catch (error) {
      console.error('Delete error:', error);
      showError('Không thể xóa workout plan');
    }
  };

  const filteredPlans = plans.filter(plan => {
    const matchSearch = plan.title.toLowerCase().includes(search.toLowerCase());
    const matchArea = filterArea === 'all' || plan.target_area === filterArea;
    return matchSearch && matchArea;
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
        <h1 className="text-2xl font-bold text-slate-900">Quản lý Workout Plans</h1>
        <Link href="/admin/workout-plans/new" className="btn btn-primary">
          <Plus size={20} />
          Thêm Plan
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm plan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Filter by area */}
          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="input"
          >
            <option value="all">Tất cả vùng</option>
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

      {/* Plans Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                Tên Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                Thời lượng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                Vùng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                Độ khó
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                PRO
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredPlans.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  Không có workout plan nào
                </td>
              </tr>
            ) : (
              filteredPlans.map((plan) => (
                <tr key={plan.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{plan.title}</div>
                    <div className="text-sm text-slate-500 line-clamp-1">
                      {plan.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {plan.duration_days} ngày
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700">
                      {plan.target_area === 'neck' && 'Cổ'}
                      {plan.target_area === 'shoulder' && 'Vai'}
                      {plan.target_area === 'upper_back' && 'Lưng trên'}
                      {plan.target_area === 'middle_back' && 'Lưng giữa'}
                      {plan.target_area === 'lower_back' && 'Lưng dưới'}
                      {plan.target_area === 'arm' && 'Tay'}
                      {plan.target_area === 'leg' && 'Chân'}
                      {plan.target_area === 'full_body' && 'Toàn thân'}
                      {!['neck', 'shoulder', 'upper_back', 'middle_back', 'lower_back', 'arm', 'leg', 'full_body'].includes(plan.target_area) && plan.target_area}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {plan.difficulty === 'easy' && 'Dễ'}
                    {plan.difficulty === 'medium' && 'Trung bình'}
                    {plan.difficulty === 'hard' && 'Khó'}
                  </td>
                  <td className="px-6 py-4">
                    {plan.is_pro && (
                      <Lock className="text-yellow-600" size={16} />
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/workout-plans/${plan.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50"
                        title="Xem chi tiết"
                      >
                        <Eye size={18} />
                      </Link>
                      <Link
                        href={`/admin/workout-plans/${plan.id}/edit`}
                        className="p-2 text-slate-600 hover:bg-slate-100"
                        title="Sửa"
                      >
                        <Edit size={18} />
                      </Link>
                      <button
                        onClick={() => setDeleteId(plan.id)}
                        className="p-2 text-red-600 hover:bg-red-50"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xác nhận xóa"
        message="Bạn có chắc muốn xóa workout plan này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
      />
    </div>
  );
}
