'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Lock, Mail, Activity } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.post('/auth/admin-login', { email, password });

      // Lưu token và user vào localStorage
      api.setToken(data.token);
      api.setUser(data.user);

      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl flex shadow-2xl bg-white overflow-hidden">
        {/* Left - Branding */}
        <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-blue-600 to-blue-800 p-10 flex-col justify-center text-white">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-square-ai.png" alt="Thera AI Mark" className="w-full h-full object-contain brightness-0 invert" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Thera AI</h1>
              <p className="text-blue-100 text-sm">Admin Panel</p>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold leading-tight mb-4">
            Hệ thống quản lý<br />trị liệu
          </h2>
          <p className="text-blue-100 text-base">
            Quản lý bài tập, thiết bị, người dùng và AI
          </p>
        </div>

        {/* Right - Form */}
        <div className="w-full lg:w-3/5 p-10 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-square-ai.png" alt="Thera AI Mark" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Thera AI</h1>
                <p className="text-slate-600 text-xs">Admin Panel</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Đăng nhập
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 focus:border-blue-500 focus:outline-none transition-colors text-slate-900 text-sm"
                    placeholder="email@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 focus:border-blue-500 focus:outline-none transition-colors text-slate-900 text-sm"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin" style={{ borderRadius: '50%' }}></div>
                    Đang đăng nhập...
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </button>
            </form>

            <p className="text-center text-xs text-slate-500 mt-8">
              © {new Date().getFullYear()} TheraHome
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
