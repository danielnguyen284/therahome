import React, { useEffect } from 'react';
import { View, StyleSheet, Modal, Dimensions } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Flame, Sparkles } from 'lucide-react-native';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { colors } from '@/utils/theme';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface CelebrationModalProps {
  visible: boolean;
  exerciseTitle: string;
  calories: number;
  streakDays: number;
  onContinue: () => void;
  onViewRecommendations?: () => void;
}

export default function CelebrationModal({
  visible,
  exerciseTitle,
  calories,
  streakDays,
  onContinue,
  onViewRecommendations,
}: CelebrationModalProps) {
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Trophy animation
      scale.value = withSpring(1, { damping: 10, stiffness: 100 });
      
      // Sparkle rotation
      rotation.value = withRepeat(
        withSequence(
          withTiming(10, { duration: 500 }),
          withTiming(-10, { duration: 500 })
        ),
        -1,
        true
      );
    }
  }, [visible]);

  const trophyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View entering={ZoomIn.duration(400)} style={styles.modal}>
          <LinearGradient
            colors={['#10B981', '#34D399', '#6EE7B7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {/* Trophy Icon */}
            <Animated.View style={[styles.iconContainer, trophyStyle]}>
              <Trophy size={80} color="#FFF" strokeWidth={2} />
            </Animated.View>

            {/* Sparkles */}
            <Animated.View style={[styles.sparkle, styles.sparkleTopLeft, sparkleStyle]}>
              <Sparkles size={24} color="#FFF" fill="#FFF" />
            </Animated.View>
            <Animated.View style={[styles.sparkle, styles.sparkleTopRight, sparkleStyle]}>
              <Sparkles size={24} color="#FFF" fill="#FFF" />
            </Animated.View>

            {/* Title */}
            <Animated.View entering={FadeInUp.delay(200)}>
              <Text style={styles.title}>Xuất sắc!</Text>
              <Text style={styles.subtitle}>Bạn đã hoàn thành</Text>
              <Text style={styles.exerciseName}>{exerciseTitle}</Text>
            </Animated.View>

            {/* Stats */}
            <Animated.View entering={FadeInDown.delay(400)} style={styles.statsContainer}>
              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Sparkles size={24} color="#F59E0B" />
                </View>
                <Text style={styles.statValue}>~{calories}</Text>
                <Text style={styles.statLabel}>Calo</Text>
              </View>

              {streakDays > 0 && (
                <View style={styles.statCard}>
                  <View style={styles.statIcon}>
                    <Flame size={24} color="#EF4444" />
                  </View>
                  <Text style={styles.statValue}>{streakDays}</Text>
                  <Text style={styles.statLabel}>Ngày liên tiếp</Text>
                </View>
              )}
            </Animated.View>

            {/* Buttons */}
            <Animated.View entering={FadeInUp.delay(600)} style={styles.buttonContainer}>
              {onViewRecommendations && (
                <Button
                  mode="outlined"
                  onPress={onViewRecommendations}
                  style={styles.button}
                  textColor="#FFF"
                  buttonColor="rgba(255,255,255,0.2)"
                >
                  Xem gợi ý tiếp theo
                </Button>
              )}
              
              <Button
                mode="contained"
                onPress={onContinue}
                style={styles.button}
                buttonColor="#FFF"
                textColor={colors.success}
              >
                Tiếp tục
              </Button>
            </Animated.View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
  },
  gradient: {
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  sparkle: {
    position: 'absolute',
  },
  sparkleTopLeft: {
    top: 20,
    left: 20,
  },
  sparkleTopRight: {
    top: 20,
    right: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 4,
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
    width: '100%',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    borderRadius: 12,
  },
});
