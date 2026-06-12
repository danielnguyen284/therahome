import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button, ActivityIndicator, Chip } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Zap, Target, Play, Star, Tag, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { getExerciseById, logWorkout, updateWorkoutLog } from '@/services/exercises';
import { submitFeedback } from '@/services/feedback';
import VideoPlayer from '@/components/VideoPlayer';
import FeedbackModal from '@/components/FeedbackModal';
import CelebrationModal from '@/components/CelebrationModal';
import { colors } from '@/utils/theme';
import type { Exercise } from '@/types';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { getUserBehavior } from '@/services/exercises';
import { usePainStore } from '@/stores/painStore';
import {
  getPainVideoLevel,
  getPainVideoLevelLabel,
  getRelevantPainLevelForExercise,
  resolveExerciseVideoUrl,
} from '@/utils/painRouting';

export default function ExerciseDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  const { todayPainLog } = usePainStore();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [workoutLogId, setWorkoutLogId] = useState<string | null>(null);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'completed' | 'skipped'>('completed');
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const [streakDays, setStreakDays] = useState(0);
  
  // Dropdown states
  const [instructionsExpanded, setInstructionsExpanded] = useState(false);
  const [benefitsExpanded, setBenefitsExpanded] = useState(false);
  const [variationsExpanded, setVariationsExpanded] = useState(false);

  useEffect(() => {
    loadExercise();
  }, [params.id]);

  const loadExercise = async () => {
    if (!params.id) return;

    try {
      setLoading(true);
      const exerciseData = await getExerciseById(params.id as string);
      
      if (!exerciseData) {
        console.error('Load exercise error: Exercise not found');
        return;
      }

      setExercise(exerciseData);
    } catch (error) {
      console.error('Load exercise error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartWorkout = async () => {
    if (!user || !exercise) return;

    try {
      const workoutData: any = {
        user_id: user.id,
        exercise_id: exercise.id,
        started_at: new Date().toISOString(),
        is_completed: false,
        skipped: false,
      };

      // Add plan context if coming from a plan
      if (params.planId) {
        workoutData.plan_id = params.planId;
      }
      if (params.dayNumber) {
        workoutData.day_number = parseInt(params.dayNumber as string);
      }

      const logData = await logWorkout(workoutData);

      if (!logData) {
        console.error('Log workout error: No data returned');
        return;
      }

      setWorkoutLogId(logData.id || logData._id);
      setPlaying(true);
    } catch (error) {
      console.error('Start workout error:', error);
    }
  };

  const handleComplete = async () => {
    if (!workoutLogId || !user) return;

    try {
      await updateWorkoutLog(workoutLogId, {
        completed_at: new Date().toISOString(),
        is_completed: true,
      });

      // Load user behavior to get streak
      const { data: behavior } = await getUserBehavior(user.id);
      if (behavior) {
        setStreakDays(behavior.streak_days);
      }

      setPlaying(false);
      setCelebrationVisible(true);
    } catch (error) {
      console.error('Complete workout error:', error);
    }
  };

  const handleCelebrationContinue = () => {
    setCelebrationVisible(false);
    setFeedbackType('completed');
    setFeedbackVisible(true);
  };

  const handleSkip = async () => {
    if (!workoutLogId) return;

    try {
      await updateWorkoutLog(workoutLogId, {
        skipped: true,
        is_completed: false,
      });

      setPlaying(false);
      setFeedbackType('skipped');
      setFeedbackVisible(true);
    } catch (error) {
      console.error('Skip workout error:', error);
    }
  };

  const handleFeedbackSubmit = async (feedback: any) => {
    if (!workoutLogId || !user) return;

    try {
      await submitFeedback({
        user_id: user.id,
        workout_log_id: workoutLogId,
        ...feedback,
      });

      setFeedbackVisible(false);
      router.back();
    } catch (error) {
      console.error('Submit feedback error:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!exercise) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy bài tập</Text>
        <Button mode="contained" onPress={() => router.back()}>
          Quay lại
        </Button>
      </View>
    );
  }

  const getAreaName = (area: string) => {
    const areaNames: Record<string, string> = {
      neck: 'Cổ',
      shoulder_left: 'Vai trái',
      shoulder_right: 'Vai phải',
      upper_back: 'Lưng trên',
      middle_back: 'Lưng giữa',
      lower_back: 'Lưng dưới',
      arm_left: 'Cánh tay trái',
      arm_right: 'Cánh tay phải',
      hand_left: 'Bàn tay trái',
      hand_right: 'Bàn tay phải',
      thigh_left: 'Đùi trái',
      thigh_right: 'Đùi phải',
      leg_left: 'Cẳng chân trái',
      leg_right: 'Cẳng chân phải',
      foot_left: 'Bàn chân trái',
      foot_right: 'Bàn chân phải',
    };
    return areaNames[area] || area;
  };

  const getDifficultyColor = (difficulty: string) => {
    if (difficulty === 'easy') return colors.success;
    if (difficulty === 'medium') return colors.warning;
    return colors.error;
  };

  const resolvedPainLevel = getRelevantPainLevelForExercise(exercise, todayPainLog);
  const resolvedPainLevelKey = getPainVideoLevel(resolvedPainLevel);
  const resolvedVideoUrl = resolveExerciseVideoUrl(exercise, todayPainLog);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {!playing ? (
        <>
          {/* Header with Back Button */}
          <Animated.View entering={FadeInDown.duration(300)} style={styles.topHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chi tiết bài tập</Text>
            <View style={styles.placeholder} />
          </Animated.View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <Animated.View entering={FadeInDown.delay(100)}>
              <Text style={styles.title}>{exercise.title}</Text>
              {exercise.description && (
                <Text style={styles.description}>{exercise.description}</Text>
              )}
            </Animated.View>

            {/* Info Cards */}
            <Animated.View entering={FadeInDown.delay(200)} style={styles.infoCards}>
              <View style={styles.infoCard}>
                <Zap size={24} color={getDifficultyColor(exercise.difficulty)} />
                <Text style={[styles.infoCardValue, { color: getDifficultyColor(exercise.difficulty) }]}>
                  {exercise.difficulty === 'easy' ? 'Dễ' : exercise.difficulty === 'medium' ? 'Vừa' : 'Khó'}
                </Text>
                <Text style={styles.infoCardLabel}>Độ khó</Text>
              </View>

              <View style={styles.infoCard}>
                <Target size={24} color={colors.warning} />
                <Text style={styles.infoCardValue}>~50</Text>
                <Text style={styles.infoCardLabel}>Calo</Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(250)} style={styles.painAnalysisCard}>
              <Text style={styles.painAnalysisTitle}>Phân tích mức đau hiện tại</Text>
              <Text style={styles.painAnalysisText}>
                Video đang được chọn theo mức đau: {getPainVideoLevelLabel(resolvedPainLevelKey)}
              </Text>
            </Animated.View>

            {/* Rating Stars (4 tiêu chí) */}
            <Animated.View entering={FadeInDown.delay(300)} style={styles.ratingSection}>
              <Text style={styles.sectionTitle}>Đánh giá</Text>
              <View style={styles.ratingGrid}>
                <View style={styles.ratingItem}>
                  <Text style={styles.ratingLabel}>Độ linh hoạt</Text>
                  <View style={styles.stars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        color={star <= 3 ? '#FFD700' : '#E0E0E0'}
                        fill={star <= 3 ? '#FFD700' : 'transparent'}
                      />
                    ))}
                  </View>
                </View>
                <View style={styles.ratingItem}>
                  <Text style={styles.ratingLabel}>Sức mạnh</Text>
                  <View style={styles.stars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        color={star <= 2 ? '#FFD700' : '#E0E0E0'}
                        fill={star <= 2 ? '#FFD700' : 'transparent'}
                      />
                    ))}
                  </View>
                </View>
                <View style={styles.ratingItem}>
                  <Text style={styles.ratingLabel}>Số dư</Text>
                  <View style={styles.stars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        color={star <= 2 ? '#FFD700' : '#E0E0E0'}
                        fill={star <= 2 ? '#FFD700' : 'transparent'}
                      />
                    ))}
                  </View>
                </View>
                <View style={styles.ratingItem}>
                  <Text style={styles.ratingLabel}>Thư giãn</Text>
                  <View style={styles.stars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        color={star <= 4 ? '#FFD700' : '#E0E0E0'}
                        fill={star <= 4 ? '#FFD700' : 'transparent'}
                      />
                    ))}
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Tags */}
            {exercise.tags && exercise.tags.length > 0 && (
              <Animated.View entering={FadeInDown.delay(350)} style={styles.tagsSection}>
                <View style={styles.sectionHeader}>
                  <Tag size={20} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Phù hợp với</Text>
                </View>
                <View style={styles.tagsContainer}>
                  {exercise.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      mode="outlined"
                      style={styles.tagChip}
                      textStyle={styles.tagChipText}
                    >
                      {tag}
                    </Chip>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Target Areas */}
            <Animated.View entering={FadeInDown.delay(400)} style={styles.targetSection}>
              <View style={styles.sectionHeader}>
                <Target size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Vùng tác động</Text>
              </View>
              <View style={styles.targetAreas}>
                {exercise.target_areas.map((area, index) => (
                  <Chip
                    key={index}
                    mode="flat"
                    style={styles.targetChip}
                    textStyle={styles.targetChipText}
                  >
                    {getAreaName(area)}
                  </Chip>
                ))}
              </View>
            </Animated.View>

            {/* Dropdown: Hướng dẫn */}
            {exercise.instructions && exercise.instructions.length > 0 && (
              <Animated.View entering={FadeInDown.delay(450)} style={styles.dropdownSection}>
                <TouchableOpacity
                  style={styles.dropdownHeader}
                  onPress={() => setInstructionsExpanded(!instructionsExpanded)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownTitle}>Hướng dẫn</Text>
                  {instructionsExpanded ? (
                    <ChevronUp size={24} color={colors.text} />
                  ) : (
                    <ChevronDown size={24} color={colors.text} />
                  )}
                </TouchableOpacity>
                {instructionsExpanded && (
                  <View style={styles.dropdownContent}>
                    {exercise.instructions.map((instruction: any, index: number) => (
                      <View key={index} style={styles.instructionItem}>
                        <View style={styles.stepNumber}>
                          <Text style={styles.stepNumberText}>{instruction.step}</Text>
                        </View>
                        <Text style={styles.instructionText}>{instruction.text}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </Animated.View>
            )}

            {/* Dropdown: Lợi ích */}
            {exercise.benefits && exercise.benefits.length > 0 && (
              <Animated.View entering={FadeInDown.delay(500)} style={styles.dropdownSection}>
                <TouchableOpacity
                  style={styles.dropdownHeader}
                  onPress={() => setBenefitsExpanded(!benefitsExpanded)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownTitle}>Lợi ích</Text>
                  {benefitsExpanded ? (
                    <ChevronUp size={24} color={colors.text} />
                  ) : (
                    <ChevronDown size={24} color={colors.text} />
                  )}
                </TouchableOpacity>
                {benefitsExpanded && (
                  <View style={styles.dropdownContent}>
                    {exercise.benefits.map((benefit: string, index: number) => (
                      <View key={index} style={styles.benefitItem}>
                        <Text style={styles.bulletPoint}>✓</Text>
                        <Text style={styles.benefitText}>{benefit}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </Animated.View>
            )}

            {/* Dropdown: Biến thể */}
            {exercise.variations && Object.keys(exercise.variations).length > 0 && (
              <Animated.View entering={FadeInDown.delay(550)} style={styles.dropdownSection}>
                <TouchableOpacity
                  style={styles.dropdownHeader}
                  onPress={() => setVariationsExpanded(!variationsExpanded)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownTitle}>Biến thể cho người cao tuổi</Text>
                  {variationsExpanded ? (
                    <ChevronUp size={24} color={colors.text} />
                  ) : (
                    <ChevronDown size={24} color={colors.text} />
                  )}
                </TouchableOpacity>
                {variationsExpanded && (
                  <View style={styles.dropdownContent}>
                    <Text style={styles.variationText}>{exercise.variations.description || 'Phiên bản dễ hơn cho người cao tuổi hoặc mới bắt đầu'}</Text>
                  </View>
                )}
              </Animated.View>
            )}

            <Animated.View entering={FadeInUp.delay(600)}>
              <LinearGradient
                colors={[colors.primary, '#4A7FB8']}
                style={styles.startButton}
              >
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    handleStartWorkout();
                  }}
                  style={styles.startButtonInner}
                >
                  <Play size={24} color="#FFF" fill="#FFF" />
                  <Text style={styles.startButtonText}>Bắt đầu bài tập</Text>
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>
          </ScrollView>
        </>
      ) : (
        <Modal 
          visible={playing} 
          animationType="fade"
          supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}
        >
          <VideoPlayer
            videoUrl={resolvedVideoUrl}
            title={exercise.title}
            isLibraryMode={true}
            onComplete={handleComplete}
            onClose={handleSkip}
          />
        </Modal>
      )}

      {/* Celebration Modal */}
      <CelebrationModal
        visible={celebrationVisible}
        exerciseTitle={exercise?.title || ''}
        calories={50}
        streakDays={streakDays}
        onContinue={handleCelebrationContinue}
        onViewRecommendations={() => {
          setCelebrationVisible(false);
          router.push('/recommendations');
        }}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        visible={feedbackVisible}
        type={feedbackType}
        onSubmit={handleFeedbackSubmit}
        onDismiss={() => {
          setFeedbackVisible(false);
          router.back();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
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
    marginBottom: 24,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
  },
  infoCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoCardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  infoCardLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  painAnalysisCard: {
    marginBottom: 24,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  painAnalysisTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  painAnalysisText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  targetSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  targetAreas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  targetChip: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
    borderWidth: 1,
  },
  targetChipText: {
    color: colors.primary,
    fontWeight: '600',
  },
  benefitsSection: {
    marginBottom: 32,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingLeft: 8,
  },
  benefitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginTop: 8,
    marginRight: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  startButton: {
    borderRadius: 16,
    marginBottom: 20,
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
  ratingSection: {
    marginBottom: 24,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ratingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  ratingItem: {
    width: '47%',
    marginBottom: 8,
  },
  ratingLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  stars: {
    flexDirection: 'row',
    gap: 4,
  },
  tagsSection: {
    marginBottom: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  tagChipText: {
    color: colors.text,
    fontSize: 13,
  },
  dropdownSection: {
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  dropdownContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  instructionText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  bulletPoint: {
    fontSize: 18,
    color: colors.success,
    marginRight: 12,
    fontWeight: 'bold',
  },
  variationText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
});
