'use client';

import React, { useEffect } from 'react';
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

    const isPublicRoute =
      pathname === '/login' ||
      pathname === '/about' ||
      pathname === '/terms' ||
      pathname === '/privacy' ||
      pathname === '/activate-device' ||
      pathname === '/auth/google/callback' ||
      pathname.startsWith('/onboarding');

    if (!isAuthenticated && !isPublicRoute) {
      // Bouncer for protected app pages
      router.push('/onboarding/splash');
    } else if (isAuthenticated && user) {
      if (!user.is_pro) {
        // Logged in but not activated -> redirect protected routes to activate-device
        if (!isPublicRoute) {
          router.push('/activate-device');
        }
      } else {
        // Logged in and activated
        if (pathname === '/login' || pathname === '/') {
          router.push('/home');
        } else if (user.onboarding_completed && pathname.startsWith('/onboarding')) {
          // Completed users shouldn't re-onboard
          router.push('/home');
        }
      }
    }
  }, [isLoading, isAuthenticated, user, pathname, router]);

  return <>{children}</>;
}
