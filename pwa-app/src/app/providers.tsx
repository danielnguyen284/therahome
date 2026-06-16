'use client';

import React, { useCallback, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useOnboardingStore } from '../stores/onboardingStore';
import { useThemeStore } from '../stores/themeStore';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '../lib/api';
import { storage } from '../lib/storage';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const initializeAuth = useAuthStore((state) => state.initialize);
  const loadDraft = useOnboardingStore((state) => state.loadDraft);
  const { user, isLoading, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const getOnboardingTarget = useCallback(() => {
    const step = storage.get<string>('therahome_onboarding_step');
    const blockedSteps = new Set(['splash', 'device-offer', 'login']);
    if (step && !blockedSteps.has(step)) {
      return `/onboarding/${step}`;
    }
    return '/onboarding/welcome';
  }, []);

  useEffect(() => {
    // Init state
    initializeAuth();
    loadDraft();

    // Init Theme
    if (typeof window !== 'undefined') {
      const savedTheme = storage.get<'light' | 'dark'>('therahome_theme');
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

      if (initialTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      useThemeStore.getState().setTheme(initialTheme);

      // Init Font Size
      const savedFontSize = storage.get<'normal' | 'large' | 'extra-large'>('therahome_fontsize') || 'large';
      document.documentElement.classList.remove('font-size-normal', 'font-size-large', 'font-size-extra-large');
      document.documentElement.classList.add(`font-size-${savedFontSize}`);
      useThemeStore.getState().setFontSize(savedFontSize);
    }
  }, [initializeAuth, loadDraft]);

  // Service Worker and Web Push registration
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const registerAndSubscribe = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications not supported on this browser.');
        return;
      }

      try {
        // Register SW
        const reg = await navigator.serviceWorker.register('/sw.js');

        if (!isAuthenticated || !user) return;

        // Ask for permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('Notification permission not granted.');
          return;
        }

        // Get VAPID public key
        const keyData = await api.get<{ publicKey: string }>('/notifications/vapid-public-key');
        if (!keyData || !keyData.publicKey) {
          console.warn('Failed to fetch VAPID key.');
          return;
        }

        // Subscribe to push manager
        let subscription = await reg.pushManager.getSubscription();
        if (!subscription) {
          const convertedKey = urlBase64ToUint8Array(keyData.publicKey);
          subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedKey,
          });
        }

        // Send subscription to backend
        await api.post('/notification-token', {
          token: JSON.stringify(subscription),
          platform: 'web',
        });
        console.log('Web Push subscription registered successfully.');

      } catch (err) {
        console.error('Error during Web Push registration:', err);
      }
    };

    registerAndSubscribe();
  }, [isAuthenticated, user]);

  useEffect(() => {
    // Listen for global unauthorized events to bounce users to login
    const handleUnauthorized = () => {
      router.push('/login');
    };

    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth-unauthorized', handleUnauthorized);
    };
  }, [router]);

  // Client-side route guarding logic
  useEffect(() => {
    if (isLoading) return;

    const isLegalPublicRoute =
      pathname === '/about' ||
      pathname === '/terms' ||
      pathname === '/privacy';
    const isAuthRoute =
      pathname === '/login' ||
      pathname === '/auth/google/callback';
    const isOnboardingRoute = pathname.startsWith('/onboarding');
    const isActivationRoute = pathname === '/activate-device';
    const isPublicRoute = isLegalPublicRoute || isAuthRoute;

    if (!isAuthenticated && !isPublicRoute) {
      router.push('/login');
    } else if (isAuthenticated && user) {
      if (isAuthRoute || pathname === '/') {
        router.push(user.onboarding_completed ? '/activate-device' : getOnboardingTarget());
        return;
      }

      if (!user.onboarding_completed) {
        if (!isOnboardingRoute && !isLegalPublicRoute) {
          router.push(getOnboardingTarget());
        } else if (pathname === '/onboarding/splash') {
          router.push(getOnboardingTarget());
        }
        return;
      }

      const hasActivatedProduct = Boolean(user.is_pro || user.owned_devices?.length);
      if (!hasActivatedProduct) {
        if (!isActivationRoute && !isLegalPublicRoute) {
          router.push('/activate-device');
        }
        return;
      }

      if (isOnboardingRoute || isActivationRoute) {
        router.push('/home');
      }
    }
  }, [getOnboardingTarget, isLoading, isAuthenticated, user, pathname, router]);

  return <>{children}</>;
}
