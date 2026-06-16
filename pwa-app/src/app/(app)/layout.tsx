'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores/authStore';
import { Home, Activity, Compass, BookOpen, User, LogOut, ShieldAlert, Download, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, signOut } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const { showBanner, isIOS, showIOSGuide, openIOSGuide, closeIOSGuide, triggerInstall, dismiss } = usePWAInstall();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Avoid flashing content if not authenticated (Providers will handle redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const navItems = [
    { name: 'Trang chủ', href: '/home', icon: Home },
    { name: 'Tư thế', href: '/posture', icon: Activity },
    { name: 'Khám phá', href: '/explore', icon: Compass },
    { name: 'Thư viện', href: '/library', icon: BookOpen },
    { name: 'Hồ sơ', href: '/profile', icon: User },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex flex-col md:w-20 xl:w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 xl:px-4 py-6">
        <div className="flex items-center justify-center xl:justify-start gap-3 px-2 mb-8">
          {/* Logo square mark for tablet/ipad */}
          <div className="w-9 h-9 shrink-0 xl:hidden">
            <img src="/images/logo-square-ai.png" alt="Thera AI Mark" className="w-full h-full object-contain" />
          </div>
          {/* Full Logo for desktop */}
          <div className="hidden xl:block h-9 w-auto">
            <img src="/images/therahome-logo-black.png" alt="TheraHome" className="h-full w-auto object-contain dark:hidden" />
            <img src="/images/therahome-logo-white.png" alt="TheraHome" className="h-full w-auto object-contain hidden dark:block" />
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-center xl:justify-start gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-50'
                }`}
                title={item.name}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden xl:inline">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile section at the bottom of sidebar */}
        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="hidden xl:flex items-center gap-3 px-2 py-1.5 mb-3">
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex items-center justify-center border border-slate-100 dark:border-slate-700">
              {user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                {user.full_name || 'Người dùng'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
            </div>
          </div>

          <button
            onClick={() => setIsSignOutModalOpen(true)}
            className="flex w-full items-center justify-center xl:justify-start gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
            title="Đăng xuất"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden xl:inline">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0 overflow-x-hidden pt-[env(safe-area-inset-top)]">
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 md:px-8 lg:px-10 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Floating Chatbot button */}
      <Link
        href="/chat"
        className="fixed right-4 bottom-20 z-40 w-14 h-14 rounded-full shadow-xl overflow-hidden border-2 border-white dark:border-slate-850 hover:scale-105 transition-all flex items-center justify-center bg-indigo-50"
        aria-label="Nhắn tin với AI trợ lý"
      >
        <img
          src="/images/xin-chao-toi-la-tro-ly.png"
          alt="Trợ lý bác sĩ"
          className="w-full h-full object-cover"
        />
        {/* Active badge */}
        <span className="absolute right-0.5 top-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
      </Link>

      {/* PWA Install Banner — hiện trên mobile, tự hiện lại sau 24h nếu đóng */}
      {showBanner && (
        <div className="fixed bottom-16 left-3 right-3 z-50 md:hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl shadow-2xl shadow-indigo-500/30 px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 overflow-hidden">
              <img src="/images/logo-square-ai.png" alt="TheraHome" className="w-8 h-8 object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold leading-tight">Thêm vào màn hình chính</p>
              <p className="text-indigo-200 text-[10px] leading-tight mt-0.5 truncate">Truy cập nhanh hơn, không cần trình duyệt</p>
            </div>
            {isIOS ? (
              <button
                onClick={openIOSGuide}
                className="flex items-center gap-1.5 bg-white text-indigo-600 text-xs font-bold px-3 py-1.5 rounded-xl shrink-0 hover:bg-indigo-50 active:scale-95 transition-all"
              >
                Cách cài
              </button>
            ) : (
              <button
                onClick={triggerInstall}
                className="flex items-center gap-1.5 bg-white text-indigo-600 text-xs font-bold px-3 py-1.5 rounded-xl shrink-0 hover:bg-indigo-50 active:scale-95 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Tải app
              </button>
            )}
            <button
              onClick={dismiss}
              className="text-white/50 hover:text-white transition-colors p-1 shrink-0"
              aria-label="Nhắc tôi sau"
              title="Nhắc lại sau 24 giờ"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-850 px-2 pt-1 pb-[calc(env(safe-area-inset-bottom)+0.25rem)] flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-3 text-[10px] font-medium transition-all rounded-lg ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout Dialog */}
      {isSignOutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-fade-in border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-lg font-bold">Xác nhận đăng xuất</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản TheraHome của mình?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setIsSignOutModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
              >
                Hủy
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Install Guide Sheet — mở khi bấm "Cách cài" trên banner */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden">
          {/* Backdrop — đóng guide nhưng KHÔNG dismiss banner */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeIOSGuide} />

          {/* Sheet */}
          <div className="relative w-full bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl px-5 pt-5 pb-10 border-t border-slate-100 dark:border-slate-800">
            {/* Handle bar */}
            <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-5" />

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100">
                  <img src="/images/logo-square-ai.png" alt="TheraHome" className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Cài đặt TheraHome</p>
                  <p className="text-[11px] text-slate-400">Thêm vào màn hình chính</p>
                </div>
              </div>
              <button
                onClick={closeIOSGuide}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500"
                aria-label="Đóng hướng dẫn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Steps */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Nhấn nút <span className="text-indigo-600">&ldquo;Chia sẻ&rdquo;</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tìm biểu tượng{' '}
                    <span className="inline-flex items-center gap-0.5 font-medium text-slate-700 dark:text-slate-200">
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                        <polyline points="16 6 12 2 8 6" />
                        <line x1="12" y1="2" x2="12" y2="15" />
                      </svg>
                      mũi tên hướng lên
                    </span>{' '}
                    ở thanh công cụ dưới cùng của Safari.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Chọn <span className="text-indigo-600">&ldquo;Thêm vào màn hình chính&rdquo;</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Cuộn xuống trong menu hiện ra và nhấn vào tùy chọn này.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Nhấn <span className="text-indigo-600">&ldquo;Thêm&rdquo;</span> để xác nhận
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">TheraHome sẽ xuất hiện như một ứng dụng trên màn hình chính của bạn.</p>
                </div>
              </div>
            </div>

            <div className="my-5 border-t border-slate-100 dark:border-slate-800" />

            <button
              onClick={closeIOSGuide}
              className="w-full py-3 rounded-2xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 active:scale-[0.98] transition-all"
            >
              Đã hiểu, để tôi thử
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
