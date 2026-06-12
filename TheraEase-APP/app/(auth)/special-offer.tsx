import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Dimensions, ImageBackground, TouchableOpacity, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import Animated, {
  Easing,
  FadeOut,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ArrowLeft } from 'lucide-react-native';

import { api } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { persistOnboardingProfile } from '@/services/onboardingProfile';

const { width } = Dimensions.get('window');

interface Product {
  id: string;
  key: string;
  name: string;
  purchase_link: string;
}

const GIFT_CONFETTI = [
  { left: 34, top: 12, width: 6, height: 10, color: '#22C55E' },
  { left: 64, top: 2, width: 8, height: 8, color: '#FACC15' },
  { left: 98, top: 16, width: 6, height: 12, color: '#38BDF8' },
  { left: 132, top: 6, width: 9, height: 9, color: '#EC4899' },
  { left: 166, top: 18, width: 6, height: 10, color: '#EF4444' },
  { left: 52, top: 52, width: 8, height: 8, color: '#A855F7' },
  { left: 114, top: 48, width: 6, height: 12, color: '#22C55E' },
  { left: 186, top: 54, width: 8, height: 8, color: '#FACC15' },
];

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const matchesOfferProduct = (product: Product, requestedKey: string) => {
  const key = normalizeText(product.key);
  const name = normalizeText(product.name);

  if (requestedKey === 'rung' || requestedKey.includes('back') || requestedKey.includes('lung')) {
    return (
      key === 'rung' ||
      key.includes('back') ||
      name.includes('theraback') ||
      name.includes('back') ||
      name.includes('lung')
    );
  }

  return (
    key === 'ech' ||
    key.includes('neck') ||
    name.includes('theraneck') ||
    name.includes('neck') ||
    name.includes('co vai')
  );
};

export default function SpecialOfferScreen() {
  const router = useRouter();
  const { productKey } = useLocalSearchParams<{ productKey?: string | string[] }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProductLink, setLoadingProductLink] = useState(true);
  const [showOffer, setShowOffer] = useState(false);
  const giftScale = useSharedValue(0.9);
  const lidProgress = useSharedValue(0);
  const burstProgress = useSharedValue(0);
  const offerScale = useSharedValue(0.96);

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        const data = await api.get<Product[]>('/products');
        if (isMounted) {
          setProducts(data || []);
        }
      } catch (error) {
        console.warn('Load offer products error:', error);
      } finally {
        if (isMounted) {
          setLoadingProductLink(false);
        }
      }
    };

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    giftScale.value = withSequence(
      withSpring(1.06, { damping: 8, stiffness: 160 }),
      withTiming(0.96, { duration: 160 }),
      withSpring(1, { damping: 8, stiffness: 140 })
    );
    lidProgress.value = withDelay(650, withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }));
    burstProgress.value = withDelay(700, withTiming(1, { duration: 760, easing: Easing.out(Easing.cubic) }));

    const revealTimer = setTimeout(() => {
      offerScale.value = withSpring(1, { damping: 11, stiffness: 120 });
      setShowOffer(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1650);

    return () => clearTimeout(revealTimer);
  }, [burstProgress, giftScale, lidProgress, offerScale]);

  const giftWrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: giftScale.value }],
  }));

  const giftLidStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -26 * lidProgress.value },
      { translateY: -58 * lidProgress.value },
      { rotate: `${-28 * lidProgress.value}deg` },
    ],
  }));

  const giftGlowStyle = useAnimatedStyle(() => ({
    opacity: burstProgress.value,
    transform: [{ scale: 0.75 + burstProgress.value * 0.45 }],
  }));

  const confettiStyle = useAnimatedStyle(() => ({
    opacity: burstProgress.value,
    transform: [
      { translateY: -78 * burstProgress.value },
      { scale: 0.7 + burstProgress.value * 0.35 },
    ],
  }));

  const offerRevealStyle = useAnimatedStyle(() => ({
    transform: [{ scale: offerScale.value }],
  }));

  const requestedProductKey = useMemo(() => {
    const rawKey = Array.isArray(productKey) ? productKey[0] : productKey;
    return normalizeText(rawKey || 'ech');
  }, [productKey]);

  const offerProduct = useMemo(() => {
    return products.find((product) => matchesOfferProduct(product, requestedProductKey)) ?? null;
  }, [products, requestedProductKey]);

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (loadingProductLink) {
      return;
    }

    const purchaseLink = offerProduct?.purchase_link?.trim();

    if (!purchaseLink) {
      Alert.alert('Chưa có link ưu đãi', 'Sản phẩm này chưa được cấu hình link mua trong admin.');
      return;
    }

    if (user && user.id !== 'guest') {
      try {
        await persistOnboardingProfile();
      } catch (error) {
        console.error('Persist onboarding profile error:', error);
      }
    }

    try {
      await WebBrowser.openBrowserAsync(purchaseLink);
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Open purchase link error:', error);
      Alert.alert('Không mở được link', 'Vui lòng kiểm tra lại link sản phẩm trong admin.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Background (blurred homepage or generic) */}
      <ImageBackground 
        source={require('../../assets/best-version-bg.png')} 
        style={styles.backgroundImage}
        blurRadius={10}
      >
        <SafeAreaView style={styles.overlay}>
           <TouchableOpacity
             onPress={() => router.back()}
             style={[styles.backButtonTop, { top: insets.top + 8 }]}
             activeOpacity={0.8}
           >
             <ArrowLeft size={24} color="#1E293B" />
           </TouchableOpacity>
           {showOffer ? (
           <Animated.View entering={ZoomIn.duration(650).springify()} style={[styles.offerCard, offerRevealStyle]}>
              
              <View style={styles.tagContainer}>
                 <View style={styles.tagOuter}>
                    <View style={styles.tagInner}>
                       <Text style={styles.tagNumber}>41</Text>
                       <View style={styles.tagPercentWrapper}>
                          <Text style={styles.tagPercent}>%</Text>
                          <Text style={styles.tagOff}>OFF</Text>
                       </View>
                    </View>
                 </View>
              </View>

              <View style={styles.textContainer}>
                 <Text style={styles.specialTitle}>ưu đãi đặc biệt</Text>
              </View>

              <View style={styles.priceContainer}>
                 <View style={styles.priceRow}>
                    <Text style={styles.currentPrice}>990.000đ</Text>
                    <View style={styles.oldPriceContainer}>
                       <Text style={styles.oldPrice}>1.690.000đ</Text>
                    </View>
                 </View>
                 <Text style={styles.noteText}>Dành cho người mới</Text>
              </View>

              <TouchableOpacity 
                onPress={handleNext}
                disabled={loadingProductLink}
                style={[styles.nextButton, loadingProductLink && styles.nextButtonDisabled]}
                activeOpacity={0.9}
              >
                 <Text style={styles.nextText}>{loadingProductLink ? 'ĐANG TẢI...' : 'TIẾP TỤC'}</Text>
              </TouchableOpacity>

              <View style={styles.links}>
                 <Text style={styles.linkText}>Terms of use | Privacy Policy</Text>
              </View>

           </Animated.View>
           ) : (
             <Animated.View exiting={FadeOut.duration(220)} style={styles.giftStage}>
               <Animated.View style={[styles.giftGlow, giftGlowStyle]} />
               <View style={styles.confettiLayer}>
                 {GIFT_CONFETTI.map((piece, index) => (
                   <Animated.View
                     key={`${piece.left}-${piece.top}-${index}`}
                     style={[
                       styles.confettiPiece,
                       {
                         left: piece.left,
                         top: piece.top,
                         width: piece.width,
                         height: piece.height,
                         backgroundColor: piece.color,
                       },
                       confettiStyle,
                     ]}
                   />
                 ))}
               </View>
               <Animated.View style={[styles.giftWrap, giftWrapStyle]}>
                 <Animated.View style={[styles.giftLid, giftLidStyle]}>
                   <View style={styles.giftLidRibbonHorizontal} />
                   <View style={styles.giftLidRibbonVertical} />
                 </Animated.View>
                 <View style={styles.giftBox}>
                   <View style={styles.giftRibbonVertical} />
                   <View style={styles.giftRibbonHorizontal} />
                 </View>
                 <View style={styles.giftShadow} />
               </Animated.View>
               <Text style={styles.giftText}>Ưu đãi đặc biệt</Text>
             </Animated.View>
           )}
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backButtonTop: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  giftStage: {
    width: 260,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.36)',
  },
  confettiLayer: {
    position: 'absolute',
    top: 12,
    left: 10,
    width: 240,
    height: 120,
  },
  confettiPiece: {
    position: 'absolute',
    borderRadius: 2,
  },
  giftWrap: {
    width: 180,
    height: 168,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  giftLid: {
    position: 'absolute',
    top: 24,
    width: 172,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    borderWidth: 3,
    borderColor: '#FCA5A5',
    zIndex: 2,
    overflow: 'hidden',
  },
  giftLidRibbonHorizontal: {
    position: 'absolute',
    top: 21,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: '#FFFFFF',
  },
  giftLidRibbonVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 74,
    width: 20,
    backgroundColor: '#FFFFFF',
  },
  giftBox: {
    width: 156,
    height: 112,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    borderWidth: 3,
    borderColor: '#FCA5A5',
    overflow: 'hidden',
  },
  giftRibbonVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 66,
    width: 24,
    backgroundColor: '#FFFFFF',
  },
  giftRibbonHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 42,
    height: 18,
    backgroundColor: '#FFFFFF',
  },
  giftShadow: {
    width: 132,
    height: 14,
    marginTop: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(15,23,42,0.18)',
  },
  giftText: {
    marginTop: 18,
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  offerCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderRadius: 30,
    alignItems: 'center',
    paddingTop: 80, // Space for tag
    paddingBottom: 30,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  tagContainer: {
    position: 'absolute',
    top: -60,
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagOuter: {
    width: 140,
    height: 140,
    backgroundColor: '#EF4444',
    borderRadius: 20,
    transform: [{ rotate: '45deg' }],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  tagInner: {
    transform: [{ rotate: '-45deg' }],
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagNumber: {
    fontSize: 54,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tagPercentWrapper: {
    marginLeft: 2,
    alignItems: 'center',
  },
  tagPercent: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 28,
  },
  tagOff: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: -5,
  },
  textContainer: {
    backgroundColor: '#FAF5F5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#EF4444',
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  specialTitle: {
    fontSize: 26,
    color: '#EF4444',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  currentPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
  },
  oldPriceContainer: {
    borderWidth: 1,
    borderColor: '#A855F7',
    paddingHorizontal: 5,
    borderRadius: 4,
  },
  oldPrice: {
    fontSize: 18,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  noteText: {
    fontSize: 16,
    color: '#4B5563',
    fontStyle: 'italic',
    marginTop: 5,
  },
  nextButton: {
    backgroundColor: '#EF4444',
    width: width * 0.75,
    paddingVertical: 18,
    borderRadius: 40,
    alignItems: 'center',
    elevation: 5,
  },
  nextButtonDisabled: {
    opacity: 0.75,
  },
  nextText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  links: {
    marginTop: 20,
  },
  linkText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
