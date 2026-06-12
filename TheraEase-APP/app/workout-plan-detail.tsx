import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Calendar, CheckCircle, Lock, Play } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '@/stores/authStore';
import { getWorkoutPlanById, getPlanExercises, getPlanProgress, WorkoutPlan, PlanExercise } from '@/services/workoutPlans';
import PlanCompletionModal from '@/components/PlanCompletionModal';
import { colors } from '@/utils/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const FIXED_PLAN_DAYS = 14;

interface DayExercises {
  day: number;
  exercises: PlanExercise[];
  isCompleted: boolean;
  isUnlocked: boolean;
}

export default function WorkoutPlanDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [dayExercises, setDayExercises] = useState<DayExercises[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDay, setCurrentDay] = useState(1);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  useEffect(() => {
    loadPlanDetail();
  }, [params.id]);

  useFocusEffect(
    React.useCallback(() => {
      void loadPlanDetail();
    }, [params.id, user?.id])
  );

  const loadPlanDetail = async () => {
    if (!params.id || !user) return;

    try {
      setLoading(true);
      
      // Load plan
      const { data: planData, error: planError } = await getWorkoutPlanById(params.id as string);
      if (planError) {
        console.error('Load plan error:', planError);
        Alert.alert('Lỗi', 'Không thể tải lộ trình. Vui lòng thử lại sau.');
        router.back();
        return;
      }
      
      if (!planData) {
        console.error('Plan not found:', params.id);
        Alert.alert('Lỗi', 'Không tìm thấy lộ trình này.');
        router.back();
        return;
      }
      
      setPlan(planData);

      // Load exercises
      const { data: exercisesData, error: exercisesError } = await getPlanExercises(params.id as string);
      if (exercisesError || !exercisesData) {
        console.error('Load exercises error:', exercisesError);
        return;
      }

      // Load progress
      const { data: progressData } = await getPlanProgress(params.id as string, user.id);
      const completedDays = new Set(
        progressData?.map((log: any) => log.day_number) || []
      );

      // Group exercises by day
      const grouped: Record<number, PlanExercise[]> = {};
      exercisesData.forEach((ex: any) => {
        if (!grouped[ex.day_number]) {
          grouped[ex.day_number] = [];
        }
        grouped[ex.day_number].push(ex);
      });

      // Create day exercises array with unlock logic
      const days: DayExercises[] = [];
      for (let day = 1; day <= FIXED_PLAN_DAYS; day++) {
        const isCompleted = completedDays.has(day);
        const isUnlocked = day === 1 || completedDays.has(day - 1); // Unlock if previous day completed
        
        days.push({
          day,
          exercises: grouped[day] || [],
          isCompleted,
          isUnlocked,
        });
      }

      setDayExercises(days);

      // Check if plan is completed
      const allCompleted = days.every(d => d.isCompleted);
      if (allCompleted && completedDays.size === FIXED_PLAN_DAYS) {
        // Show completion modal after a short delay
        setTimeout(() => {
          setShowCompletionModal(true);
        }, 500);
      }

      // Set current day to first uncompleted day
      const firstIncomplete = days.find(d => !d.isCompleted && d.isUnlocked);
      if (firstIncomplete) {
        setCurrentDay(firstIncomplete.day);
      }
    } catch (error) {
      console.error('Load plan detail error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDayPress = (day: DayExercises) => {
    if (!day.isUnlocked) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentDay(day.day);
  };

  const handleStartDay = () => {
    const day = dayExercises.find(d => d.day === currentDay);
    if (!day || day.exercises.length === 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Navigate to workout sequence (play all exercises)
    router.push(`/workout-sequence?planId=${params.id}&day=${currentDay}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy lộ trình</Text>
      </View>
    );
  }

  const currentDayData = dayExercises.find(d => d.day === currentDay);
  const completedCount = dayExercises.filter(d => d.isCompleted).length;
  const progressPercent = (completedCount / FIXED_PLAN_DAYS) * 100;
  const selectedAreaLabel = typeof params.selectedAreaLabel === 'string' ? params.selectedAreaLabel : '';
  const displayPlanTitle = selectedAreaLabel
    ? `Lộ trình cải thiện ${selectedAreaLabel.toLocaleLowerCase('vi-VN')} ${FIXED_PLAN_DAYS} ngày`
    : plan.title.replace(/\d+\s*ngày/i, `${FIXED_PLAN_DAYS} ngày`);

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
        <Text style={styles.headerTitle}>{displayPlanTitle}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress Card */}
        <Animated.View entering={FadeInDown.duration(300)} style={styles.progressCard}>
          <LinearGradient
            colors={[colors.primary, '#4A7FB8']}
            style={styles.progressGradient}
          >
            <Text style={styles.progressTitle}>Tiến độ của bạn</Text>
            <Text style={styles.progressText}>
              {completedCount}/{FIXED_PLAN_DAYS} ngày
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.progressPercent}>{Math.round(progressPercent)}%</Text>
          </LinearGradient>
        </Animated.View>

        {/* Calendar View */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.calendarSection}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Lịch cải thiện</Text>
          </View>

          <View style={styles.calendar}>
            {dayExercises.map((day, index) => (
              <TouchableOpacity
                key={day.day}
                style={[
                  styles.dayCell,
                  day.isCompleted && styles.dayCellCompleted,
                  !day.isUnlocked && styles.dayCellLocked,
                  currentDay === day.day && styles.dayCellActive,
                ]}
                onPress={() => handleDayPress(day)}
                activeOpacity={0.7}
                disabled={!day.isUnlocked}
              >
                {day.isCompleted ? (
                  <CheckCircle size={20} color="#FFF" fill="#FFF" />
                ) : !day.isUnlocked ? (
                  <Lock size={20} color={colors.textSecondary} />
                ) : (
                  <Text
                    style={[
                      styles.dayNumber,
                      currentDay === day.day && styles.dayNumberActive,
                    ]}
                  >
                    {day.day}
                  </Text>
                )}
                <Text
                  style={[
                    styles.dayLabel,
                    day.isCompleted && styles.dayLabelCompleted,
                    !day.isUnlocked && styles.dayLabelLocked,
                    currentDay === day.day && styles.dayLabelActive,
                  ]}
                >
                  Ngày {day.day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Current Day Exercises */}
        {currentDayData && (
          <Animated.View entering={FadeInDown.delay(200)} style={styles.exercisesSection}>
            {/* Start Button */}
            {currentDayData.exercises.length > 0 && (
              <LinearGradient
                colors={[colors.primary, '#4A7FB8']}
                style={styles.startButton}
              >
                <TouchableOpacity
                  onPress={handleStartDay}
                  style={styles.startButtonInner}
                >
                  <Play size={24} color="#FFF" fill="#FFF" />
                  <Text style={styles.startButtonText}>
                    {currentDayData.isCompleted ? 'Tập lại' : 'Bắt đầu ngày này'}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            )}
          </Animated.View>
        )}
      </ScrollView>

      {/* Completion Modal */}
      {plan && (
        <PlanCompletionModal
          visible={showCompletionModal}
          planTitle={displayPlanTitle}
          totalDays={FIXED_PLAN_DAYS}
          onClose={() => setShowCompletionModal(false)}
        />
      )}
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
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  progressCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressGradient: {
    padding: 24,
  },
  progressTitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFF',
  },
  progressPercent: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'right',
  },
  calendarSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dayCell: {
    width: (width - 40 - 48) / 5,
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  dayCellCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  dayCellLocked: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    opacity: 0.5,
  },
  dayCellActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  dayNumberActive: {
    color: '#FFF',
  },
  dayLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  dayLabelCompleted: {
    color: '#FFF',
  },
  dayLabelLocked: {
    color: colors.textSecondary,
  },
  dayLabelActive: {
    color: '#FFF',
  },
  exercisesSection: {
    marginBottom: 24,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  exerciseDuration: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  startButton: {
    borderRadius: 16,
    marginTop: 20,
    overflow: 'hidden',
  },
  startButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
