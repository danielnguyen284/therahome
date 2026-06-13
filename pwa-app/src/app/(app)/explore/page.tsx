'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../stores/authStore';
import { api } from '../../../lib/api';
import { Sparkles, Check, ChevronRight, TabletSmartphone, ShieldAlert, Cpu } from 'lucide-react';

interface Product {
  id: string;
  key: string;
  name: string;
  image_url?: string;
  purchase_link?: string;
  description?: string;
}

export default function ExplorePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Extract owned devices
  const ownedDevicesList = useMemo(() => {
    if (!user?.owned_devices) return [];
    try {
      if (typeof user.owned_devices === 'string') {
        return JSON.parse(user.owned_devices);
      }
      return user.owned_devices;
    } catch {
      return [];
    }
  }, [user]);

  const ownedKeys = useMemo((): string[] => {
    return ownedDevicesList.map((d: any) => String(d.key || d.device_id || d.id || d.name || ''));
  }, [ownedDevicesList]);

  // Devices activated status
  const hasNeckDevice = useMemo(() => {
    return ownedKeys.some((k: string) => k.toLowerCase().includes('neck') || k.toLowerCase().includes('ech'));
  }, [ownedKeys]);

  const hasBackDevice = useMemo(() => {
    return ownedKeys.some((k: string) => k.toLowerCase().includes('back') || k.toLowerCase().includes('rung'));
  }, [ownedKeys]);

  const getProductByKeys = (keys: string[]) => {
    return products.find((product) => {
      const key = product.key.toLowerCase();
      const name = product.name.toLowerCase();
      return keys.some((target) => key.includes(target) || name.includes(target));
    });
  };

  const neckProduct = useMemo(() => getProductByKeys(['ech', 'neck']), [products]);
  const backProduct = useMemo(() => getProductByKeys(['rung', 'back']), [products]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await api.get<Product[]>('/products');
        if (data && Array.isArray(data)) {
          setProducts(data);
        }
      } catch (err) {
        console.warn('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm animate-pulse">Đang tìm kiếm thiết bị phù hợp...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      
      {/* Hero Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 text-white shadow-xl shadow-indigo-100 dark:shadow-none">
        <div className="absolute right-0 bottom-0 -mb-6 -mr-6 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/15 text-[10px] font-bold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5 fill-white" />
          Hệ sinh thái TheraHome
        </div>

        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight leading-tight">
          Thiết bị hỗ trợ phục hồi chuyên sâu
        </h1>
        
        <p className="text-white/80 text-xs md:text-sm mt-2 max-w-lg leading-relaxed">
          Đồng hành cùng lộ trình tập luyện với hai dòng thiết bị xung điện châm cứu dành cho cổ và thắt lưng của bạn.
        </p>
      </div>

      {/* Device grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Neck Device Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between">
          <div>
            {/* Visual Header */}
            <div className="h-44 bg-gradient-to-tr from-indigo-50 to-purple-55/40 dark:from-indigo-950/20 dark:to-purple-950/20 flex items-center justify-center relative border-b border-slate-50 dark:border-slate-800">
              {neckProduct?.image_url ? (
                <img
                  src={neckProduct.image_url}
                  alt={neckProduct.name}
                  className="max-h-36 max-w-[80%] object-contain drop-shadow-md"
                />
              ) : (
                <Cpu className="w-16 h-16 text-indigo-600 dark:text-indigo-400 drop-shadow-md" />
              )}
              <div className="absolute top-4 right-4 text-[10px] font-bold px-2 py-1 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                Xung châm & Nhiệt
              </div>
            </div>

            <div className="p-6">
              <h2 className="text-lg font-bold text-slate-850 dark:text-white">TheraNECK</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-2 leading-relaxed">
                Thiết bị giãn cơ, kích hoạt lưu thông máu vùng cổ vai gáy. Hỗ trợ giảm mỏi cơ sâu do ngồi sai tư thế làm việc dài ngày.
              </p>
            </div>
          </div>

          <div className="p-6 pt-0">
            {hasNeckDevice ? (
              <div className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-100 dark:shadow-none">
                <Check className="w-4 h-4 stroke-[3]" />
                Đã kích hoạt thiết bị
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/activate-device')}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 text-xs font-bold transition-all text-center"
                >
                  Kích hoạt
                </button>
                {neckProduct?.purchase_link ? (
                  <a
                    href={neckProduct.purchase_link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1 shadow-lg shadow-indigo-100 dark:shadow-none"
                  >
                    Nhận ưu đãi
                    <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="flex-1 py-3 rounded-2xl bg-slate-300 text-white text-xs font-bold text-center"
                  >
                    Chưa có link
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Back Device Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between">
          <div>
            {/* Visual Header */}
            <div className="h-44 bg-gradient-to-tr from-emerald-50/50 to-indigo-50/40 dark:from-emerald-950/20 dark:to-indigo-950/20 flex items-center justify-center relative border-b border-slate-50 dark:border-slate-800">
              {backProduct?.image_url ? (
                <img
                  src={backProduct.image_url}
                  alt={backProduct.name}
                  className="max-h-36 max-w-[80%] object-contain drop-shadow-md"
                />
              ) : (
                <TabletSmartphone className="w-16 h-16 text-emerald-600 dark:text-emerald-400 drop-shadow-md" />
              )}
              <div className="absolute top-4 right-4 text-[10px] font-bold px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                Xung châm & Rung cơ
              </div>
            </div>

            <div className="p-6">
              <h2 className="text-lg font-bold text-slate-850 dark:text-white">TheraBACK</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-2 leading-relaxed">
                Thiết bị massage thắt lưng với nhiệt trị liệu hồng ngoại. Giúp kéo giãn cơ lưng thắt lưng, phục hồi đường cong cột sống tự nhiên.
              </p>
            </div>
          </div>

          <div className="p-6 pt-0">
            {hasBackDevice ? (
              <div className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-100 dark:shadow-none">
                <Check className="w-4 h-4 stroke-[3]" />
                Đã kích hoạt thiết bị
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/activate-device')}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 text-xs font-bold transition-all text-center"
                >
                  Kích hoạt
                </button>
                {backProduct?.purchase_link ? (
                  <a
                    href={backProduct.purchase_link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1 shadow-lg shadow-indigo-100 dark:shadow-none"
                  >
                    Nhận ưu đãi
                    <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="flex-1 py-3 rounded-2xl bg-slate-300 text-white text-xs font-bold text-center"
                  >
                    Chưa có link
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Product reviews banner */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 flex items-start gap-4">
        <ShieldAlert className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white text-sm">Chính sách bảo hành 12 tháng</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 leading-relaxed">
            Tất cả thiết bị chính hãng TheraHome đều được hỗ trợ bảo hành 1 đổi 1 trong vòng 12 tháng đầu tiên nếu phát sinh lỗi kỹ thuật từ nhà sản xuất.
          </p>
        </div>
      </div>

      {/* Product reviews button */}
      <button
        onClick={() => router.push('/product-assessments')}
        className="w-full py-4 rounded-3xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all text-center flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 dark:shadow-none cursor-pointer"
      >
        Xem đánh giá sản phẩm
      </button>
    </div>
  );
}
