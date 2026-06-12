import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Zap, CheckCircle2 } from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { usePainStore } from '@/stores/painStore';
import { colors } from '@/utils/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const DEVICE_LEVELS = [
  { level: 1, name: 'Mức 1', description: 'Rất nhẹ nhàng', intensity: 'Thư giãn', color: '#10B981' },
  { level: 2, name: 'Mức 2', description: 'Nhẹ', intensity: 'Dễ chịu', color: '#34D399' },
  { level: 3, name: 'Mức 3', description: 'Trung bình nhẹ', intensity: 'Thoải mái', color: '#FCD34D' },
  { level: 4, name: 'Mức 4', description: 'Trung bình', intensity: 'Vừa phải', color: '#FBBF24' },
  { level: 5, name: 'Mức 5', description: 'Mạnh', intensity: 'Cảm giác rõ', color: '#F59E0B' },
  { level: 6, name: 'Mức 6', description: 'Rất mạnh', intensity: 'Chuyên sâu', color: '#EF4444' },
];

export default function DeviceRecommendationScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { todayPainLog } = usePainStore();
  const [loading, setLoading] = useState(true);
  const [recommendedLevel, setRecommendedLevel] = useState(3);
  const [selectedLevel, setSelectedLevel] = useState(3);

  useEffect(() => {
    generateRecommendation();
  }, []);

  const generateRecommendation = () => {
    if (!todayPainLog) {
      setLoading(false);
      return;
    }

    // AI logic: Recommend level based on pain level
    // Pain 1-3 → Level 1-2 (nhẹ)
    // Pain 4-6 → Level 3-4 (trung bình)
    // Pain 7-10 → Level 5-6 (mạnh)
    
    const painLevel = todayPainLog.pain_level;
    let level = 3; // default

    if (painLevel <= 3) {
      level = Math.min(painLevel, 2) || 1;
    } else if (painLevel <= 6) {
      level = Math.min(Math.floor(painLevel / 2) + 1, 4);
    } else {
      level = Math.min(Math.floor(painLevel / 2) + 1, 6);
    }

    setRecommendedLevel(level);
    setSelectedLevel(level);
    setLoading(false);
  };

  const handleLevelSelect = (level: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedLevel(level);
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to device usage timer
    router.push(`/device-usage?level=${selectedLevel}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gợi ý sử dụng thiết bị</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <View style={styles.introCard}>
            <Zap size={32} color={colors.primary} />
            <Text style={styles.introTitle}>Chọn mức phù hợp</Text>
            <Text style={styles.introText}>
              Dựa trên mức đau {todayPainLog?.pain_level}/10 của bạn, chúng tôi gợi ý sử dụng mức {recommendedLevel}
            </Text>
          </View>
        </Animated.View>

        {/* Device Levels */}
        <View style={styles.levelsContainer}>
          {DEVICE_LEVELS.map((item, index) => (
            <Animated.View
              key={item.level}
              entering={FadeInDown.delay(100 * (index + 1)).duration(400)}
            >
              <TouchableOpacity
                style={[
                  styles.levelCard,
                  selectedLevel === item.level && styles.levelCardSelected,
                  item.level === recommendedLevel && styles.levelCardRecommended,
                ]}
                onPress={() => handleLevelSelect(item.level)}
                activeOpacity={0.7}
              >
                <View style={styles.levelHeader}>
                  <View style={[styles.levelBadge, { backgroundColor: item.color }]}>
                    <Text style={styles.levelNumber}>{item.level}</Text>
                  </View>
                  {selectedLevel === item.level && (
                    <CheckCircle2 size={24} color={colors.primary} fill={colors.primary} />
                  )}
                  {item.level === recommendedLevel && selectedLevel !== item.level && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>Gợi ý</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.levelName}>{item.name}</Text>
                <Text style={styles.levelDescription}>{item.description}</Text>
                <Text style={styles.levelIntensity}>{item.intensity}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* CTA Button */}
        <Animated.View entering={FadeInDown.delay(700)}>
          <LinearGradient
            colors={[colors.primary, '#4A7FB8']}
            style={styles.ctaButton}
          >
            <TouchableOpacity
              onPress={handleContinue}
              style={styles.ctaButtonInner}
            >
              <Zap size={24} color="#FFF" fill="#FFF" />
              <Text style={styles.ctaButtonText}>Bắt đầu sử dụng thiết bị</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  introCard: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  introText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  levelsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  levelCard: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  levelCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  levelCardRecommended: {
    borderColor: colors.success,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  levelBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  recommendedBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  levelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  levelDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  levelIntensity: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  ctaButton: {
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  ctaButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
