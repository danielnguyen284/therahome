'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import GoogleLoginButton from '../../components/GoogleLoginButton';
import { useOnboardingStore, GuestProfile } from '../../stores/onboardingStore';
import { useAuthStore } from '../../stores/authStore';
import { updateProfile, type User } from '../../services/auth';
import { api } from '../../lib/api';
import { storage } from '../../lib/storage';
import { CheckCircle2 } from 'lucide-react';

const messages = [
  'Hãy cùng lên ý tưởng',
  'Giảm đau hiệu quả mỗi ngày',
  'Phục hồi cơ thể khỏe mạnh',
  'Bác sĩ hỗ trợ trong túi',
  'Lộ trình dành riêng cho bạn',
];

type LoginSuccessResponse = {
  user: User;
};

const getPostLoginTarget = (user: User) => {
  if (!user.onboarding_completed) return '/onboarding/welcome';
  return user.is_pro || user.owned_devices?.length ? '/home' : '/activate-device';
};

type ActivationResponse = {
  user?: User;
};

function TypewriterText() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentMessage = messages[messageIndex];
    const timeout = window.setTimeout(
      () => {
        if (!isDeleting && displayText.length < currentMessage.length) {
          setDisplayText(currentMessage.slice(0, displayText.length + 1));
          return;
        }

        if (!isDeleting && displayText.length === currentMessage.length) {
          window.setTimeout(() => setIsDeleting(true), 1200);
          return;
        }

        if (isDeleting && displayText.length > 0) {
          setDisplayText(currentMessage.slice(0, displayText.length - 1));
          return;
        }

        setIsDeleting(false);
        setMessageIndex((prev) => (prev + 1) % messages.length);
      },
      isDeleting ? 26 : 72
    );

    return () => window.clearTimeout(timeout);
  }, [displayText, isDeleting, messageIndex]);

  return (
    <div className="flex min-h-[60px] items-center justify-center px-5 text-center text-[22px] font-semibold leading-8 text-white drop-shadow-md">
      <span>{displayText}</span>
      <span className="ml-0.5 animate-pulse font-light">|</span>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activationCode = null;
  const { setUser } = useAuthStore();

  const [isMerging, setIsMerging] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLoginSuccess = async (authResponse: unknown) => {
    if (!authResponse || typeof authResponse !== 'object' || !('user' in authResponse)) return;
    const typedAuthResponse = authResponse as LoginSuccessResponse;
    let currentUser = typedAuthResponse.user;
    const draft = storage.get<GuestProfile>('therahome_onboarding_draft');

    setIsMerging(true);
    try {
      if (activationCode) {
        try {
          const activateResponse = await api.post<ActivationResponse>('/codes/activate', { code: activationCode });
          if (activateResponse?.user) {
            currentUser = activateResponse.user;
            setUser(currentUser);
          }
        } catch (err) {
          console.error('Activate device after login error:', err instanceof Error ? err.message : err);
        }
      }

      if (draft && !currentUser.onboarding_completed) {
        try {
          const updatedUser = await updateProfile({
            ...draft,
            onboarding_completed: true,
          });
          currentUser = updatedUser;
          setUser(currentUser);
          useOnboardingStore.getState().clearDraft();
          setSuccessMsg('Đã đồng bộ hồ sơ tập luyện thành công!');
        } catch (err) {
          console.error('Sync onboarding profile error:', err);
        }
      } else if (activationCode) {
        setSuccessMsg('Đăng nhập và kích hoạt thiết bị thành công!');
      }

      const targetUrl = getPostLoginTarget(currentUser);
      window.setTimeout(() => {
        router.push(targetUrl);
      }, 1100);
    } catch (err) {
      console.error('Login post-processing error:', err);
      router.push(getPostLoginTarget(typedAuthResponse.user));
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="w-full animate-slide-up">
      {activationCode && (
        <div className="mb-4 rounded-full bg-white/15 px-4 py-2 text-center text-xs font-bold text-white backdrop-blur">
          Đang kích hoạt mã: {activationCode}
        </div>
      )}

      {isMerging ? (
        <div className="flex min-h-[112px] flex-col items-center justify-center rounded-[20px] bg-white/95 px-6 text-center shadow-xl">
          <div className="mb-4 h-9 w-9 animate-spin rounded-full border-4 border-[#5B9BD5] border-t-transparent" />
          <p className="text-sm font-bold text-[#5B9BD5]">Đang đồng bộ hồ sơ tập luyện của bạn...</p>
        </div>
      ) : successMsg ? (
        <div className="flex min-h-[112px] flex-col items-center justify-center rounded-[20px] bg-white/95 px-6 text-center shadow-xl">
          <CheckCircle2 className="mb-3 h-11 w-11 text-emerald-500" />
          <p className="text-sm font-bold text-slate-700">{successMsg}</p>
        </div>
      ) : (
        <>
          <GoogleLoginButton
            onSuccess={handleLoginSuccess}
            theme="outline"
            shape="pill"
            className="mx-auto max-w-[430px] md:max-w-[480px] [&>div:first-child]:min-h-[56px] md:[&>div:first-child]:min-h-[62px] [&>div:first-child]:rounded-[20px] [&>div:first-child]:bg-white/95 [&>div:first-child]:shadow-[0_8px_20px_rgba(0,0,0,0.28)]"
          />

          <p className="mx-auto mt-5 max-w-[320px] text-center text-[13px] leading-5 text-white/75 md:max-w-[420px] md:text-sm md:leading-6">
            Bằng cách đăng nhập, bạn đồng ý với{' '}
            <Link href="/terms" className="font-bold text-white underline underline-offset-2">
              Điều khoản sử dụng
            </Link>{' '}
            và{' '}
            <Link href="/privacy" className="font-bold text-white underline underline-offset-2">
              Chính sách bảo mật
            </Link>
          </p>
        </>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <Image src="/images/background-login.png" alt="" fill priority className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/65" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-[8vw] pb-10 pt-14 md:max-w-[680px] md:px-12 md:pb-14 md:pt-16 lg:max-w-[760px]">
        <section className="flex flex-1 flex-col items-center justify-center">
          <div className="mb-4 w-full max-w-[320px] md:max-w-[430px]">
            <Image
              src="/images/therahome-logo-white.png"
              alt="TheraHome"
              width={320}
              height={100}
              priority
              className="h-auto w-full object-contain drop-shadow-md"
            />
          </div>
          <TypewriterText />
        </section>

        <Suspense fallback={
          <div className="flex min-h-[112px] items-center justify-center rounded-[20px] bg-white/95 shadow-xl">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#5B9BD5] border-t-transparent" />
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
