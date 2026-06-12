'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmDialog from '@/components/ConfirmDialog';
import ImageUpload from '@/components/ImageUpload';
import { showSuccess, showError } from '@/lib/toast';

interface MotivationItem {
  id?: string;
  _id?: string;
  authorName: string;
  image: string;
  rating: number;
  content: string;
  badge?: string;
  created_at: string;
}

const getItemId = (item: MotivationItem) => item.id || item._id || '';

const initialForm = {
  authorName: 'Khách hàng',
  image: '',
  rating: 5,
  content: '',
  badge: '',
};

export default function MotivationsPage() {
  const [items, setItems] = useState<MotivationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MotivationItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const data = await api.get<MotivationItem[]>('/motivations');
      setItems((data || []).map((item) => ({ ...item, id: getItemId(item) })));
    } catch (error) {
      console.error('Load motivations error:', error);
      showError('Không thể tải Motivation');
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

  const handleEdit = (item: MotivationItem) => {
    setEditingItem(item);
    setFormData({
      authorName: item.authorName || 'Khách hàng',
      image: item.image || '',
      rating: item.rating || 5,
      content: item.content || '',
      badge: item.badge || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.authorName.trim()) {
      showError('Vui lòng nhập tên người đánh giá');
      return;
    }
    if (!formData.image.trim()) {
      showError('Vui lòng nhập hoặc upload ảnh');
      return;
    }
    if (!formData.content.trim()) {
      showError('Vui lòng nhập nội dung review');
      return;
    }

    const payload = {
      authorName: formData.authorName.trim(),
      image: formData.image.trim(),
      rating: Number(formData.rating),
      content: formData.content.trim(),
      badge: formData.badge.trim(),
    };

    try {
      if (editingItem) {
        await api.put(`/motivations/${getItemId(editingItem)}`, payload);
        showSuccess('Đã cập nhật Motivation');
      } else {
        await api.post('/motivations', payload);
        showSuccess('Đã thêm Motivation');
      }
      closeModal();
      loadItems();
    } catch (error) {
      console.error('Save motivation error:', error);
      showError('Không thể lưu Motivation');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await api.delete(`/motivations/${deleteId}`);
      setItems(items.filter((item) => getItemId(item) !== deleteId));
      showSuccess('Đã xóa Motivation');
    } catch (error) {
      console.error('Delete motivation error:', error);
      showError('Không thể xóa Motivation');
    }
  };

  const filteredItems = items.filter((item) =>
    [item.authorName, item.content, item.badge || '']
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  );

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
        <h1 className="text-2xl font-bold text-slate-900">Motivation Reviews</h1>
        <button onClick={openCreateModal} className="btn btn-primary">
          <Plus size={20} className="inline mr-2" />
          Thêm review
        </button>
      </div>

      <div className="card p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Tìm theo nội dung review..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Tác giả</th>
              <th>Ảnh</th>
              <th>Rating</th>
              <th>Badge</th>
              <th>Nội dung</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={getItemId(item)}>
                <td className="font-medium text-slate-900">{item.authorName}</td>
                <td>
                  <img
                    src={item.image}
                    alt="review"
                    className="w-16 h-16 object-cover border border-slate-200"
                  />
                </td>
                <td>
                  <span className="text-yellow-500 text-lg">
                    {'★'.repeat(item.rating)}
                  </span>
                  <span className="text-slate-300 text-lg">
                    {'★'.repeat(Math.max(0, 5 - item.rating))}
                  </span>
                </td>
                <td>
                  {item.badge ? (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700">
                      {item.badge}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-sm">--</span>
                  )}
                </td>
                <td className="max-w-md">
                  <p className="line-clamp-3">{item.content}</p>
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
                      onClick={() => setDeleteId(getItemId(item))}
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

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            Chưa có review Motivation nào
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {editingItem ? 'Sửa review Motivation' : 'Thêm review Motivation'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tên người đánh giá</label>
                <input
                  type="text"
                  value={formData.authorName}
                  onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                  className="input"
                  placeholder="Ví dụ: Minh Tuấn"
                />
              </div>

              <ImageUpload
                label="Ảnh review"
                value={formData.image}
                onChange={(url) => setFormData({ ...formData, image: url })}
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Rating (1-5)</label>
                <select
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                  className="input"
                >
                  <option value={5}>5 sao</option>
                  <option value={4}>4 sao</option>
                  <option value={3}>3 sao</option>
                  <option value={2}>2 sao</option>
                  <option value={1}>1 sao</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Badge</label>
                <input
                  type="text"
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  className="input"
                  placeholder="Ví dụ: -13kg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nội dung review</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="input"
                  rows={6}
                  placeholder="Nhập nội dung review..."
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
        title="Xác nhận xóa review"
        message="Bạn có chắc muốn xóa review Motivation này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
      />
    </div>
  );
}
