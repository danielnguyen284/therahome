import React, { useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Star, Sparkles, X } from 'lucide-react-native';
import { colors } from '@/utils/theme';
import Animated, { 
  FadeIn, 
  FadeOut, 
  BounceIn,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface PlanCompletionModalProps {
  visible: boolean;
  planTitle: string;
  totalDays: number;
  onClose: () => void;
}

export default function PlanCompletionModal({
  visible,
  planTitle,
  totalDays,
  onClose,
}: PlanCompletionModalProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      scale.value = withRepeat(
        withTiming(1.1, { duration: 1000 }),
        -1,
        true
      );
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.backdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View entering={BounceIn.delay(200)} style={styles.container}>
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.card}
          >
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#FFF" />
            </TouchableOpacity>

            {/* Confetti/Stars */}
            <View style={styles.decorations}>
              <Sparkles size={32} color="#FFF" style={styles.sparkle1} />
              <Sparkles size={24} color="#FFF" style={styles.sparkle2} />
              <Star size={28} color="#FFF" fill="#FFF" style={styles.star1} />
              <Star size={20} color="#FFF" fill="#FFF" style={styles.star2} />
            </View>

            {/* Trophy Icon */}
            <Animated.View style={[styles.trophyContainer, animatedStyle]}>
              <Trophy size={80} color="#FFF" fill="#FFF" strokeWidth={2} />
            </Animated.View>

            {/* Title */}
            <Text style={styles.title}>🎉 Chúc mừng! 🎉</Text>
            
            {/* Message */}
            <Text style={styles.message}>
              Bạn đã hoàn thành lộ trình
            </Text>
            <Text style={styles.planTitle}>{planTitle}</Text>
            
            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalDays}</Text>
                <Text style={styles.statLabel}>Ngày</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>100%</Text>
                <Text style={styles.statLabel}>Hoàn thành</Text>
              </View>
            </View>

            {/* Encouragement */}
            <Text style={styles.encouragement}>
              Bạn thật tuyệt vời! Hãy tiếp tục duy trì để có sức khỏe tốt hơn mỗi ngày.
            </Text>

            {/* Action Button */}
            <TouchableOpacity
              style={styles.button}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Tiếp tục</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  container: {
    width: '85%',
    maxWidth: 400,
  },
  card: {
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 10,
  },
  decorations: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  sparkle1: {
    position: 'absolute',
    top: 40,
    left: 30,
  },
  sparkle2: {
    position: 'absolute',
    top: 60,
    right: 40,
  },
  star1: {
    position: 'absolute',
    bottom: 100,
    left: 20,
  },
  star2: {
    position: 'absolute',
    bottom: 120,
    right: 30,
  },
  trophyContainer: {
    marginBottom: 24,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    textAlign: 'center',
  },
  planTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  encouragement: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#FFF',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFA500',
  },
});
