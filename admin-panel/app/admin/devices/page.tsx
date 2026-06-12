'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Search, Plus, Trash2, Smartphone } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';
import { showSuccess, showError } from '@/lib/toast';

interface User {
  id: string;
  full_name: string;
  email: string;
  owned_devices: Array<string | { key?: string; name?: string; activation_code?: string }>;
}

type OwnedDeviceValue = string | { key?: string; name?: string; activation_code?: string };

const DEVICES = [
  { id: 'neck_device', name: 'Thiết bị trị liệu cổ' },
  { id: 'back_device', name: 'Thiết bị trị liệu lưng' },
  { id: 'shoulder_device', name: 'Thiết bị trị liệu vai' },
  { id: 'arm_device', name: 'Thiết bị trị liệu tay' },
  { id: 'leg_device', name: 'Thiết bị trị liệu chân' },
];

function getDeviceLabel(item: string | { key?: string; name?: string; activation_code?: string }) {
  if (typeof item === 'string') {
    return DEVICES.find((device) => device.id === item)?.name || item;
  }

  return item.name || item.key || item.activation_code || 'Thiết bị';
}

function mapToDeviceId(item: OwnedDeviceValue) {
  if (typeof item === 'string') {
    return item;
  }

  const key = item.key?.toLowerCase();
  if (key === 'ech') return 'neck_device';
  if (key === 'rung') return 'back_device';

  const name = (item.name || '').toLowerCase();
  if (name.includes('ech') || name.includes('co') || name.includes('neck')) return 'neck_device';
  if (name.includes('rung') || name.includes('lung') || name.includes('back')) return 'back_device';

  return '';
}

export default function DevicesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<OwnedDeviceValue[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.get('/users');
      setUsers(data || []);
    } catch (error) {
      console.error('Load users error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDevices = (user: User) => {
    setSelectedUser(user);
    setSelectedDevices(user.owned_devices || []);
    setShowModal(true);
  };

  const handleSaveDevices = async () => {
    if (!selectedUser) return;

    try {
      await api.put(`/users/${selectedUser.id}/devices`, { owned_devices: selectedDevices });

      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, owned_devices: selectedDevices }
          : u
      ));

      setShowModal(false);
      showSuccess('Đã cập nhật thiết bị');
    } catch (error) {
      console.error('Update devices error:', error);
      showError('Không thể cập nhật thiết bị');
    }
  };

  const toggleDevice = (deviceId: string) => {
    const selectedIds = selectedDevices.map(mapToDeviceId);

    if (selectedIds.includes(deviceId)) {
      setSelectedDevices(selectedDevices.filter((device) => mapToDeviceId(device) !== deviceId));
    } else {
      setSelectedDevices([...selectedDevices, deviceId]);
    }
  };

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
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
        <h1 className="text-2xl font-bold text-slate-900">Quản lý thiết bị</h1>
      </div>

      {/* Search */}
      <div className="card p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Tìm user (tên hoặc email)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Thiết bị đã có</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className="font-medium">{user.full_name}</td>
                <td>{user.email}</td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {(user.owned_devices || []).length > 0 ? (
                      user.owned_devices.map((device, index) => {
                        return (
                          <span key={`${user.id}-${index}`} className="badge badge-success text-xs">
                            {getDeviceLabel(device)}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-slate-400 text-sm">Chưa có thiết bị</span>
                    )}
                  </div>
                </td>
                <td>
                  <button
                    onClick={() => handleAddDevices(user)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Smartphone size={18} />
                  </button>
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

      {/* Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Quản lý thiết bị
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              User: <strong>{selectedUser.full_name}</strong>
            </p>

            <div className="space-y-3 mb-6">
              {DEVICES.map(device => (
                <label key={device.id} className="flex items-center gap-3 p-3 border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDevices.map(mapToDeviceId).includes(device.id)}
                    onChange={() => toggleDevice(device.id)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {device.name}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handleSaveDevices} className="btn btn-primary flex-1">
                Lưu
              </button>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 text-sm text-slate-600">
        Tổng: {filteredUsers.length} users
      </div>
    </div>
  );
}
