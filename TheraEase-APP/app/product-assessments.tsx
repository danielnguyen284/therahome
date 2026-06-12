import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Lock, MessageSquareText, Star } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { getOwnedDeviceIds } from '@/utils/ownedDevices';

const PRODUCT_IMAGES: Record<string, ImageSourcePropType> = {
  'theraneck.png': require('../assets/theraneck.png'),
  'theraback.png': require('../assets/theraback.png'),
  ech: require('../assets/theraneck.png'),
  rung: require('../assets/theraback.png'),
};

const PRODUCT_DESCRIPTIONS: Record<string, string> = {
  ech: 'Thiết bị hỗ trợ cải thiện vùng cổ vai gáy, phù hợp cho người ngồi nhiều và hay mỏi cổ.',
  rung: 'Thiết bị hỗ trợ thư giãn và giảm căng cứng vùng lưng, phù hợp cho nhu cầu phục hồi cơ sâu.',
};

type TherapyProduct = {
  id: string;
  key: string;
  name: string;
  image_url?: string;
  purchase_link?: string;
  is_active?: boolean;
};

type ProductReview = {
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
  product?: TherapyProduct | null;
};

type ReviewDraft = {
  rating: number;
  content: string;
};

const REVIEWABLE_KEYS = new Set(['ech', 'rung']);

function getReviewableProducts(products: TherapyProduct[]) {
  const filtered = products.filter((item) => REVIEWABLE_KEYS.has(item.key.toLowerCase()));
  return filtered.length > 0 ? filtered : products;
}

function buildDrafts(products: TherapyProduct[], reviews: ProductReview[]) {
  const result: Record<string, ReviewDraft> = {};

  getReviewableProducts(products).forEach((product) => {
    const personalReview = reviews.find(
      (item) => item.product_id === product.id && (item.is_mine || item.scope === 'private'),
    );

    result[product.id] = {
      rating: personalReview?.rating ?? 5,
      content: personalReview?.content ?? '',
    };
  });

  return result;
}

export default function ProductAssessmentsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const user = useAuthStore((state) => state.user);
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const [products, setProducts] = useState<TherapyProduct[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [drafts, setDrafts] = useState<Record<string, ReviewDraft>>({});
  const [loading, setLoading] = useState(true);
  const [savingProductId, setSavingProductId] = useState<string | null>(null);

  const isSignedIn = !!user && user.id !== 'guest';
  const ownedDeviceIds = useMemo(() => getOwnedDeviceIds(user?.owned_devices || []), [user?.owned_devices]);

  useEffect(() => {
    void loadData();
  }, [user?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const productData = await api.get<TherapyProduct[]>('/products');

      let reviewData: ProductReview[] = [];
      if (isSignedIn) {
        try {
          reviewData = await api.get<ProductReview[]>('/product-reviews/my-feed');
        } catch (error) {
          console.warn('Unable to load personal product reviews:', error);
        }
      }

      setProducts(productData || []);
      const privateReviews = (reviewData || []).filter((item) => item.is_mine || item.scope === 'private');
      setReviews(privateReviews);
      setDrafts(buildDrafts(productData || [], privateReviews));
    } catch (error) {
      console.error('Load product reviews error:', error);
      Alert.alert('Lỗi', 'Không thể tải đánh giá sản phẩm lúc này.');
    } finally {
      setLoading(false);
    }
  };

  const reviewableProducts = useMemo(() => getReviewableProducts(products), [products]);

  const canReviewProduct = (product: TherapyProduct) => {
    const normalizedKey = product.key?.trim().toLowerCase();
    if (normalizedKey === 'ech') return ownedDeviceIds.includes('neck_device');
    if (normalizedKey === 'rung') return ownedDeviceIds.includes('back_device');
    return false;
  };

  const sections = useMemo(() => {
    return reviewableProducts.map((product) => {
      const productReviews = reviews
        .filter((item) => item.product_id === product.id)
        .sort((a, b) => {
          return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
        });

      const personalReview =
        productReviews.find((item) => item.is_mine || item.scope === 'private') || null;

      return {
        product,
        personalReview,
        canWriteReview: isSignedIn && canReviewProduct(product),
      };
    });
  }, [isSignedIn, reviewableProducts, reviews, ownedDeviceIds]);

  const resolveImageSource = (product: TherapyProduct) => {
    const imageUrl = product.image_url?.trim();
    if (imageUrl) {
      return { uri: imageUrl };
    }

    const normalizedKey = product.key?.trim().toLowerCase();
    if (normalizedKey && PRODUCT_IMAGES[normalizedKey]) {
      return PRODUCT_IMAGES[normalizedKey];
    }

    return null;
  };

  const resolveProductDescription = (product: TherapyProduct) => {
    if (product.key && PRODUCT_DESCRIPTIONS[product.key]) {
      return PRODUCT_DESCRIPTIONS[product.key];
    }

    return 'Không gian riêng để bạn lưu lại cảm nhận sau khi sử dụng sản phẩm.';
  };

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

  const handleSaveMyReview = async (product: TherapyProduct) => {
    if (!isSignedIn) {
      Alert.alert('Cần đăng nhập', 'Hãy đăng nhập và kích hoạt thiết bị để viết đánh giá của riêng bạn.');
      return;
    }

    if (!canReviewProduct(product)) {
      Alert.alert('Chưa đủ điều kiện', 'Bạn chỉ có thể đánh giá sản phẩm đã kích hoạt.');
      return;
    }

    const draft = drafts[product.id] || { rating: 5, content: '' };

    if (!draft.content.trim()) {
      Alert.alert('Thiếu nội dung', 'Vui lòng nhập cảm nhận của bạn về sản phẩm.');
      return;
    }

    if (!Number.isFinite(draft.rating) || draft.rating < 1 || draft.rating > 5) {
      Alert.alert('Số sao không hợp lệ', 'Vui lòng chọn số sao từ 1 đến 5.');
      return;
    }

    try {
      setSavingProductId(product.id);
      await api.post('/product-reviews/my', {
        product_id: product.id,
        rating: draft.rating,
        content: draft.content.trim(),
      });

      Alert.alert('Thành công', 'Đã lưu đánh giá riêng của bạn.');
      await loadData();
    } catch (error: any) {
      console.error('Save my product review error:', error);
      Alert.alert('Lỗi', error?.message || 'Không thể lưu đánh giá của bạn lúc này.');
    } finally {
      setSavingProductId(null);
    }
  };

  const renderStars = (rating: number, size = 16) => {
    return (
      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((star) => {
          const active = star <= Math.round(rating);
          return (
            <Star
              key={`${rating}-${star}`}
              size={size}
              color={active ? '#F59E0B' : colors.border}
              fill={active ? '#F59E0B' : 'transparent'}
            />
          );
        })}
      </View>
    );
  };

  const renderEditableStars = (productId: string) => {
    const rating = drafts[productId]?.rating ?? 5;

    return (
      <View style={styles.editableStarsRow}>
        {[1, 2, 3, 4, 5].map((star) => {
          const active = star <= rating;
          return (
            <TouchableOpacity
              key={`${productId}-${star}`}
              onPress={() => updateDraft(productId, { rating: star })}
              activeOpacity={0.8}
              style={styles.starButton}
            >
              <Star
                size={24}
                color={active ? '#F59E0B' : colors.border}
                fill={active ? '#F59E0B' : 'transparent'}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const formatDateTime = (value: string) => {
    return new Date(value).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.8}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đánh giá sản phẩm</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <MessageSquareText size={16} color={colors.primary} />
            <Text style={styles.heroBadgeText}>Riêng tư cho bạn</Text>
          </View>
          <Text style={styles.heroTitle}>Lưu lại cảm nhận thật của bạn về từng thiết bị</Text>
          <Text style={styles.heroDescription}>
            Khi đã kích hoạt sản phẩm, bạn có thể tự viết đánh giá và chỉ chính bạn mới nhìn thấy phần
            này trong ứng dụng của mình.
          </Text>
        </View>

        {loading ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.stateText}>Đang tải đánh giá sản phẩm...</Text>
          </View>
        ) : (
          sections.map(({ product, personalReview, canWriteReview }) => {
            const imageSource = resolveImageSource(product);
            const draft = drafts[product.id] || { rating: 5, content: '' };

            return (
              <View key={product.id} style={styles.card}>
                <View style={styles.imageWrap}>
                  {imageSource ? (
                    <Image source={imageSource} style={styles.productImage} resizeMode="contain" />
                  ) : (
                    <View style={styles.imageFallback}>
                      <Text style={styles.imageFallbackText}>{product.name}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.categoryText}>{product.key}</Text>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productDescription}>{resolveProductDescription(product)}</Text>

                  {canWriteReview ? (
                    <View style={styles.privateReviewCard}>
                      <Text style={styles.privateReviewTitle}>
                        {personalReview?.author_name?.trim() || 'Đánh giá của bạn'}
                      </Text>
                      <Text style={styles.privateReviewHint}>Chỉ bạn mới xem được đánh giá này.</Text>
                      {personalReview ? (
                        <Text style={styles.privateReviewMeta}>
                          Cập nhật lần cuối: {formatDateTime(personalReview.updated_at || personalReview.created_at)}
                        </Text>
                      ) : null}

                      {renderEditableStars(product.id)}

                      <TextInput
                        mode="outlined"
                        multiline
                        value={draft.content}
                        onChangeText={(text) => updateDraft(product.id, { content: text })}
                        placeholder="Chia sẻ cảm nhận thật của bạn sau khi sử dụng..."
                        style={styles.privateReviewInput}
                        contentStyle={styles.privateReviewInputContent}
                        outlineColor={colors.border}
                        activeOutlineColor={colors.primary}
                        textColor={colors.text}
                      />

                      <Button
                        mode="contained"
                        onPress={() => handleSaveMyReview(product)}
                        loading={savingProductId === product.id}
                        disabled={savingProductId === product.id}
                        buttonColor={colors.primary}
                        style={styles.privateReviewButton}
                        contentStyle={styles.privateReviewButtonContent}
                        labelStyle={styles.privateReviewButtonLabel}
                      >
                        {personalReview ? 'Cập nhật đánh giá của bạn' : 'Lưu đánh giá của bạn'}
                      </Button>
                    </View>
                  ) : (
                    <View style={styles.privateReviewLockedCard}>
                      <View style={styles.privateReviewLockedIcon}>
                        <Lock size={18} color={colors.primary} />
                      </View>
                      <Text style={styles.privateReviewLockedTitle}>Đánh giá riêng cho bạn</Text>
                      <Text style={styles.privateReviewLockedText}>
                        {isSignedIn
                          ? `Hãy kích hoạt ${product.name} để viết đánh giá riêng của bạn.`
                          : 'Đăng nhập và kích hoạt sản phẩm để tự viết đánh giá riêng của bạn.'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    headerSpacer: {
      width: 40,
      height: 40,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 40,
      gap: 20,
    },
    heroCard: {
      backgroundColor: colors.surface,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 22,
      paddingVertical: 22,
      gap: 12,
      shadowColor: isDark ? '#000000' : '#0F172A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.16 : 0.06,
      shadowRadius: 18,
      elevation: 3,
    },
    heroBadge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: `${colors.primary}14`,
      borderWidth: 1,
      borderColor: `${colors.primary}24`,
    },
    heroBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    heroTitle: {
      fontSize: 26,
      lineHeight: 32,
      fontWeight: '800',
      color: colors.text,
    },
    heroDescription: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.textSecondary,
    },
    stateWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      gap: 10,
    },
    stateText: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    imageWrap: {
      height: 220,
      backgroundColor: isDark ? '#111827' : '#F8FAFC',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    productImage: {
      width: '100%',
      height: '100%',
    },
    imageFallback: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    imageFallbackText: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    cardBody: {
      paddingHorizontal: 20,
      paddingVertical: 18,
      gap: 12,
    },
    categoryText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    productName: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.text,
    },
    productDescription: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.textSecondary,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    editableStarsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    starButton: {
      padding: 2,
    },
    privateReviewCard: {
      borderRadius: 22,
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: `${colors.primary}08`,
      borderWidth: 1,
      borderColor: `${colors.primary}22`,
      gap: 12,
    },
    privateReviewTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
    },
    privateReviewHint: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: '600',
    },
    privateReviewMeta: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    privateReviewInput: {
      backgroundColor: colors.surface,
    },
    privateReviewInputContent: {
      minHeight: 100,
      color: colors.text,
    },
    privateReviewButton: {
      borderRadius: 16,
    },
    privateReviewButtonContent: {
      height: 50,
    },
    privateReviewButtonLabel: {
      fontSize: 15,
      fontWeight: '700',
    },
    privateReviewLockedCard: {
      borderRadius: 22,
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 10,
    },
    privateReviewLockedIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${colors.primary}14`,
    },
    privateReviewLockedTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    privateReviewLockedText: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.textSecondary,
    },
  });
