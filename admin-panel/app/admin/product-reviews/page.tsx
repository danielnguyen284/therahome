'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Edit, Trash2, Search, Star } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmDialog from '@/components/ConfirmDialog';
import Modal from '@/components/Modal';
import { showSuccess, showError } from '@/lib/toast';

interface Product {
  id: string;
  key: string;
  name: string;
}

interface ProductReviewItem {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  content: string;
  scope?: 'public' | 'private';
  reviewer_type?: 'admin' | 'user';
  created_at: string;
  updated_at: string;
  product?: Product | null;
}

interface ReviewForm {
  product_id: string;
  rating: number;
  content: string;
}

const REVIEWABLE_KEYS = new Set(['ech', 'rung']);

const EMPTY_FORM: ReviewForm = {
  product_id: '',
  rating: 5,
  content: '',
};

export default function ProductReviewsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<ProductReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductReviewItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<ProductReviewItem | null>(null);
  const [form, setForm] = useState<ReviewForm>(EMPTY_FORM);

  useEffect(() => {
    void loadData();
  }, []);

  const reviewableProducts = useMemo(() => {
    const filtered = products.filter((item) => REVIEWABLE_KEYS.has(item.key.toLowerCase()));
    return filtered.length > 0 ? filtered : products;
  }, [products]);

  const productMap = useMemo(() => {
    return new Map(reviewableProducts.map((item) => [item.id, item]));
  }, [reviewableProducts]);

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return items;

    return items.filter((item) => {
      const productLabel = item.product?.name || productMap.get(item.product_id)?.name || '';
      return [productLabel, item.content, item.author_name]
        .join(' ')
        .toLowerCase()
        .includes(keyword);
    });
  }, [items, productMap, search]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productData, reviewData] = await Promise.all([
        api.get<Product[]>('/products'),
        api.get<ProductReviewItem[]>('/product-reviews/admin-feed'),
      ]);

      setProducts(productData || []);
      setItems(reviewData || []);
      setForm((prev) => ({
        ...prev,
        product_id: prev.product_id || productData?.find((item) => REVIEWABLE_KEYS.has(item.key.toLowerCase()))?.id || productData?.[0]?.id || '',
      }));
    } catch (error) {
      console.error('Load product reviews error:', error);
      showError('Không thể tải dữ liệu đánh giá sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setForm({
      ...EMPTY_FORM,
      product_id: reviewableProducts[0]?.id || '',
    });
    setShowModal(true);
  };

  const openEditModal = (item: ProductReviewItem) => {
    setEditingItem(item);
    setForm({
      product_id: item.product_id,
      rating: item.rating,
      content: item.content,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingItem(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.product_id) {
      showError('Vui lòng chọn sản phẩm');
      return;
    }

    if (!form.content.trim()) {
      showError('Vui lòng nhập nội dung đánh giá');
      return;
    }

    if (!Number.isFinite(form.rating) || form.rating < 1 || form.rating > 5) {
      showError('Số sao phải từ 1 đến 5');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        product_id: form.product_id,
        author_name: 'TheraHome',
        rating: Number(form.rating),
        content: form.content.trim(),
        badge: '',
      };

      if (editingItem) {
        await api.put(`/product-reviews/${editingItem.id}`, payload);
        showSuccess('Đã cập nhật đánh giá sản phẩm');
      } else {
        await api.post('/product-reviews', payload);
        showSuccess('Đã thêm đánh giá sản phẩm');
      }

      closeModal();
      await loadData();
    } catch (error: any) {
      console.error('Save product review error:', error);
      showError(error.message || 'Không thể lưu đánh giá sản phẩm');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      await api.delete(`/product-reviews/${deleteItem.id}`);
      setItems((prev) => prev.filter((item) => item.id !== deleteItem.id));
      showSuccess('Đã xóa đánh giá sản phẩm');
    } catch (error: any) {
      console.error('Delete product review error:', error);
      showError(error.message || 'Không thể xóa đánh giá sản phẩm');
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
    <div className="animate-fadeIn space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Đánh Giá Sản Phẩm</h1>
          <p className="text-sm text-slate-500 mt-1">
            Admin tạo review công khai và đồng thời theo dõi được đánh giá riêng của từng người dùng.
          </p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          <Plus size={18} className="mr-2" />
          Thêm đánh giá
        </button>
      </div>

      <div className="card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo sản phẩm, người dùng hoặc nội dung..."
            className="input pl-10"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Loại</th>
                <th>Người đánh giá</th>
                <th>Số sao</th>
                <th>Nội dung</th>
                <th>Ngày cập nhật</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const product = item.product || productMap.get(item.product_id);

                return (
                  <tr key={item.id}>
                    <td>
                      <div className="font-semibold text-slate-900">{product?.name || 'Không rõ sản phẩm'}</div>
                      <div className="text-xs text-slate-500 uppercase">{product?.key || '--'}</div>
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          item.scope === 'private'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {item.scope === 'private' ? 'Người dùng' : 'Admin công khai'}
                      </span>
                    </td>
                    <td>
                      <div className="font-semibold text-slate-900">{item.author_name || 'Ẩn danh'}</div>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-amber-500 font-semibold">
                        <Star size={16} fill="currentColor" />
                        {item.rating}/5
                      </span>
                    </td>
                    <td className="max-w-md">
                      <p className="line-clamp-3 text-slate-700">{item.content}</p>
                    </td>
                    <td className="text-sm text-slate-600">
                      {new Date(item.updated_at || item.created_at).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false,
                      })}
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        {item.scope === 'private' ? (
                          <span className="text-sm text-slate-400">Chỉ xem</span>
                        ) : (
                          <>
                            <button
                              onClick={() => openEditModal(item)}
                              className="text-blue-600 hover:text-blue-700"
                              aria-label={`Sửa review ${product?.name || 'sản phẩm'}`}
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => setDeleteItem(item)}
                              className="text-red-600 hover:text-red-700"
                              aria-label={`Xóa review ${product?.name || 'sản phẩm'}`}
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 && (
          <div className="py-12 text-center text-slate-500">
            {items.length === 0 ? 'Chưa có đánh giá sản phẩm nào' : 'Không tìm thấy đánh giá phù hợp'}
          </div>
        )}
      </div>

      <div className="text-sm text-slate-600">Tổng: {filteredItems.length} đánh giá</div>

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingItem ? 'Cập nhật đánh giá sản phẩm' : 'Thêm đánh giá sản phẩm'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Sản phẩm</label>
            <select
              value={form.product_id}
              onChange={(event) => setForm((prev) => ({ ...prev, product_id: event.target.value }))}
              className="input"
            >
              {reviewableProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.key})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Số sao</label>
            <select
              value={form.rating}
              onChange={(event) => setForm((prev) => ({ ...prev, rating: Number(event.target.value) }))}
              className="input"
            >
              {[5, 4, 3, 2, 1].map((star) => (
                <option key={star} value={star}>
                  {star} sao
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nội dung đánh giá</label>
            <textarea
              value={form.content}
              onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
              className="input min-h-[140px]"
              placeholder="Nhập cảm nhận chi tiết về sản phẩm..."
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button onClick={handleSave} className="btn btn-primary flex-1" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu đánh giá'}
            </button>
            <button onClick={closeModal} className="btn btn-secondary flex-1" disabled={saving}>
              Hủy
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteItem !== null}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Xác nhận xóa đánh giá"
        message="Bạn có chắc muốn xóa đánh giá này không?"
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
      />
    </div>
  );
}
