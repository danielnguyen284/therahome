'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { showSuccess, showError } from '@/lib/toast';

interface Code {
  id: string;
  code: string;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
}

export default function CodesPage() {
  const [codes, setCodes] = useState<Code[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [quantity, setQuantity] = useState(10);
  const [prefix, setPrefix] = useState('THERA');

  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    try {
      const data = await api.get('/codes');
      setCodes(data || []);
    } catch (error) {
      console.error('Load codes error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = prefix + '-';
    for (let i = 0; i < 8; i++) {
      if (i === 4) code += '-';
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleGenerate = async () => {
    if (quantity < 1 || quantity > 100) {
      showError('Số lượng phải từ 1-100');
      return;
    }

    setGenerating(true);

    try {
      await api.post('/codes/generate', { quantity, prefix });
      await loadCodes();
      showSuccess(`Đã tạo ${quantity} codes`);
    } catch (error) {
      console.error('Generate codes error:', error);
      showError('Không thể tạo codes');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportCSV = () => {
    const csv = [
      ['Code', 'Status', 'Used By', 'Used At', 'Created At'],
      ...codes.map(c => [
        c.code,
        c.is_used ? 'Used' : 'Available',
        c.used_by || '',
        c.used_at || '',
        c.created_at,
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activation-codes-${Date.now()}.csv`;
    a.click();
  };

  const unusedCount = codes.filter(c => !c.is_used).length;
  const usedCount = codes.filter(c => c.is_used).length;

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
        <h1 className="text-2xl font-bold text-slate-900">Activation Codes</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-2xl font-bold text-slate-900">{codes.length}</div>
          <div className="text-sm text-slate-600">Tổng codes</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-green-600">{unusedCount}</div>
          <div className="text-sm text-slate-600">Chưa sử dụng</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-slate-400">{usedCount}</div>
          <div className="text-sm text-slate-600">Đã sử dụng</div>
        </div>
      </div>

      {/* Generate Form */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Tạo codes mới</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Số lượng
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="input"
              min="1"
              max="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Prefix
            </label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.toUpperCase())}
              className="input"
              maxLength={10}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="btn btn-primary w-full"
            >
              <Plus size={20} className="inline mr-2" />
              {generating ? 'Đang tạo...' : 'Tạo codes'}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Trạng thái</th>
              <th>Người dùng</th>
              <th>Ngày sử dụng</th>
              <th>Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((code, index) => (
              <tr key={code.id || `code-${index}`}>
                <td className="font-mono font-medium">{code.code}</td>
                <td>
                  {code.is_used ? (
                    <span className="badge badge-danger">Đã dùng</span>
                  ) : (
                    <span className="badge badge-success">Chưa dùng</span>
                  )}
                </td>
                <td className="text-sm text-slate-600">
                  {code.used_by || '-'}
                </td>
                <td className="text-sm text-slate-600">
                  {code.used_at ? new Date(code.used_at).toLocaleDateString('vi-VN') : '-'}
                </td>
                <td className="text-sm text-slate-600">
                  {new Date(code.created_at).toLocaleDateString('vi-VN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {codes.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            Chưa có codes nào
          </div>
        )}
      </div>
    </div>
  );
}
