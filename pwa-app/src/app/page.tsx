'use client';

import React from 'react';
import Image from 'next/image';
import { useAuthStore } from '../stores/authStore';

export default function BootPage() {
  const { isLoading } = useAuthStore();

  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-gradient-to-tr from-slate-50 via-slate-100 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
      <div className="flex flex-col items-center max-w-sm md:max-w-xl px-6 md:px-10 text-center animate-fade-in">
        {/* Animated pulsing logo container */}
        <div className="relative w-28 h-28 mb-8 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-900 shadow-xl shadow-indigo-100 dark:shadow-none border border-slate-100 dark:border-slate-800 animate-pulse p-4">
          <Image
            src="/images/logo-square-ai.png"
            alt="Thera AI Logo"
            width={80}
            height={80}
            priority
            className="object-contain"
          />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          TheraHome
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Chăm sóc sức khỏe & Phục hồi vận động
        </p>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="mt-8 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
}
