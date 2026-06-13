'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../stores/authStore';
import { api } from '../../../lib/api';
import { ArrowLeft, Star, Lock, MessageSquare, Check, Sparkles, AlertCircle } from 'lucide-react';

interface Product {
  id: string;
  key: string;
  name: string;
  image_url?: string;
  purchase_link?: string;
  description?: string;
}

interface ProductReview {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  content: string;
  badge?: string;
  scope?: 'public' | 'private';
  is_mine?: boolean;
  reviewer_type?: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

interface ReviewDraft {
  rating: number;
  content: string;
}

const PRODUCT_DESCRIPTIONS: Record<string, string> = {
  ech: 'Thiết bị hỗ trợ cải thiện vùng cổ vai gáy, phù hợp cho người ngồi nhiều và hay mỏi cổ.',
  rung: 'Thiết bị hỗ trợ thư giãn và giảm căng cứng vùng lưng, phù hợp cho nhu cầu phục hồi cơ sâu.',
};

export default function ProductAssessmentsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProductId, setSavingProductId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ReviewDraft>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<Record<string, string>>({});

  const isSignedIn = !!user && user.id !== 'guest';

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

  const canReviewProduct = (product: Product) => {
    const normalizedKey = product.key?.trim().toLowerCase();
    if (normalizedKey === 'ech') {
      return ownedKeys.some((k) => k.toLowerCase().includes('neck') || k.toLowerCase().includes('ech'));
    }
    if (normalizedKey === 'rung') {
      return ownedKeys.some((k) => k.toLowerCase().includes('back') || k.toLowerCase().includes('rung'));
    }
    return false;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const productData = await api.get<Product[]>('/products');
      setProducts(productData || []);

      let reviewData: ProductReview[] = [];
      if (isSignedIn) {
        try {
          reviewData = await api.get<ProductReview[]>('/product-reviews/my-feed');
        } catch (error) {
          console.warn('Unable to load personal product reviews:', error);
        }
      } else {
        // Fallback for guests: get public reviews
        try {
          reviewData = await api.get<ProductReview[]>('/product-reviews');
        } catch (error) {
          console.warn('Unable to load public product reviews:', error);
        }
      }

      setReviews(reviewData || []);

      // Build drafts from existing user reviews
      const initialDrafts: Record<string, ReviewDraft> = {};
      productData?.forEach((product) => {
        const personalReview = reviewData?.find(
          (item) => item.product_id === product.id && (item.is_mine || item.scope === 'private')
        );
        initialDrafts[product.id] = {
          rating: personalReview?.rating ?? 5,
          content: personalReview?.content ?? '',
        };
      });
      setDrafts(initialDrafts);
    } catch (error) {
      console.error('Load product reviews error:', error);
      setErrorMessage('Không thể tải dữ liệu đánh giá sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const updateDraft = (productId: string, patch: Partial<ReviewDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [productId]: {
        rating: prev[productId]?.rating ?? 5,
        content: prev[productId]?.content ?? '',
        ...patch,
      },
    }));
  };

  const handleSaveMyReview = async (product: Product) => {
    if (!isSignedIn) {
      alert('Vui lòng đăng nhập để thực hiện đánh giá.');
      return;
    }

    if (!canReviewProduct(product)) {
      alert('Bạn chỉ có thể đánh giá sản phẩm đã được kích hoạt.');
      return;
    }

    const draft = drafts[product.id] || { rating: 5, content: '' };

    if (!draft.content.trim()) {
      alert('Vui lòng nhập nội dung đánh giá của bạn.');
      return;
    }

    try {
      setSavingProductId(product.id);
      setSuccessMessage((prev) => ({ ...prev, [product.id]: '' }));

      await api.post('/product-reviews/my', {
        product_id: product.id,
        rating: draft.rating,
        content: draft.content.trim(),
      });

      setSuccessMessage((prev) => ({ ...prev, [product.id]: 'Đã lưu đánh giá thành công!' }));
      
      // Reload reviews to reflect updates
      const reviewData = await api.get<ProductReview[]>('/product-reviews/my-feed');
      setReviews(reviewData || []);
    } catch (error: any) {
      console.error('Save my product review error:', error);
      alert(error?.message || 'Không thể lưu đánh giá lúc này.');
    } finally {
      setSavingProductId(null);
    }
  };

  const renderStars = (rating: number, interactive = false, productId?: string) => {
    const stars = [];
    const currentRating = productId ? drafts[productId]?.rating ?? 5 : rating;

    for (let i = 1; i <= 5; i++) {
      const active = i <= currentRating;
      if (interactive && productId) {
        stars.push(
          <button
            key={i}
            type="button"
            onClick={() => updateDraft(productId, { rating: i })}
            className="focus:outline-none transition-transform active:scale-90"
          >
            <Star
              className={`w-6 h-6 ${
                active ? 'text-amber-500 fill-amber-500' : 'text-slate-300 dark:text-slate-700'
              }`}
            />
          </button>
        );
      } else {
        stars.push(
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${
              active ? 'text-amber-500 fill-amber-500' : 'text-slate-205 dark:text-slate-700'
            }`}
          />
        );
      }
    }

    return <div className="flex items-center gap-1">{stars}</div>;
  };

  const formatDateTime = (value: string) => {
    return new Date(value).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const resolveProductDescription = (product: Product) => {
    const key = product.key?.toLowerCase();
    if (PRODUCT_DESCRIPTIONS[key]) return PRODUCT_DESCRIPTIONS[key];
    return product.description || 'Thiết bị chăm sóc sức khỏe chất lượng cao từ TheraHome.';
  };

  return (
    <div className="w-full max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Header toolbar */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-slate-700 dark:text-slate-350 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-black text-slate-850 dark:text-white text-center">
          Đánh Giá Sản Phẩm
        </h1>
        <div className="w-10"></div>
      </div>

      {/* Info Hero Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 space-y-3 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <MessageSquare className="w-5 h-5" />
          <span className="text-xs font-extrabold uppercase tracking-wider">Chia sẻ cảm nhận thật</span>
        </div>
        <h2 className="text-lg font-black text-slate-850 dark:text-white">Ý kiến của bạn giúp chúng tôi cải thiện</h2>
        <p className="text-xs text-slate-505 dark:text-slate-400 leading-relaxed">
          Sau khi kích hoạt thiết bị, bạn có thể tự viết đánh giá riêng tư cho chính mình hoặc xem các phản hồi công khai từ cộng đồng người dùng TheraHome.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh]">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 mt-2">Đang tải dữ liệu đánh giá...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {products.map((product) => {
            const isActivated = canReviewProduct(product);
            const myReview = reviews.find(
              (item) => item.product_id === product.id && (item.is_mine || item.scope === 'private')
            );
            const publicReviews = reviews.filter(
              (item) => item.product_id === product.id && item.scope === 'public'
            );
            const draft = drafts[product.id] || { rating: 5, content: '' };

            return (
              <div
                key={product.id}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm space-y-6"
              >
                
                {/* Product Info Header */}
                <div className="flex flex-col md:flex-row gap-6 p-6 border-b border-slate-50 dark:border-slate-800/60">
                  <div className="w-full md:w-44 h-36 bg-slate-50 dark:bg-slate-950/30 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden border border-slate-50 dark:border-slate-800/40">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="max-h-28 max-w-[80%] object-contain"
                      />
                    ) : (
                      <span className="text-xs font-bold text-slate-400">{product.name}</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black tracking-wider uppercase bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 px-2 py-0.5 rounded-md">
                        {product.key === 'ech' ? 'Cổ Vai Gáy' : 'Thắt Lưng'}
                      </span>
                      {isActivated && (
                        <span className="text-[10px] font-black tracking-wider uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                          <Check className="w-3 h-3 stroke-[3]" />
                          Đã kích hoạt
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-extrabold text-slate-850 dark:text-white">{product.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {resolveProductDescription(product)}
                    </p>
                  </div>
                </div>

                {/* Review Action / Input Form Section */}
                <div className="px-6 pb-2">
                  {isActivated ? (
                    <div className="bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-500/10 rounded-2xl p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-800 dark:text-white">
                            {myReview ? 'Cập nhật đánh giá của bạn' : 'Cảm nhận của bạn'}
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Đánh giá này ở chế độ riêng tư và chỉ bạn mới nhìn thấy trong tài khoản của mình.
                          </p>
                        </div>
                        {myReview && (
                          <span className="text-[9px] text-slate-400">
                            Cập nhật: {formatDateTime(myReview.updated_at || myReview.created_at)}
                          </span>
                        )}
                      </div>

                      {/* Interactive Rating Stars */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">Đánh giá sao:</span>
                        {renderStars(5, true, product.id)}
                      </div>

                      {/* Text Input Content */}
                      <textarea
                        value={draft.content}
                        onChange={(e) => updateDraft(product.id, { content: e.target.value })}
                        placeholder="Hãy chia sẻ trải nghiệm sử dụng thiết bị này của bạn..."
                        className="w-full min-h-[80px] p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all resize-none"
                      />

                      {successMessage[product.id] && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          {successMessage[product.id]}
                        </p>
                      )}

                      <button
                        onClick={() => handleSaveMyReview(product)}
                        disabled={savingProductId === product.id}
                        className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 dark:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {savingProductId === product.id ? 'Đang lưu...' : myReview ? 'Cập nhật đánh giá' : 'Lưu đánh giá'}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-5 flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-200/50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Đánh giá riêng cho bạn</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {isSignedIn
                            ? `Vui lòng kích hoạt thiết bị ${product.name} để có thể viết và lưu đánh giá cảm nhận của riêng bạn.`
                            : 'Vui lòng đăng nhập và kích hoạt thiết bị để viết đánh giá riêng.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Public Testimonials / Community Reviews Section */}
                <div className="p-6 pt-2 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-50 dark:border-slate-800/40">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <h4 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">
                      Đánh giá từ cộng đồng ({publicReviews.length})
                    </h4>
                  </div>

                  {publicReviews.length === 0 ? (
                    <p className="text-[10px] text-slate-450 dark:text-slate-500 italic py-2">
                      Chưa có đánh giá công khai nào cho thiết bị này.
                    </p>
                  ) : (
                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                      {publicReviews.map((review) => (
                        <div
                          key={review.id}
                          className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/10 border border-slate-50 dark:border-slate-800/40 space-y-2.5"
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-105">
                                  {review.author_name}
                                </span>
                                {review.badge && (
                                  <span className="text-[8px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                                    {review.badge}
                                  </span>
                                )}
                              </div>
                              {renderStars(review.rating)}
                            </div>
                            <span className="text-[9px] text-slate-400">
                              {formatDateTime(review.created_at)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-650 dark:text-slate-400 leading-relaxed">
                            {review.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
