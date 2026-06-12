import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Sparkles, Apple, Dumbbell, Bell } from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { usePainStore } from '@/stores/painStore';
import { generateDailyRecommendations } from '@/services/groq';
import { api } from '@/services/api';
import { colors } from '@/utils/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';

export default function DailyRecommendationsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { todayPainLog } = usePainStore();
  const [loading, setLoading] = useState(true);
  const [nutritionAdvice, setNutritionAdvice] = useState('');
  const [sportAdvice, setSportAdvice] = useState('');
  const [notificationScheduled, setNotificationScheduled] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    if (!user || !todayPainLog) return;

    try {
      setLoading(true);

      // Check if already generated today
      const today = new Date().toISOString().split('T')[0];
      const data = await api.get(`/daily-recommendations?date=${today}`);

      if (data && data.length > 0) {
        setNutritionAdvice(data[0].nutrition_advice);
        setSportAdvice(data[0].sport_advice);
        setLoading(false);
        return;
      }

      // Generate new recommendations using Groq AI
      const recommendations = await generateDailyRecommendations(todayPainLog);
      
      setNutritionAdvice(recommendations.nutrition);
      setSportAdvice(recommendations.sport);

      // Save to database
      await api.post('/daily-recommendations', {
        date: today,
        nutrition_advice: recommendations.nutrition,
        sport_advice: recommendations.sport,
      });

    } catch (error) {
      console.error('Load recommendations error:', error);
      // Fallback
      setNutritionAdvice('Nên ăn nhiều rau xanh, cá hồi giàu omega-3, và uống đủ nước.');
      setSportAdvice('Nên đi bơi hoặc tập yoga nhẹ nhàng để giảm căng thẳng cơ.');
    } finally {
      setLoading(false);
    }
  };

  const scheduleNotification = async () => {
    try {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Vui lòng cấp quyền thông báo để nhận nhắc nhở!');
        return;
      }

      // Schedule notification for tomorrow 9:00 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      
      const safeNutrition = (nutritionAdvice || 'Ăn uống lành mạnh').split('.')[0];
      const safeSport = (sportAdvice || 'Tập thể dục đều đặn').split('.')[0];

      // Calculate seconds from now until tomorrow exactly at 9:00 AM
      const secondsUntilTomorrow = Math.max(1, Math.floor((tomorrow.getTime() - Date.now()) / 1000));

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💡 Gợi ý cho hôm nay',
          body: `Nhớ ${safeNutrition} và ${safeSport} nhé!`,
          data: { type: 'daily_reminder' },
        },
        trigger: {
          seconds: secondsUntilTomorrow,
        } as any,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNotificationScheduled(true);
    } catch (error) {
      console.error('Schedule notification error:', error);
    }
  };

  const handleFinish = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(tabs)/home');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>AI đang tạo gợi ý cho bạn...</Text>
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
        <Text style={styles.headerTitle}>Gợi ý cho ngày mai</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <View style={styles.introCard}>
            <Sparkles size={32} color={colors.primary} />
            <Text style={styles.introTitle}>Hoàn thành xuất sắc!</Text>
            <Text style={styles.introText}>
              Bạn đã hoàn thành phiên trị cải thiện hôm nay. Dưới đây là gợi ý cho ngày mai.
            </Text>
          </View>
        </Animated.View>

        {/* Nutrition Card */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <View style={styles.adviceCard}>
            <View style={styles.adviceHeader}>
              <View style={[styles.iconBadge, { backgroundColor: colors.success + '20' }]}>
                <Apple size={24} color={colors.success} />
              </View>
              <Text style={styles.adviceTitle}>Dinh dưỡng</Text>
            </View>
            <Text style={styles.adviceText}>{nutritionAdvice}</Text>
          </View>
        </Animated.View>

        {/* Sport Card */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <View style={styles.adviceCard}>
            <View style={styles.adviceHeader}>
              <View style={[styles.iconBadge, { backgroundColor: colors.primary + '20' }]}>
                <Dumbbell size={24} color={colors.primary} />
              </View>
              <Text style={styles.adviceTitle}>Thể thao</Text>
            </View>
            <Text style={styles.adviceText}>{sportAdvice}</Text>
          </View>
        </Animated.View>

        {/* Notification Card 
        <Animated.View entering={FadeInDown.delay(300)}>
          <View style={styles.notificationCard}>
            <Bell size={24} color={colors.warning} />
            <Text style={styles.notificationTitle}>Nhắc nhở ngày mai</Text>
            <Text style={styles.notificationText}>
              Bật thông báo để nhận nhắc nhở về dinh dưỡng và thể thao vào 9:00 sáng mai
            </Text>
            {!notificationScheduled ? (
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={scheduleNotification}
              >
                <Text style={styles.notificationButtonText}>Bật nhắc nhở</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.scheduledBadge}>
                <Text style={styles.scheduledText}>✓ Đã đặt nhắc nhở</Text>
              </View>
            )}
          </View>
        </Animated.View>
        */}

        {/* CTA Button */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <LinearGradient
            colors={[colors.primary, '#4A7FB8']}
            style={styles.ctaButton}
          >
            <TouchableOpacity
              onPress={handleFinish}
              style={styles.ctaButtonInner}
            >
              <Text style={styles.ctaButtonText}>Hoàn thành</Text>
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
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
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
    marginBottom: 20,
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
  adviceCard: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adviceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  adviceText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  notificationCard: {
    backgroundColor: colors.warning + '10',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  notificationText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  notificationButton: {
    backgroundColor: colors.warning,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  notificationButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scheduledBadge: {
    backgroundColor: colors.success,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  scheduledText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
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
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
