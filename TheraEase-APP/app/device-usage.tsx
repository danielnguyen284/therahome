import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Zap, CheckCircle2 } from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { usePainStore } from '@/stores/painStore';
import { api } from '@/services/api';
import { colors } from '@/utils/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const DEVICE_DURATION = 10 * 60; // 10 minutes in seconds

export default function DeviceUsageScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  const { todayPainLog } = usePainStore();
  const [timeLeft, setTimeLeft] = useState(DEVICE_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startedAt, setStartedAt] = useState<Date | null>(null);

  const deviceLevel = parseInt(params.level as string) || 3;

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRunning(true);
    setStartedAt(new Date());
  };

  const handlePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRunning(false);
  };

  const handleComplete = async () => {
    if (isCompleted) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsRunning(false);
    setIsCompleted(true);

    // Save device usage log
    if (user && todayPainLog && startedAt) {
      const durationMinutes = Math.floor((DEVICE_DURATION - timeLeft) / 60);
      
      try {
        await api.post('/device-usage', {
          pain_log_id: todayPainLog.id,
          device_level: deviceLevel,
          duration_minutes: durationMinutes,
          started_at: startedAt.toISOString(),
          completed_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Save device usage error:', error);
      }
    }

    // Navigate to daily recommendations after 2 seconds
    setTimeout(() => {
      router.push('/daily-recommendations');
    }, 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((DEVICE_DURATION - timeLeft) / DEVICE_DURATION) * 100;

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
        <Text style={styles.headerTitle}>Sử dụng thiết bị</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Device Level Badge */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <View style={styles.levelBadge}>
            <Zap size={32} color={colors.primary} fill={colors.primary} />
            <Text style={styles.levelText}>Mức {deviceLevel}</Text>
          </View>
        </Animated.View>

        {/* Timer Circle */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.timerContainer}>
          <View style={styles.progressCircle}>
            <View style={[styles.progressFill, { height: `${progress}%` }]} />
          </View>
          <View style={styles.timerContent}>
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            <Text style={styles.timerLabel}>
              {isCompleted ? 'Hoàn thành!' : isRunning ? 'Đang chạy...' : 'Sẵn sàng'}
            </Text>
          </View>
        </Animated.View>

        {/* Instructions */}
        {!isRunning && !isCompleted && (
          <Animated.View entering={FadeInDown.delay(200)}>
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsTitle}>Hướng dẫn sử dụng</Text>
              <Text style={styles.instructionsText}>
                1. Đặt thiết bị vào vùng đau{'\n'}
                2. Điều chỉnh mức {deviceLevel}{'\n'}
                3. Bấm "Bắt đầu" và thư giãn{'\n'}
                4. Sử dụng trong 10 phút
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Completed Message */}
        {isCompleted && (
          <Animated.View entering={FadeInDown.delay(200)}>
            <View style={styles.completedCard}>
              <CheckCircle2 size={48} color={colors.success} fill={colors.success} />
              <Text style={styles.completedTitle}>Tuyệt vời!</Text>
              <Text style={styles.completedText}>
                Bạn đã hoàn thành phiên cải thiện với thiết bị
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Control Buttons */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.controls}>
          {!isCompleted && (
            <>
              {!isRunning ? (
                <LinearGradient
                  colors={[colors.primary, '#4A7FB8']}
                  style={styles.ctaButton}
                >
                  <TouchableOpacity
                    onPress={handleStart}
                    style={styles.ctaButtonInner}
                  >
                    <Zap size={24} color="#FFF" fill="#FFF" />
                    <Text style={styles.ctaButtonText}>
                      {timeLeft === DEVICE_DURATION ? 'Bắt đầu' : 'Tiếp tục'}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              ) : (
                <TouchableOpacity
                  style={styles.pauseButton}
                  onPress={handlePause}
                >
                  <Text style={styles.pauseButtonText}>Tạm dừng</Text>
                </TouchableOpacity>
              )}

              {timeLeft < DEVICE_DURATION && (
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={handleComplete}
                >
                  <Text style={styles.skipButtonText}>Hoàn thành sớm</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </Animated.View>
      </View>
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
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: 40,
  },
  levelText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  timerContainer: {
    position: 'relative',
    width: 280,
    height: 280,
    marginBottom: 40,
  },
  progressCircle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.surface,
    borderWidth: 8,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.primary + '30',
  },
  timerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: colors.text,
  },
  timerLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
  },
  instructionsCard: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    width: '100%',
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  completedCard: {
    backgroundColor: colors.surface,
    padding: 32,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.success,
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  completedText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  controls: {
    width: '100%',
    gap: 12,
  },
  ctaButton: {
    borderRadius: 16,
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
  pauseButton: {
    backgroundColor: colors.warning,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  pauseButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  skipButton: {
    backgroundColor: colors.surface,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
