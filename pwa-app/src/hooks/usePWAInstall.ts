'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa_banner_hidden_until';
const COOLDOWN_HOURS = 24;

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const iosDevice = /iphone|ipad|ipod/i.test(ua);
    const safariOnly = /safari/i.test(ua) && !/chrome|crios|fxios|edgios/i.test(ua);

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if user dismissed recently
    const hiddenUntil = localStorage.getItem(DISMISS_KEY);
    const inCooldown = !!hiddenUntil && Date.now() < Number(hiddenUntil);

    if (iosDevice && safariOnly) {
      setIsIOS(true);
      if (!inCooldown) setBannerVisible(true);
      return;
    }

    // Android/Chrome: listen for native install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      if (!inCooldown) setBannerVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setBannerVisible(false);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const triggerInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      setBannerVisible(false);
    }
  };

  // Dismiss hides banner for COOLDOWN_HOURS, then it reappears automatically next visit
  const dismiss = () => {
    const until = Date.now() + COOLDOWN_HOURS * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_KEY, String(until));
    setBannerVisible(false);
    setShowIOSGuide(false);
  };

  return {
    showBanner: bannerVisible && !isInstalled,
    isIOS,
    showIOSGuide,
    openIOSGuide: () => setShowIOSGuide(true),
    closeIOSGuide: () => setShowIOSGuide(false),
    triggerInstall,
    dismiss,
  };
}
