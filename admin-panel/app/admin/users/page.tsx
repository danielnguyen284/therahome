'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Search } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { showError } from '@/lib/toast';

interface User {
  id: string;
  full_name: string;
  email: string;
  age: number;
  is_pro: boolean;
  created_at: string;
  owned_devices: Array<string | { key?: string; name?: string; activation_code?: string }>;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.get('/users');
      setUsers(data || []);
    } catch (error) {
      console.error('Load users error:', error);
      showError('Không thể tải danh sách users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const proCount = users.filter(u => u.is_pro).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Quản lý Users</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 p-4 hover:shadow-lg transition-all">
          <div className="text-2xl font-bold text-slate-900">{users.length}</div>
          <div className="text-sm text-slate-600">Tổng users</div>
        </div>
        <div className="bg-white border border-slate-200 p-4 hover:shadow-lg transition-all">
          <div className="text-2xl font-bold text-yellow-600">{proCount}</div>
          <div className="text-sm text-slate-600">PRO users</div>
        </div>
        <div className="bg-white border border-slate-200 p-4 hover:shadow-lg transition-all">
          <div className="text-2xl font-bold text-blue-600">{users.length - proCount}</div>
          <div className="text-sm text-slate-600">Free users</div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Tìm user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Tên</th>
              <th>Email</th>
              <th>Tuổi</th>
              <th>PRO</th>
              <th>Thiết bị</th>
              <th>Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className="font-medium">{user.full_name}</td>
                <td>{user.email}</td>
                <td>{user.age}</td>
                <td>
                  {user.is_pro && <span className="inline-block px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">PRO</span>}
                </td>
                <td>
                  <span className="text-sm text-slate-600">
                    {(user.owned_devices || []).length} thiết bị
                  </span>
                </td>
                <td className="text-sm text-slate-600">
                  {new Date(user.created_at).toLocaleDateString('vi-VN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            Không tìm thấy user nào
          </div>
        )}
      </div>
    </div>
  );
}
