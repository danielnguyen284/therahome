'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../../stores/authStore';
import { api } from '../../../lib/api';
import { ArrowLeft, Star, Lock, MessageSquare, Check, Sparkles, AlertCircle, Filter, X } from 'lucide-react';

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
  product?: Product | null;
}

interface ReviewDraft {
  rating: number;
  content: string;
}

const PRODUCT_DESCRIPTIONS: Record<string, string> = {
  ech: 'Thiết bị hỗ trợ cải thiện vùng cổ vai gáy, phù hợp cho người ngồi nhiều và hay mỏi cổ.',
  rung: 'Thiết bị hỗ trợ thư giãn và giảm căng cứng vùng lưng, phù hợp cho nhu cầu phục hồi cơ sâu.',
};

function ProductAssessmentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProductId, setSavingProductId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ReviewDraft>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal State
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  // Filter States
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>('all');
  const [selectedStarsFilter, setSelectedStarsFilter] = useState<string>('all');

  // Review Form state
  const [selectedProductForReview, setSelectedProductForReview] = useState<string>('');

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

  const activatedProducts = useMemo(() => {
    return products.filter((p) => canReviewProduct(p));
  }, [products, ownedKeys]);

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
        try {
          reviewData = await api.get<ProductReview[]>('/product-reviews');
        } catch (error) {
          console.warn('Unable to load public product reviews:', error);
        }
      }

      setReviews(reviewData || []);

      // Build drafts
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

  // Set default product for review form
  useEffect(() => {
    const productIdParam = searchParams.get('product_id');
    if (productIdParam && products.length > 0) {
      const matchingProduct = products.find(
        (p) => p.id === productIdParam || p.key?.toLowerCase() === productIdParam.toLowerCase()
      );
      if (matchingProduct) {
        setSelectedProductForReview(matchingProduct.id);
        setSelectedProductFilter(matchingProduct.id);
        return;
      }
    }

    if (activatedProducts.length > 0 && !selectedProductForReview) {
      setSelectedProductForReview(activatedProducts[0].id);
    } else if (products.length > 0 && !selectedProductForReview) {
      setSelectedProductForReview(products[0].id);
    }
  }, [activatedProducts, products, selectedProductForReview, searchParams]);

  // Open modal if write=true param exists
  useEffect(() => {
    if (searchParams.get('write') === 'true') {
      setIsWriteModalOpen(true);
    }
  }, [searchParams]);

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

  const handleSaveMyReview = async (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (!isSignedIn) {
      alert('Vui lòng đăng nhập để thực hiện đánh giá.');
      return;
    }

    if (!canReviewProduct(product)) {
      alert('Bạn chỉ có thể đánh giá sản phẩm đã được kích hoạt.');
      return;
    }

    const draft = drafts[productId] || { rating: 5, content: '' };

    if (!draft.content.trim()) {
      alert('Vui lòng nhập nội dung đánh giá của bạn.');
      return;
    }

    try {
      setSavingProductId(productId);
      setSuccessMessage(null);

      await api.post('/product-reviews/my', {
        product_id: productId,
        rating: draft.rating,
        content: draft.content.trim(),
      });

      setSuccessMessage('Đã lưu đánh giá thành công!');
      
      // Reload reviews to reflect updates
      const reviewData = await api.get<ProductReview[]>('/product-reviews/my-feed');
      setReviews(reviewData || []);
      
      // Close modal after brief success presentation
      setTimeout(() => {
        setIsWriteModalOpen(false);
        setSuccessMessage(null);
      }, 1200);
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
            className="focus:outline-none transition-transform active:scale-90 cursor-pointer"
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
            className={`w-3 h-3 ${
              active ? 'text-amber-500 fill-amber-500' : 'text-slate-200 dark:text-slate-700'
            }`}
          />
        );
      }
    }

    return <div className="flex items-center gap-0.5">{stars}</div>;
  };

  const formatDateTime = (value: string) => {
    return new Date(value).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Shopee-style logic: Filter and aggregate reviews
  const visibleReviews = useMemo(() => {
    return reviews.filter(
      (item) => item.scope === 'public' || (item.scope === 'private' && item.is_mine)
    );
  }, [reviews]);

  // Aggregate stats based on product selection
  const filteredReviewsByProduct = useMemo(() => {
    if (selectedProductFilter === 'all') return visibleReviews;
    return visibleReviews.filter((r) => r.product_id === selectedProductFilter);
  }, [visibleReviews, selectedProductFilter]);

  const finalFilteredReviews = useMemo(() => {
    let result = filteredReviewsByProduct;
    if (selectedStarsFilter !== 'all') {
      const starNum = parseInt(selectedStarsFilter, 10);
      result = result.filter((r) => r.rating === starNum);
    }
    return result;
  }, [filteredReviewsByProduct, selectedStarsFilter]);

  const averageRating = useMemo(() => {
    if (filteredReviewsByProduct.length === 0) return '5.0';
    const sum = filteredReviewsByProduct.reduce((acc, r) => acc + r.rating, 0);
    return (sum / filteredReviewsByProduct.length).toFixed(1);
  }, [filteredReviewsByProduct]);

  const starCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    filteredReviewsByProduct.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) {
        counts[r.rating as 1|2|3|4|5] += 1;
      }
    });
    return counts;
  }, [filteredReviewsByProduct]);

  // Form selected product review states
  const activeProductForReview = useMemo(() => {
    return products.find((p) => p.id === selectedProductForReview);
  }, [products, selectedProductForReview]);

  const isActivatedForReview = useMemo(() => {
    return activeProductForReview ? canReviewProduct(activeProductForReview) : false;
  }, [activeProductForReview, ownedKeys]);

  const myReviewForFormProduct = useMemo(() => {
    return reviews.find(
      (item) => item.product_id === selectedProductForReview && (item.is_mine || item.scope === 'private')
    );
  }, [reviews, selectedProductForReview]);

  const formDraft = useMemo(() => {
    return drafts[selectedProductForReview] || { rating: 5, content: '' };
  }, [drafts, selectedProductForReview]);

  return (
    <div className="w-full max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto space-y-4 pb-[calc(8rem+env(safe-area-inset-bottom))] md:pb-24 relative">
      
      {/* Header toolbar */}
      <div className="flex justify-between items-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-10 py-3 px-1 border-b border-slate-50 dark:border-slate-900/60">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-slate-700 dark:text-slate-400 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xs font-black text-slate-800 dark:text-white text-center">
          Đánh Giá Sản Phẩm
        </h1>
        <div className="w-9"></div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[0.625rem] text-slate-500 mt-2">Đang tải dữ liệu đánh giá...</p>
        </div>
      ) : (
        <div className="space-y-4 px-1">
          
          {/* COMPACT RATING AND FILTER SECTION */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
            
            {/* Horizontal Mini Summary */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-50 dark:border-slate-800/40">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-amber-500">{averageRating}</span>
                <span className="text-[0.6875rem] text-slate-400 dark:text-slate-500 font-bold">/5</span>
                <div className="flex ml-1">
                  {renderStars(Math.round(parseFloat(averageRating)))}
                </div>
              </div>
              <span className="text-[0.625rem] text-slate-400 dark:text-slate-500 font-bold">
                {filteredReviewsByProduct.length} đánh giá
              </span>
            </div>

            {/* Product selection chips (Scrollable row) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none whitespace-nowrap">
              <button
                onClick={() => {
                  setSelectedProductFilter('all');
                  setSelectedStarsFilter('all');
                }}
                className={`px-3 py-1.5 rounded-xl text-[0.625rem] font-extrabold transition-all cursor-pointer ${
                  selectedProductFilter === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-100 dark:border-slate-800'
                }`}
              >
                Tất cả sản phẩm
              </button>
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedProductFilter(p.id);
                    setSelectedStarsFilter('all');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[0.625rem] font-extrabold transition-all cursor-pointer ${
                    selectedProductFilter === p.id
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-100 dark:border-slate-800'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {/* Star Filters (Scrollable row) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none whitespace-nowrap">
              <button
                onClick={() => setSelectedStarsFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-[0.625rem] font-extrabold transition-all cursor-pointer ${
                  selectedStarsFilter === 'all'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-100 dark:border-slate-800'
                }`}
              >
                Tất cả
              </button>
              {[5, 4, 3, 2, 1].map((star) => (
                <button
                  key={star}
                  onClick={() => setSelectedStarsFilter(String(star))}
                  className={`px-3 py-1.5 rounded-xl text-[0.625rem] font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                    selectedStarsFilter === String(star)
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-100 dark:border-slate-800'
                  }`}
                >
                  {star}★ ({starCounts[star as 1|2|3|4|5]})
                </button>
              ))}
            </div>

          </div>

          {/* Unified Reviews List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-4">
            <h4 className="text-[0.6875rem] font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">
              Ý kiến từ khách hàng ({finalFilteredReviews.length})
            </h4>

            {finalFilteredReviews.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <MessageSquare className="w-6 h-6 text-slate-350 mx-auto opacity-50" />
                <p className="text-[0.625rem] text-slate-400 dark:text-slate-500 italic">
                  Chưa có đánh giá nào phù hợp với bộ lọc.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {finalFilteredReviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-3.5 rounded-xl bg-slate-50/30 dark:bg-slate-950/10 border border-slate-100 dark:border-slate-800/40"
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Letter Avatar */}
                      <div className="w-8 h-8 rounded-full bg-indigo-500/10 dark:bg-indigo-400/10 border border-indigo-500/20 dark:border-indigo-400/20 flex items-center justify-center text-[0.6875rem] font-black text-indigo-600 dark:text-indigo-400 shrink-0">
                        {(review.author_name || 'A').charAt(0).toUpperCase()}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[0.6875rem] font-bold text-slate-800 dark:text-slate-100">
                                {review.author_name}
                              </span>
                              {review.badge && (
                                <span className="text-[0.4375rem] font-black tracking-wider uppercase px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                                  {review.badge}
                                </span>
                              )}
                            </div>
                            {renderStars(review.rating)}
                          </div>
                          <span className="text-[0.5625rem] text-slate-400 whitespace-nowrap shrink-0">
                            {formatDateTime(review.created_at)}
                          </span>
                        </div>

                        {/* Reviewed Product classification tag */}
                        {review.product && (
                          <span className="inline-block text-[0.5rem] font-bold text-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 px-2 py-0.5 rounded mt-1.5">
                            Sản phẩm: {review.product.name}
                          </span>
                        )}

                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-2">
                          {review.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Floating Write Review Action Button at the bottom */}
      {isSignedIn && !loading && (
        <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white/95 to-white/0 dark:from-slate-950 dark:via-slate-950/95 dark:to-slate-950/0 flex justify-center max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto z-30">
          <button
            onClick={() => setIsWriteModalOpen(true)}
            className="w-full py-3 bg-indigo-650 hover:bg-indigo-750 text-white text-xs font-bold rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4 fill-white/20" />
            Viết Đánh Giá Của Bạn
          </button>
        </div>
      )}

      {/* Write Review Modal / Overlay bottom-sheet dialog */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fade-in">
          <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-slide-up">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800/40 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-black text-slate-800 dark:text-white">Viết Đánh Giá Của Bạn</h3>
              </div>
              <button
                onClick={() => setIsWriteModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer animate-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Product selection selector */}
            <div className="space-y-2">
              <label className="text-[0.625rem] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Chọn thiết bị để đánh giá:
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {products.map((p) => {
                  const isSelected = selectedProductForReview === p.id;
                  const isOwned = canReviewProduct(p);
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProductForReview(p.id)}
                      disabled={!isOwned}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all relative ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 cursor-default'
                          : !isOwned
                          ? 'border-slate-100 dark:border-slate-800 bg-slate-50/10 dark:bg-slate-900/10 opacity-40 cursor-not-allowed'
                          : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/30 dark:bg-slate-900/40 cursor-pointer'
                      }`}
                    >
                      <span className="text-[0.6875rem] font-bold text-slate-800 dark:text-white leading-tight">{p.name}</span>
                      <span className={`text-[0.5rem] mt-1.5 font-bold ${
                        isOwned
                          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1 py-0.5 rounded w-fit'
                          : 'text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded w-fit'
                      }`}>
                        {isOwned ? 'Đã kích hoạt' : 'Chưa kích hoạt'}
                      </span>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                          <Check className="w-2 h-2 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input Form based on activation status */}
            {activeProductForReview && (
              <div className="pt-1">
                {isActivatedForReview ? (
                  <div className="bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-500/10 rounded-xl p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                          {activeProductForReview.name}
                        </span>
                        <p className="text-[0.5625rem] text-slate-400 mt-0.5 leading-tight">
                          Đánh giá này ở chế độ riêng tư và chỉ bạn mới nhìn thấy trong tài khoản.
                        </p>
                      </div>
                      {myReviewForFormProduct && (
                        <span className="text-[0.5625rem] text-slate-400 whitespace-nowrap">
                          {formatDateTime(myReviewForFormProduct.updated_at || myReviewForFormProduct.created_at)}
                        </span>
                      )}
                    </div>

                    {/* Interactive Rating Stars */}
                    <div className="flex items-center gap-3">
                      <span className="text-[0.6875rem] text-slate-500">Đánh giá sao:</span>
                      {renderStars(5, true, selectedProductForReview)}
                    </div>

                    {/* Text Input Content */}
                    <textarea
                      value={formDraft.content}
                      onChange={(e) => updateDraft(selectedProductForReview, { content: e.target.value })}
                      placeholder={`Hãy chia sẻ trải nghiệm sử dụng thiết bị ${activeProductForReview.name} của bạn...`}
                      className="w-full min-h-[100px] p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all resize-none"
                    />

                    {successMessage && (
                      <p className="text-[0.625rem] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        {successMessage}
                      </p>
                    )}

                    <button
                      onClick={() => handleSaveMyReview(selectedProductForReview)}
                      disabled={savingProductId === selectedProductForReview}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 dark:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {savingProductId === selectedProductForReview ? 'Đang lưu...' : myReviewForFormProduct ? 'Cập nhật đánh giá' : 'Lưu đánh giá'}
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/60 rounded-xl p-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-200/50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Tính năng đang khóa</h4>
                      <p className="text-[0.625rem] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Vui lòng kích hoạt thiết bị <b>{activeProductForReview.name}</b> để có thể viết và lưu đánh giá cảm nhận của riêng bạn.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default function ProductAssessmentsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm animate-pulse">Đang tải đánh giá...</p>
      </div>
    }>
      <ProductAssessmentsContent />
    </Suspense>
  );
}
