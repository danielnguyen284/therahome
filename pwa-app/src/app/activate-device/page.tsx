'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';
import { ArrowLeft, Camera, Keyboard, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function ActivateDevicePage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const [isManual, setIsManual] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [activationCode, setActivationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);

  // Dynamic import of html5-qrcode since it accesses document/window
  const [Html5Qrcode, setHtml5Qrcode] = useState<any>(null);

  useEffect(() => {
    import('html5-qrcode').then((module) => {
      setHtml5Qrcode(() => module.Html5Qrcode);
    });
  }, []);

  useEffect(() => {
    let qrScanner: any = null;
    if (isScanning && Html5Qrcode) {
      setErrorMsg(null);
      
      // Request camera permission explicitly in UI
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(() => {
          setCameraPermission(true);
          qrScanner = new Html5Qrcode('reader');
          qrScanner.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 220, height: 220 }
            },
            (decodedText: string) => {
              // Successfully scanned QR code
              handleActivateCode(decodedText);
              setIsScanning(false);
              if (qrScanner.isScanning) {
                qrScanner.stop().catch((e: any) => console.error(e));
              }
            },
            () => {
              // Silence scanner warnings
            }
          ).catch((err: any) => {
            console.error('Camera Scanner start error:', err);
            setErrorMsg('Không thể khởi chạy camera.');
            setIsScanning(false);
          });
        })
        .catch((err) => {
          console.error('Camera permission denied:', err);
          setCameraPermission(false);
          setIsScanning(false);
        });
    }

    return () => {
      if (qrScanner && qrScanner.isScanning) {
        qrScanner.stop().catch((e: any) => console.error(e));
      }
    };
  }, [isScanning, Html5Qrcode]);

  const handleActivateCode = async (codeStr: string) => {
    const normalizedCode = codeStr.trim().toUpperCase();
    if (!normalizedCode) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // If user is guest/unlogged
    if (!user || user.id === 'guest') {
      try {
        await api.post('/codes/validate', { code: normalizedCode });
        setSuccessMsg('Mã hợp lệ! Đang chuyển hướng đăng nhập...');
        setTimeout(() => {
          router.replace(`/login?activationCode=${normalizedCode}`);
        }, 1500);
      } catch (error: any) {
        setErrorMsg(error?.data?.error || 'Mã không hợp lệ hoặc chưa được kích hoạt.');
        setLoading(false);
      }
      return;
    }

    // If logged in
    try {
      const response: any = await api.post('/codes/activate', { code: normalizedCode });
      if (response?.user) {
        setUser(response.user);
      }
      setSuccessMsg('Kích hoạt thiết bị thành công!');
      setTimeout(() => {
        router.replace('/home');
      }, 1500);
    } catch (error: any) {
      setErrorMsg(error?.data?.error || 'Mã không hợp lệ hoặc đã được sử dụng.');
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleActivateCode(activationCode);
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
      {/* Back to Home/Splash */}
      <button
        onClick={() => router.back()}
        className="absolute top-6 left-6 flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md text-slate-700 dark:text-slate-300 hover:scale-105 transition-all"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="w-full max-w-md md:max-w-2xl bg-white dark:bg-slate-900 shadow-xl rounded-3xl border border-slate-100 dark:border-slate-800 p-6 md:p-10 flex flex-col items-center">
        
        {/* Title */}
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          Kích hoạt thiết bị Thera
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center mb-8">
          Mã kích hoạt nằm trên thẻ hoặc vỏ hộp đi kèm thiết bị.
        </p>

        {/* Info Message Box */}
        {!isScanning && (
          <div className="w-full bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-5 mb-8 text-center leading-relaxed">
            <p className="text-sm italic text-slate-600 dark:text-slate-400">
              Mã kích hoạt kèm theo ở trong hộp sản phẩm. Nếu bạn không thấy, vui lòng nhắn tin Zalo:{' '}
              <span className="font-bold not-italic text-slate-800 dark:text-slate-100">0364263552</span>
            </p>
          </div>
        )}

        {/* Scanner Viewport */}
        {isScanning && (
          <div className="w-full flex flex-col items-center justify-center mb-6">
            <div className="relative w-72 h-72 rounded-3xl overflow-hidden border-2 border-indigo-500 shadow-2xl shadow-indigo-500/10 bg-black">
              <div id="reader" className="w-full h-full object-cover bg-black"></div>
              {/* Scan Reticle */}
              <div className="absolute inset-0 border-[28px] border-slate-950/30 flex items-center justify-center pointer-events-none">
                <div className="w-full h-full border-2 border-dashed border-indigo-400 rounded-xl"></div>
              </div>
            </div>

            {loading && (
              <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Đang đối chiếu mã kích hoạt...
              </div>
            )}

            <button
              onClick={() => setIsScanning(false)}
              className="mt-6 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-xs font-bold transition-colors"
            >
              Hủy Quét
            </button>
          </div>
        )}

        {/* Error / Success Banners */}
        {errorMsg && (
          <div className="w-full flex items-center gap-3 p-4 mb-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-800 dark:text-rose-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-xs font-semibold leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="w-full flex items-center gap-3 p-4 mb-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-800 dark:text-emerald-300">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-xs font-semibold leading-relaxed">{successMsg}</p>
          </div>
        )}

        {/* Action Controls */}
        {!isScanning && (
          <div className="w-full space-y-4">
            {isManual ? (
              <form onSubmit={handleManualSubmit} className="space-y-4 animate-fade-in">
                <div>
                  <input
                    type="text"
                    required
                    disabled={loading}
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value)}
                    placeholder="Nhập mã kích hoạt tại đây..."
                    className="w-full py-4 px-5 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-lg font-bold text-center tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all placeholder:normal-case placeholder:tracking-normal placeholder:font-normal"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setIsManual(false)}
                    className="flex-1 h-13 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-sm font-bold transition-all"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !activationCode.trim()}
                    className="flex-1 h-13 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-full text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                    Xác nhận
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <button
                  onClick={() => setIsManual(true)}
                  className="flex w-full items-center justify-center gap-2.5 h-14 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-2 border-slate-100 dark:border-slate-800 rounded-full text-base font-bold shadow-sm transition-all"
                >
                  <Keyboard className="w-5 h-5" />
                  Nhập thủ công
                </button>

                <button
                  onClick={() => setIsScanning(true)}
                  className="flex w-full items-center justify-center gap-2.5 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-base font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:scale-[1.01] transition-all"
                >
                  <Camera className="w-5 h-5" />
                  Quét mã QR
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
