'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../../../../lib/api';
import { storage } from '../../../../lib/storage';
import { getProfile, updateProfile, type User } from '../../../../services/auth';
import { useAuthStore } from '../../../../stores/authStore';
import { GuestProfile, useOnboardingStore } from '../../../../stores/onboardingStore';

type ActivationResponse = {
  user?: User;
};

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Đang hoàn tất đăng nhập Google...');

  useEffect(() => {
    let isMounted = true;

    const completeLogin = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const token = hashParams.get('token') || searchParams.get('token');
        const oauthError = hashParams.get('error') || searchParams.get('error');

        // Check if user is already logged in (e.g. from previous concurrent mount)
        const existingToken = storage.get<string>('therahome_token');
        if (!token && !oauthError && existingToken) {
          try {
            const profile = await getProfile();
            if (profile) {
              if (isMounted) {
                setUser(profile);
                setStatus('success');
                setMessage('Đăng nhập Google thành công!');
                const targetUrl = searchParams.get('redirectTo') || '/home';
                router.replace(targetUrl);
              }
              return;
            }
          } catch {
            storage.remove('therahome_token');
            storage.remove('therahome_user');
          }
        }

        if (token || oauthError) {
          window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
        }

        if (oauthError) {
          throw new Error(oauthError);
        }

        if (!token) {
          throw new Error('Không nhận được token đăng nhập từ server');
        }

        storage.set('therahome_token', token);

        const profile = await getProfile();
        if (!profile) {
          throw new Error('Không tải được hồ sơ người dùng');
        }

        let currentUser = profile;
        setUser(currentUser);

        const activationCode = searchParams.get('activationCode');
        if (activationCode) {
          try {
            const activateResponse = await api.post<ActivationResponse>('/codes/activate', { code: activationCode });
            if (activateResponse?.user) {
              currentUser = activateResponse.user;
              setUser(currentUser);
            }
          } catch (err) {
            console.error('Activate device after Google login error:', err);
          }
        }

        const draft = storage.get<GuestProfile>('therahome_onboarding_draft');
        if (draft && !currentUser.onboarding_completed) {
          try {
            currentUser = await updateProfile({
              ...draft,
              onboarding_completed: true,
            });
            setUser(currentUser);
            useOnboardingStore.getState().clearDraft();
          } catch (err) {
            console.error('Sync onboarding profile after Google login error:', err);
          }
        }

        if (!isMounted) return;

        setStatus('success');
        setMessage('Đăng nhập Google thành công!');

        const targetUrl = searchParams.get('redirectTo') || '/home';
        window.setTimeout(() => {
          router.replace(targetUrl);
        }, 700);
      } catch (err) {
        console.error('Google OAuth callback error:', err);
        storage.remove('therahome_token');
        storage.remove('therahome_user');

        if (!isMounted) return;

        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Đăng nhập Google thất bại');
      }
    };

    completeLogin();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams, setUser]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <section className="w-full max-w-[360px] rounded-[28px] bg-white px-6 py-8 text-center shadow-xl md:max-w-[460px] md:px-10 md:py-10">
        {status === 'loading' && (
          <div className="mx-auto mb-5 h-11 w-11 animate-spin rounded-full border-4 border-[#3B82F6] border-t-transparent" />
        )}
        {status === 'success' && <CheckCircle2 className="mx-auto mb-5 h-12 w-12 text-emerald-500" />}
        {status === 'error' && <XCircle className="mx-auto mb-5 h-12 w-12 text-rose-500" />}

        <h1 className="text-2xl font-black text-slate-950">
          {status === 'error' ? 'Không đăng nhập được' : 'Google Login'}
        </h1>
        <p className="mt-3 text-sm font-medium leading-6 text-slate-500">{message}</p>

        {status === 'error' && (
          <Link
            href="/login"
            className="mt-6 flex h-12 items-center justify-center rounded-full bg-[#3B82F6] text-sm font-bold text-white"
          >
            Thử lại
          </Link>
        )}
      </section>
    </main>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#3B82F6] border-t-transparent" />
        </main>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}
