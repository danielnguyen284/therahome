import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Calendar, Target, Lock, CheckCircle } from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { getWorkoutPlans, WorkoutPlan } from '@/services/workoutPlans';
import { colors } from '@/utils/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const FIXED_PLAN_DAYS = 14;
const BLUE_PLAN_GRADIENT = ['#68A4DC', '#4E8FD0'] as const;

export default function WorkoutPlansScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ painArea?: string; painAreaLabel?: string }>();
  const { user } = useAuthStore();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await getWorkoutPlans();
      
      if (error || !data) {
        console.error('Load plans error:', error);
        return;
      }

      setPlans(data);
    } catch (error) {
      console.error('Load plans error:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedPainArea = typeof params.painArea === 'string' ? params.painArea : '';
  const selectedPainAreaLabel = typeof params.painAreaLabel === 'string' ? params.painAreaLabel : '';

  const mapPainAreaToPlanTargets = (area: string) => {
    switch (area) {
      case 'neck':
      case 'shoulder_left':
      case 'shoulder_right':
        return ['neck', 'both', 'shoulder'];
      case 'upper_back':
        return ['upper_back', 'back', 'both'];
      case 'middle_back':
        return ['middle_back', 'back', 'both'];
      case 'lower_back':
        return ['lower_back', 'back', 'both'];
      default:
        return area ? [area, 'both'] : [];
    }
  };

  const visiblePlans = useMemo(() => {
    if (!selectedPainArea) return plans;

    const targetAreas = mapPainAreaToPlanTargets(selectedPainArea);
    const matched = plans.filter((plan) => targetAreas.includes(plan.target_area));

    return matched.length > 0 ? matched.slice(0, 1) : plans.slice(0, 1);
  }, [plans, selectedPainArea]);

  const buildPlanTitle = (plan: WorkoutPlan) => {
    if (selectedPainAreaLabel) {
      return `Lộ trình cải thiện ${selectedPainAreaLabel.toLocaleLowerCase('vi-VN')} ${FIXED_PLAN_DAYS} ngày`;
    }

    return plan.title.replace(/\d+\s*ngày/i, `${FIXED_PLAN_DAYS} ngày`);
  };

  const handlePlanPress = (plan: WorkoutPlan) => {
    if (plan.is_pro && !user?.is_pro) {
      // Show PRO required message
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/workout-plan-detail',
      params: {
        id: plan.id,
        selectedArea: selectedPainArea,
        selectedAreaLabel: selectedPainAreaLabel,
      },
    });
  };

  const getTargetAreaName = (area: string) => {
    const names: Record<string, string> = {
      neck: 'Cổ',
      shoulder: 'Vai',
      upper_back: 'Lưng trên',
      middle_back: 'Lưng giữa',
      lower_back: 'Lưng dưới',
      arm: 'Tay',
      leg: 'Chân',
      full_body: 'Toàn thân',
      // Legacy support
      back: 'Lưng',
      both: 'Cổ & Lưng',
    };
    return names[area] || area;
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
        <Text style={styles.headerTitle}>Lộ trình cải thiện</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <Text style={styles.introTitle}>Chọn lộ trình phù hợp</Text>
          <Text style={styles.introText}>
            Theo dõi tiến độ hàng ngày và đạt mục tiêu của bạn
          </Text>
        </Animated.View>

        {/* Plans List */}
        <View style={styles.plansList}>
          {visiblePlans.map((plan, index) => (
            <Animated.View
              key={plan.id}
              entering={FadeInDown.delay(100 * (index + 1)).duration(400)}
            >
              <TouchableOpacity
                style={styles.planCard}
                onPress={() => handlePlanPress(plan)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={BLUE_PLAN_GRADIENT}
                  style={styles.planGradient}
                >
                  {/* PRO Badge */}
                  {plan.is_pro && (
                    <View style={styles.proBadge}>
                      {user?.is_pro ? (
                        <CheckCircle size={16} color="#FFD700" fill="#FFD700" />
                      ) : (
                        <Lock size={16} color="#FFD700" />
                      )}
                      <Text style={styles.proText}>PRO</Text>
                    </View>
                  )}

                  {/* Duration Badge */}
                  <View style={styles.durationBadge}>
                    <Calendar size={20} color="#FFF" />
                    <Text style={styles.durationText}>{FIXED_PLAN_DAYS} ngày</Text>
                  </View>

                  {/* Title */}
                  <Text style={styles.planTitle}>
                    {buildPlanTitle(plan)}
                  </Text>

                  {/* Description */}
                  <Text style={styles.planDescription} numberOfLines={2}>
                    {plan.description}
                  </Text>

                  {/* Target Area */}
                  <View style={styles.targetBadge}>
                    <Target size={16} color="#FFF" />
                    <Text style={styles.targetText}>
                      {selectedPainAreaLabel || getTargetAreaName(plan.target_area)}
                    </Text>
                  </View>

                  {/* CTA */}
                  <View style={styles.ctaButton}>
                    <Text style={styles.ctaText}>
                      {plan.is_pro && !user?.is_pro ? 'Nâng cấp PRO' : 'Bắt đầu'}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Empty State */}
        {visiblePlans.length === 0 && (
          <View style={styles.emptyState}>
            <Calendar size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>Chưa có lộ trình nào</Text>
          </View>
        )}
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
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  introText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  plansList: {
    gap: 16,
  },
  planCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  planGradient: {
    padding: 24,
    minHeight: 220,
  },
  proBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  proText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  planTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
    marginBottom: 16,
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  targetText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  ctaButton: {
    backgroundColor: '#FFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
});
