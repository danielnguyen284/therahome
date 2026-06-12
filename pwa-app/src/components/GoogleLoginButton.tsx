'use client';

import React, { useState } from 'react';

interface GoogleLoginButtonProps {
  onSuccess?: (data: unknown) => void;
  onFailure?: (error: Error) => void;
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  className?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export default function GoogleLoginButton({
  theme = 'outline',
  shape = 'pill',
  className = '',
}: GoogleLoginButtonProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startGoogleLogin = () => {
    if (typeof window === 'undefined') return;

    try {
      setIsRedirecting(true);
      setError(null);

      const callbackUrl = new URL('/auth/google/callback', window.location.origin);
      callbackUrl.search = window.location.search;

      const startUrl = new URL(`${API_BASE_URL.replace(/\/$/, '')}/auth/google/start`, window.location.origin);
      startUrl.searchParams.set('redirectTo', callbackUrl.toString());

      window.location.assign(startUrl.toString());
    } catch (err) {
      console.error('Failed to start Google OAuth redirect:', err);
      setIsRedirecting(false);
      setError('Không thể mở đăng nhập Google. Kiểm tra cấu hình API URL.');
    }
  };

  const isFilled = theme === 'filled_blue' || theme === 'filled_black';
  const radiusClass = shape === 'pill' ? 'rounded-full' : shape === 'circle' ? 'rounded-full' : 'rounded-xl';
  const colorClass = isFilled
    ? theme === 'filled_black'
      ? 'bg-slate-950 text-white'
      : 'bg-[#4285F4] text-white'
    : 'bg-white text-slate-700';

  return (
    <div className={`flex w-full flex-col items-center ${className}`}>
      <div className={`flex min-h-[44px] w-full items-center justify-center ${radiusClass} ${colorClass}`}>
        <button
          type="button"
          onClick={startGoogleLogin}
          disabled={isRedirecting}
          className={`flex h-full min-h-[44px] w-full items-center justify-center gap-3 px-5 text-[15px] font-semibold transition active:scale-[0.99] disabled:cursor-wait disabled:opacity-80 ${radiusClass}`}
        >
          {isRedirecting ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-black text-[#4285F4]">
              G
            </span>
          )}
          {isRedirecting ? 'Đang chuyển sang Google...' : 'Đăng nhập với Google'}
        </button>
      </div>
      {error && <p className="mt-2 text-center text-xs font-medium text-rose-500">{error}</p>}
    </div>
  );
}
