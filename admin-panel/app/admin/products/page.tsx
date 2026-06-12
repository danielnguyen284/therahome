'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';
import ImageUpload from '@/components/ImageUpload';
import { showError, showSuccess } from '@/lib/toast';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';

interface Product {
  id: string;
  key: string;
  name: string;
  image_url: string;
  purchase_link: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ProductForm {
  key: string;
  name: string;
  image_url: string;
  purchase_link: string;
}

const EMPTY_FORM: ProductForm = {
  key: '',
  name: '',
  image_url: '',
  purchase_link: '',
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);

  useEffect(() => {
    void loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.get<Product[]>('/products');
      setProducts(data || []);
    } catch (error) {
      console.error('Load products error:', error);
      showError('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return products;

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(keyword) ||
        product.key.toLowerCase().includes(keyword) ||
        (product.image_url || '').toLowerCase().includes(keyword) ||
        product.purchase_link.toLowerCase().includes(keyword)
      );
    });
  }, [products, search]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setForm({
      key: product.key,
      name: product.name,
      image_url: product.image_url || '',
      purchase_link: product.purchase_link || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingProduct(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.key.trim() || !form.name.trim()) {
      showError('Vui lòng nhập mã và tên sản phẩm');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        key: form.key.trim(),
        name: form.name.trim(),
        image_url: form.image_url.trim(),
        purchase_link: form.purchase_link.trim(),
      };

      if (editingProduct) {
        const updated = await api.put<Product>(`/products/${editingProduct.id}`, payload);
        setProducts((current) =>
          current.map((item) => (item.id === editingProduct.id ? updated : item)),
        );
        showSuccess('Đã cập nhật sản phẩm');
      } else {
        const created = await api.post<Product>('/products', payload);
        setProducts((current) => [...current, created]);
        showSuccess('Đã tạo sản phẩm');
      }

      closeModal();
    } catch (error: unknown) {
      console.error('Save product error:', error);
      showError(getErrorMessage(error, 'Không thể lưu sản phẩm'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${product.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/products/${product.id}`);
      setProducts((current) => current.filter((item) => item.id !== product.id));
      showSuccess('Đã xóa sản phẩm');
    } catch (error: unknown) {
      console.error('Delete product error:', error);
      showError(getErrorMessage(error, 'Không thể xóa sản phẩm'));
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
        <h1 className="text-2xl font-bold text-slate-900">Sản Phẩm</h1>
        <button onClick={openCreateModal} className="btn btn-primary">
          <Plus size={18} className="mr-2" />
          Thêm Sản Phẩm
        </button>
      </div>

      <div className="card p-4">
        <div className="relative max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên, mã hoặc link mua..."
            className="input pl-10"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Ảnh</th>
                <th>Tên sản phẩm</th>
                <th>Link mua</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td className="font-semibold text-slate-900">{product.key}</td>
                  <td>
                    {product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-14 w-14 border border-slate-200 object-contain"
                      />
                    ) : (
                      <span className="text-slate-400">Chưa có</span>
                    )}
                  </td>
                  <td className="font-medium text-slate-700">{product.name}</td>
                  <td>
                    {product.purchase_link ? (
                      <a
                        href={product.purchase_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-700 underline underline-offset-2 break-all"
                      >
                        {product.purchase_link}
                      </a>
                    ) : (
                      <span className="text-slate-400">Chưa có</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${product.is_active ? 'badge-success' : 'badge-warning'}`}
                    >
                      {product.is_active ? 'Đang dùng' : 'Tạm ẩn'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEditModal(product)}
                        className="text-blue-600 hover:text-blue-700"
                        aria-label={`Sửa ${product.name}`}
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="text-red-600 hover:text-red-700"
                        aria-label={`Xóa ${product.name}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-12 text-center text-slate-500">
            {products.length === 0 ? 'Chưa có sản phẩm nào' : 'Không tìm thấy sản phẩm phù hợp'}
          </div>
        )}
      </div>

      <div className="text-sm text-slate-600">Tổng: {filteredProducts.length} sản phẩm</div>

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingProduct ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Mã sản phẩm <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.key}
              onChange={(event) =>
                setForm((current) => ({ ...current, key: event.target.value.toUpperCase() }))
              }
              placeholder="Ví dụ: ECH"
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tên sản phẩm <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Ví dụ: TheraNECK"
              className="input"
              required
            />
          </div>

          <ImageUpload
            label="Ảnh sản phẩm"
            value={form.image_url}
            onChange={(url) => setForm((current) => ({ ...current, image_url: url }))}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Link mua hàng
            </label>
            <input
              type="url"
              value={form.purchase_link}
              onChange={(event) =>
                setForm((current) => ({ ...current, purchase_link: event.target.value }))
              }
              placeholder="https://..."
              className="input"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn btn-secondary">
              Hủy
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Đang lưu...' : editingProduct ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
