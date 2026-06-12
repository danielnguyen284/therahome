'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Edit, Trash2, Search, Image as ImageIcon } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmDialog from '@/components/ConfirmDialog';
import { showSuccess, showError } from '@/lib/toast';

interface PostureItem {
  id: string;
  category: string;
  image_url: string;
  image_urls?: string[];
  is_correct: boolean;
  description: string;
  sort_order: number;
  created_at: string;
}

const CATEGORY_OPTIONS = [
  'Làm việc',
  'Ngủ',
  'Ngồi, nghỉ',
  'Dùng điện thoại',
  'Lái xe',
  'Bê vác',
];

export default function PosturesPage() {
  const [items, setItems] = useState<PostureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PostureItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: CATEGORY_OPTIONS[0],
    image_urls: '',
    is_correct: true,
    description: '',
    sort_order: '0',
  });

  useEffect(() => {
    void loadPostures();
  }, []);

  const loadPostures = async () => {
    try {
      const data = await api.get<PostureItem[]>('/postures');
      setItems(data || []);
    } catch (error) {
      console.error('Load postures error:', error);
      showError('Không thể tải dữ liệu tư thế');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      category: CATEGORY_OPTIONS[0],
      image_urls: '',
      is_correct: true,
      description: '',
      sort_order: '0',
    });
  };

  const handleSave = async () => {
    try {
      const payload = {
        category: formData.category.trim(),
        image_urls: formData.image_urls
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
        is_correct: formData.is_correct,
        description: formData.description.trim(),
        sort_order: Number(formData.sort_order) || 0,
      };

      if (!payload.category || payload.image_urls.length === 0 || !payload.description) {
        showError('Vui lòng nhập đầy đủ danh mục, ít nhất 1 ảnh và mô tả');
        return;
      }

      if (editingItem) {
        await api.put(`/postures/${editingItem.id}`, payload);
      } else {
        await api.post('/postures', payload);
      }

      setShowModal(false);
      resetForm();
      await loadPostures();
      showSuccess('Đã lưu');
    } catch (error) {
      console.error('Save posture error:', error);
      showError('Không thể lưu tư thế');
    }
  };

  const handleEdit = (item: PostureItem) => {
    setEditingItem(item);
    setFormData({
      category: item.category,
      image_urls: (item.image_urls && item.image_urls.length > 0
        ? item.image_urls
        : [item.image_url]
      ).join('\n'),
      is_correct: item.is_correct,
      description: item.description,
      sort_order: String(item.sort_order || 0),
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await api.delete(`/postures/${deleteId}`);
      setItems((prev) => prev.filter((item) => item.id !== deleteId));
      setDeleteId(null);
      showSuccess('Đã xóa');
    } catch (error) {
      console.error('Delete posture error:', error);
      showError('Không thể xóa tư thế');
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const keyword = search.trim().toLowerCase();
      const matchSearch =
        !keyword ||
        item.category.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword);
      const matchCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'correct' && item.is_correct) ||
        (statusFilter === 'incorrect' && !item.is_correct);

      return matchSearch && matchCategory && matchStatus;
    });
  }, [items, search, categoryFilter, statusFilter]);

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
          <h1 className="text-2xl font-bold text-slate-900">Tư thế</h1>
          <p className="text-sm text-slate-500 mt-1">
            Mỗi danh mục nên có 2 bản ghi: 1 mục đúng và 1 mục sai, mỗi mục có thể chứa nhiều ảnh.
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
          Thêm tư thế
        </button>
      </div>

      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Tìm theo danh mục hoặc mô tả..."
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
            <option value="all">Tất cả danh mục</option>
            {CATEGORY_OPTIONS.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="all">Đúng và sai</option>
            <option value="correct">Ảnh đúng</option>
            <option value="incorrect">Ảnh sai</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Danh mục</th>
              <th>Ảnh</th>
              <th>Loại</th>
              <th>Mô tả</th>
              <th>Thứ tự</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id}>
                <td className="font-medium">{item.category}</td>
                <td>
                  <a
                    href={item.image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <ImageIcon size={16} />
                    {(item.image_urls?.length || 1)} ảnh
                  </a>
                </td>
                <td>
                  <span className={item.is_correct ? 'badge badge-success' : 'badge badge-danger'}>
                    {item.is_correct ? 'Đúng' : 'Sai'}
                  </span>
                </td>
                <td className="max-w-sm text-sm text-slate-700">{item.description}</td>
                <td>{item.sort_order || 0}</td>
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

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            Chưa có dữ liệu tư thế nào
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {editingItem ? 'Sửa tư thế' : 'Thêm tư thế'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Danh mục</label>
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
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  URL ảnh
                </label>
                <textarea
                  value={formData.image_urls}
                  onChange={(e) => setFormData({ ...formData, image_urls: e.target.value })}
                  className="input"
                  rows={4}
                  placeholder={'Mỗi dòng là 1 URL ảnh\nhttps://...\nhttps://...'}
                />
                <p className="text-xs text-slate-500 mt-2">
                  Mỗi dòng là một ảnh. App sẽ hiển thị vuốt ngang trong cùng một card.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Loại ảnh</label>
                  <select
                    value={formData.is_correct ? 'correct' : 'incorrect'}
                    onChange={(e) =>
                      setFormData({ ...formData, is_correct: e.target.value === 'correct' })
                    }
                    className="input"
                  >
                    <option value="correct">Ảnh đúng</option>
                    <option value="incorrect">Ảnh sai</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Thứ tự</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                    className="input"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={5}
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
        message="Bạn có chắc muốn xóa tư thế này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
      />
    </div>
  );
}
