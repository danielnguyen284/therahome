import React, { useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, PanResponder, Animated as RNAnimated } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, MotiText } from 'moti';
import { 
  Thermometer, 
  Info
} from 'lucide-react-native';
import { colors } from '@/utils/theme';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 80;
const THUMB_SIZE = 40;
const UNIT_WIDTH = SLIDER_WIDTH / 2;

const LEVELS = [
  { id: 0, label: 'Thi thoảng', color: '#10B981', emoji: '😊', desc: 'Đau nhẹ, không thường xuyên' },
  { id: 1, label: 'Thường xuyên', color: '#F59E0B', emoji: '😐', desc: 'Đau âm ỉ, xuất hiện hàng ngày' },
  { id: 2, label: 'Dữ dội', color: '#EF4444', emoji: '😫', desc: 'Đau nhức nhối, ảnh hưởng lớn' },
];

export default function PainLevelScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [levelIndex, setLevelIndex] = useState(1);
  
  const pan = useRef(new RNAnimated.Value(1)).current; 
  const dragStartValue = useRef(1);

  const handleSnap = (index: number) => {
    const target = Math.max(0, Math.min(2, index));
    setLevelIndex(target);
    RNAnimated.spring(pan, {
      toValue: target,
      useNativeDriver: false,
      friction: 7,
      tension: 50,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Lấy giá trị hiện tại làm mốc bắt đầu kéo
        // @ts-ignore
        dragStartValue.current = pan._value;
      },
      onPanResponderMove: (e, gestureState) => {
        // dx là khoảng cách di chuyển từ điểm chạm đầu tiên
        // Tính toán delta theo đơn vị từ 0 đến 2
        const delta = gestureState.dx / UNIT_WIDTH;
        let newValue = dragStartValue.current + delta;
        newValue = Math.max(0, Math.min(2, newValue));
        
        pan.setValue(newValue);
        
        // Cập nhật UI ngay khi đang kéo (Emoji & Label)
        const roundedIndex = Math.round(newValue);
        if (roundedIndex !== levelIndex) {
          setLevelIndex(roundedIndex);
          Haptics.selectionAsync();
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        // @ts-ignore
        const finalValue = pan._value;
        const snapIndex = Math.round(finalValue);
        handleSnap(snapIndex);
      },
    })
  ).current;

  const handleNext = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace({ 
      pathname: '/(auth)/pain-time', 
      params: { ...params, painLevel: LEVELS[levelIndex].label } 
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FDFCFB', '#F1F5F9']}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <MotiView 
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 800 }}
            style={styles.header}
          >
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: '85%' }]} />
            </View>
            
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Thermometer size={32} color={colors.primary} strokeWidth={2.5} />
              </View>
            </View>
            
            <Text style={styles.title}>Mức độ đau</Text>
            <Text style={styles.subtitle}>
              Hãy cho chúng tôi biết cảm nhận hiện tại về tình trạng đau của bạn.
            </Text>
          </MotiView>

          <View style={styles.mainSection}>
            <MotiView 
              key={levelIndex}
              from={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              style={styles.emojiContainer}
            >
              <View style={[
                styles.emojiCircle, 
                { backgroundColor: LEVELS[levelIndex].color + '15' }
              ]}>
                <Text style={styles.emojiText}>{LEVELS[levelIndex].emoji}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: LEVELS[levelIndex].color }]}>
                <Text style={styles.badgeText}>{LEVELS[levelIndex].label}</Text>
              </View>
            </MotiView>

            <View style={styles.sliderContainer}>
              <View style={styles.track}>
                {/* Background track line */}
                <View style={styles.trackBackground} />
                
                {/* Active (colored) track part */}
                <RNAnimated.View style={[
                  styles.activeTrack,
                  { 
                    width: pan.interpolate({
                      inputRange: [0, 2],
                      outputRange: ['0%', '100%'],
                      extrapolate: 'clamp'
                    }),
                    backgroundColor: pan.interpolate({
                      inputRange: [0, 1, 2],
                      outputRange: [LEVELS[0].color, LEVELS[1].color, LEVELS[2].color],
                      extrapolate: 'clamp'
                    })
                  }
                ]} />
                
                {/* Markers */}
                {LEVELS.map((level) => (
                  <TouchableOpacity 
                    key={level.id} 
                    style={[styles.stepDot, { left: `${(level.id / 2) * 100}%` as any }]} 
                    onPress={() => handleSnap(level.id)}
                    activeOpacity={0.7}
                  />
                ))}
              </View>

              <RNAnimated.View 
                {...panResponder.panHandlers}
                style={[
                  styles.thumb,
                  {
                    left: pan.interpolate({
                      inputRange: [0, 2],
                      outputRange: [0, SLIDER_WIDTH - THUMB_SIZE],
                      extrapolate: 'clamp'
                    }),
                    backgroundColor: pan.interpolate({
                      inputRange: [0, 1, 2],
                      outputRange: [LEVELS[0].color, LEVELS[1].color, LEVELS[2].color],
                      extrapolate: 'clamp'
                    }),
                  }
                ]}
              />
            </View>

            <View style={styles.infoCard}>
              <Info size={20} color={colors.primary} style={styles.infoIcon} />
              <MotiView 
                key={levelIndex}
                from={{ opacity: 0, translateX: 5 }}
                animate={{ opacity: 1, translateX: 0 }}
                style={{ flex: 1 }}
              >
                <Text style={styles.infoText}>
                  {LEVELS[levelIndex].desc}
                </Text>
              </MotiView>
            </View>
          </View>

          <MotiView 
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 500, type: 'timing', duration: 500 }}
            style={styles.footer}
          >
            <Button
              mode="contained"
              onPress={handleNext}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              buttonColor={colors.primary}
              uppercase={false}
            >
              TIẾP TỤC
            </Button>
          </MotiView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    marginTop: 20,
    marginBottom: 40,
    alignItems: 'center',
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 32,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  mainSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  emojiCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  emojiText: {
    fontSize: 70,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  sliderContainer: {
    width: SLIDER_WIDTH,
    height: 60,
    justifyContent: 'center',
    marginBottom: 40,
  },
  track: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  trackBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
  },
  activeTrack: {
    height: '100%',
    borderRadius: 5,
  },
  stepDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#9CA3AF', // Grayer for inactive
    top: -1, // Adjust slightly to center on 10px track
    transform: [{ translateX: -6 }],
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
    lineHeight: 20,
  },
  footer: {
    paddingVertical: 20,
  },
  button: {
    borderRadius: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  buttonContent: {
    paddingVertical: 14,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
    lineHeight: 26,
  },
});
