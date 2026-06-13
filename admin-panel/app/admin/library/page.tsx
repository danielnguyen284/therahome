'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Edit, Trash2, Search, ExternalLink } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmDialog from '@/components/ConfirmDialog';
import { showSuccess, showError } from '@/lib/toast';
import Image from 'next/image';
import ImageUpload from '@/components/ImageUpload';

interface LibraryItem {
  _id: string;
  title: string;
  category: string;
  coverImage: string;
  link: string;
  created_at: string;
}

const CATEGORY_OPTIONS = [
  'Hiểu đúng về bài tập',
  'Liệu pháp MC GILL',
  'Liệu pháp MC KENZIE',
  'Yoga Trị Liệu',
  'Dưỡng sinh Trị liệu',
  'Tập cùng TheraNECK'
];

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: CATEGORY_OPTIONS[0],
    coverImage: '',
    link: 'https://www.youtube.com/watch?v=2UkYJTfaT8E',
  });

  useEffect(() => {
    void loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const data = await api.get<LibraryItem[]>('/library');
      setItems(data || []);
    } catch (error) {
      console.error('Load library error:', error);
      showError('Không thể tải dữ liệu thư viện');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      category: CATEGORY_OPTIONS[0],
      coverImage: '',
      link: 'https://www.youtube.com/watch?v=2UkYJTfaT8E',
    });
  };

  const handleSave = async () => {
    try {
      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        coverImage: formData.coverImage.trim(),
        link: formData.link.trim(),
      };

      if (!payload.category || !payload.link) {
        showError('Vui lòng nhập hạng mục và link');
        return;
      }

      if (editingItem) {
        await api.put(`/library/${editingItem._id}`, payload);
      } else {
        await api.post('/library', payload);
      }

      setShowModal(false);
      resetForm();
      await loadItems();
      showSuccess('Đã lưu');
    } catch (error) {
      console.error('Save library error:', error);
      showError('Không thể lưu mục thư viện');
    }
  };

  const handleEdit = (item: LibraryItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title || '',
      category: item.category,
      coverImage: item.coverImage || '',
      link: item.link || '',
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await api.delete(`/library/${deleteId}`);
      setItems((prev) => prev.filter((item) => item._id !== deleteId));
      setDeleteId(null);
      showSuccess('Đã xóa');
    } catch (error) {
      console.error('Delete library error:', error);
      showError('Không thể xóa mục thư viện');
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const keyword = search.trim().toLowerCase();
      const matchSearch =
        !keyword ||
        (item.title && item.title.toLowerCase().includes(keyword));
      const matchCategory = categoryFilter === 'all' || item.category === categoryFilter;

      return matchSearch && matchCategory;
    });
  }, [items, search, categoryFilter]);

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
          <h1 className="text-2xl font-bold text-slate-900">Thư viện</h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý ảnh, hạng mục và liên kết bài tập.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={20} className="inline mr-2" />
          Thêm mục mới
        </button>
      </div>

      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Tìm theo tiêu đề..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input"
          >
            <option value="all">Tất cả hạng mục</option>
            {CATEGORY_OPTIONS.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Ảnh</th>
              <th>Tiêu đề</th>
              <th>Hạng mục</th>
              <th>Link</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item._id}>
                <td>
                  {item.coverImage ? (
                    <img 
                      src={item.coverImage} 
                      alt="Cover" 
                      className="w-16 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-10 bg-slate-100 flex items-center justify-center rounded text-xs text-slate-400">
                      Không có
                    </div>
                  )}
                </td>
                <td className="font-medium max-w-xs truncate">{item.title || '(Không có tiêu đề)'}</td>
                <td>
                  <span className="badge badge-primary bg-blue-50 text-blue-700">
                    {item.category}
                  </span>
                </td>
                <td>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
                  >
                    Xem link lưu trữ
                    <ExternalLink size={14} />
                  </a>
                </td>
                <td className="text-sm text-slate-600">
                  {new Date(item.created_at).toLocaleDateString('vi-VN')}
                </td>
                <td>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-700 p-1"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => setDeleteId(item._id)}
                      className="text-red-600 hover:text-red-700 p-1"
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
            Chưa có mục thư viện nào
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-2xl w-full p-6 rounded-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {editingItem ? 'Sửa thư viện ' : 'Thêm thư viện mới'}
            </h2>

            <div className="space-y-4">
              <div>
                <ImageUpload
                  value={formData.coverImage}
                  onChange={(url) => setFormData({ ...formData, coverImage: url })}
                  label="URL Ảnh (tuỳ chọn)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tiêu đề (tuỳ chọn)</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  placeholder="Nhập tiêu đề..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Hạng mục</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input"
                >
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Link</label>
                <input
                  type="text"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="input"
                  placeholder="https://youtube.com/..."
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button onClick={handleSave} className="btn btn-primary flex-1">
                Lưu
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="btn btn-secondary flex-1"
              >
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
        title="Xác nhận xóa"
        message="Bạn có chắc muốn xóa mục này khỏi thư viện? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
      />
    </div>
  );
}
