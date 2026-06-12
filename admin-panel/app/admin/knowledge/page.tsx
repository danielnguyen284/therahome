'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmDialog from '@/components/ConfirmDialog';
import { showSuccess, showError } from '@/lib/toast';

interface Knowledge {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  created_at: string;
}

export default function KnowledgePage() {
  const [items, setItems] = useState<Knowledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Knowledge | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'tips',
    tags: '',
  });

  useEffect(() => {
    loadKnowledge();
  }, []);

  const loadKnowledge = async () => {
    try {
      const data = await api.get('/knowledge');
      setItems(data || []);
    } catch (error) {
      console.error('Load knowledge error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const tags = formData.tags.split(',').map(t => t.trim()).filter(t => t);
      const payload = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        tags,
      };

      if (editingItem) {
        await api.put(`/knowledge/${editingItem.id}`, payload);
      } else {
        await api.post('/knowledge', payload);
      }

      setShowModal(false);
      setEditingItem(null);
      setFormData({ title: '', content: '', category: 'tips', tags: '' });
      loadKnowledge();
      showSuccess('Đã lưu');
    } catch (error) {
      console.error('Save error:', error);
      showError('Không thể lưu');
    }
  };

  const handleEdit = (item: Knowledge) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      content: item.content,
      category: item.category,
      tags: item.tags.join(', '),
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await api.delete(`/knowledge/${deleteId}`);
      setItems(items.filter(i => i.id !== deleteId));
      setDeleteId(null);
      showSuccess('Đã xóa');
    } catch (error) {
      console.error('Delete error:', error);
      showError('Không thể xóa');
    }
  };

  const filteredItems = items.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || item.category === categoryFilter;
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Knowledge Base</h1>
        <button
          onClick={() => {
            setEditingItem(null);
            setFormData({ title: '', content: '', category: 'tips', tags: '' });
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={20} className="inline mr-2" />
          Thêm tài liệu
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm..."
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
            <option value="tips">Tips</option>
            <option value="nutrition">Nutrition</option>
            <option value="exercises">Exercises</option>
            <option value="symptoms">Symptoms</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Tiêu đề</th>
              <th>Danh mục</th>
              <th>Tags</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id}>
                <td className="font-medium">{item.title}</td>
                <td>
                  <span className="badge badge-info">{item.category}</span>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map(tag => (
                      <span key={tag} className="badge badge-success text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
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

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            Không tìm thấy tài liệu nào
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {editingItem ? 'Sửa tài liệu' : 'Thêm tài liệu'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tiêu đề</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nội dung</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="input"
                  rows={10}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Danh mục</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input"
                >
                  <option value="tips">Tips</option>
                  <option value="nutrition">Nutrition</option>
                  <option value="exercises">Exercises</option>
                  <option value="symptoms">Symptoms</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="input"
                  placeholder="tag1, tag2, tag3"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button onClick={handleSave} className="btn btn-primary flex-1">
                Lưu
              </button>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xác nhận xóa"
        message="Bạn có chắc muốn xóa tài liệu này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
      />
    </div>
  );
}
