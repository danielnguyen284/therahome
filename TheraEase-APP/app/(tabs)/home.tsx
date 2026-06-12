import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Modal } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { 
  FadeInDown,
  FadeInUp,
  FadeOutUp,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  interpolate,
  withTiming,
  Easing
} from 'react-native-reanimated';
import { Flame, TrendingUp, Heart, Activity, Target, ClipboardList, BarChart2, X, TrendingDown, Minus, Lock, Bell } from 'lucide-react-native';
import { LineChart } from 'react-native-chart-kit';
import { useAuthStore } from '@/stores/authStore';
import { usePainStore } from '@/stores/painStore';
import { getTodayPainLog, getPainLogs } from '@/services/painLogs';
import { getUserBehavior, getWorkoutHistory } from '@/services/exercises';
import { getHealthTips, getNutritionTips } from '@/services/dailyContent';
import { getTodayWater, incrementWater } from '@/services/water';
import { api } from '@/services/api';
import { getOwnedDeviceIds } from '@/utils/ownedDevices';
import PainChart from '@/components/PainChart';
import WaterTrackerCard from '@/components/WaterTrackerCard';
import { useTheme } from '@/contexts/ThemeContext';
import { getNotificationInbox } from '@/services/notificationInbox';

const { width } = Dimensions.get('window');

// Waving Hand Animation Component
const WavingHand = ({ textStyle }: { textStyle: any }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withTiming(20, { duration: 150, easing: Easing.inOut(Easing.ease) });
    const interval = setInterval(() => {
      rotation.value = withTiming(0, { duration: 150 });
      setTimeout(() => {
        rotation.value = withTiming(20, { duration: 150 });
        setTimeout(() => {
          rotation.value = withTiming(0, { duration: 150 });
        }, 150);
      }, 150);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.Text style={[textStyle, animatedStyle]}>
      👋
    </Animated.Text>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const { user } = useAuthStore();
  const { todayPainLog, painHistory, setTodayPainLog, setPainHistory } = usePainStore();
  const [loading, setLoading] = useState(true);
  const [healthScore, setHealthScore] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [dailyTip, setDailyTip] = useState('Hãy duy trì cải thiện đều đặn mỗi ngày!');
  const [dailyNutrition, setDailyNutrition] = useState('Uống đủ nước và ăn nhiều rau xanh!');
  const [motivationIndex, setMotivationIndex] = useState(0);
  const [showPainAnalysis, setShowPainAnalysis] = useState(false);
  const [showHealthScoreChart, setShowHealthScoreChart] = useState(false);
  const [painAnalysisData, setPainAnalysisData] = useState<any>(null);
  const [deviceRecommendation, setDeviceRecommendation] = useState<any>(null);
  const [workoutHistory, setWorkoutHistory] = useState<any[]>([]);
  const [waterCups, setWaterCups] = useState(2);
  const [waterGoal, setWaterGoal] = useState(8);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const scoreProgress = useSharedValue(0);
  const scoreNumber = useSharedValue(0);

  const personalizedPlanUnlocked = useMemo(() => {
    // nếu Bypassed thì comment dòng 90-93
    if (!user?.personalized_plan_completed_at) return false;
    if (!user?.personalized_plan_unlock_at) return false;
    const unlockAt = new Date(user.personalized_plan_unlock_at).getTime();
    if (Number.isNaN(unlockAt)) return false;
    return Date.now() >= unlockAt;
    // return true; // Bypassed for testing
  }, [user?.personalized_plan_completed_at, user?.personalized_plan_unlock_at]);

  const motivationMessages = [
    'Tiếp tục cố gắng!',
    'Bạn làm tốt lắm!',
    'Đừng bỏ cuộc nhé!',
    'Mỗi ngày một chút!',
    'Sức khỏe là vàng!',
    'Kiên trì sẽ thành công!',
  ];

  useEffect(() => {
    loadData();
    loadDailyContent();
    loadWaterToday();
    
    // Background sync profile to database if not exists
    if (user && user.id !== 'guest') {
      syncProfileIfNeeded();
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadWaterToday();
      void loadNotificationSummary();

      // Update SMART Notification scheduling whenever the user visits the home screen (which acts as an "app open" activity tracker)
      if (user && user.id !== 'guest') {
        import('@/services/notifications').then((module) => {
          if (user.notifications_enabled !== false) {
            void module.registerForPushNotifications();
          }
          module.rescheduleSmartNotifications(user, personalizedPlanUnlocked);
        });
      }
    }, [user?.id, personalizedPlanUnlocked])
  );

  const loadNotificationSummary = async () => {
    if (!user || user.id === 'guest') {
      setUnreadNotificationCount(0);
      return;
    }

    try {
      const response = await getNotificationInbox(10);
      setUnreadNotificationCount(response.unread_count || 0);
    } catch (error) {
      console.error('Load notification summary error:', error);
    }
  };

  useEffect(() => {
    // Animate progress bar from 0 to healthScore
    scoreProgress.value = withSpring(healthScore / 100, {
      damping: 15,
      stiffness: 100,
    });
    
    // Animate number counting
    scoreNumber.value = withSpring(healthScore, {
      damping: 20,
      stiffness: 80,
    });
  }, [healthScore]);

  // Rotate motivation messages every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMotivationIndex((prev) => (prev + 1) % motivationMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Home: Loading data for user:', user.id);

      // Load với timeout để tránh treo
      const timeout = (ms: number) => new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), ms)
      );

      let localTodayLog = null;

      try {
        // Load today's pain log với timeout 2s
        const todayLogPromise = getTodayPainLog();
        const todayLog = await Promise.race([todayLogPromise, timeout(2000)]) as any;
        localTodayLog = todayLog?.data || null;
        setTodayPainLog(localTodayLog);
        console.log('Home: Today pain log loaded');
      } catch (err) {
        console.log('Home: Today pain log timeout/error, skipping');
        setTodayPainLog(null);
      }

      try {
        // Load pain history với timeout 2s
        const logsPromise = getPainLogs(7);
        const logs = await Promise.race([logsPromise, timeout(2000)]) as any;
        if (logs?.data) {
          setPainHistory(logs.data);
          console.log('Home: Pain history loaded');
        }
      } catch (err) {
        console.log('Home: Pain history timeout/error, skipping');
        setPainHistory([]);
      }

      try {
        // Load user behavior với timeout 2s
        const behaviorPromise = getUserBehavior(user.id);
        const behavior = await Promise.race([behaviorPromise, timeout(2000)]) as any;
        if (behavior?.data) {
          setStreakDays(behavior.data.streak_days || 0);
          calculateHealthScore(localTodayLog, behavior.data);
          console.log('Home: User behavior loaded');
        } else {
          // Set default values
          setStreakDays(0);
          setHealthScore(50);
        }
      } catch (err) {
        console.log('Home: User behavior timeout/error, using defaults');
        setStreakDays(0);
        setHealthScore(50);
      }

      try {
        const workoutHistoryPromise = getWorkoutHistory(user.id, 30);
        const history = await Promise.race([workoutHistoryPromise, timeout(2000)]) as any;
        setWorkoutHistory(Array.isArray(history?.data) ? history.data : Array.isArray(history) ? history : []);
      } catch (err) {
        console.log('Home: Workout history timeout/error, skipping');
        setWorkoutHistory([]);
      }
    } catch (error) {
      console.error('Load data error:', error);
      // Set default values on error
      setStreakDays(0);
      setHealthScore(50);
    } finally {
      setLoading(false);
      console.log('Home: Data loading complete');
    }
  };

  const loadDailyContent = async () => {
    if (!user) return;

    try {
      console.log('Home: Loading daily content...');
      
      const timeout = (ms: number) => new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), ms)
      );

      try {
        const tipPromise = getHealthTips();
        const tip = await Promise.race([tipPromise, timeout(2000)]);
        const tipText = Array.isArray(tip) && tip.length > 0 ? tip[0].content || tip[0].title || 'Hãy duy trì luyện tập đều đặn mỗi ngày!' : tip;
        setDailyTip(typeof tipText === 'string' ? tipText : 'Hãy duy trì phục hồi đều đặn mỗi ngày!');
      } catch (err) {
        console.log('Home: Daily tip timeout, using default');
        setDailyTip('Hãy duy trì phục hồi đều đặn mỗi ngày!');
      }

      try {
        const nutritionPromise = getNutritionTips(1);
        const nutrition = await Promise.race([nutritionPromise, timeout(2000)]);
        const nutritionText = Array.isArray(nutrition) && nutrition.length > 0 ? nutrition[0].content || nutrition[0].title || 'Uống đủ nước và ăn nhiều rau xanh!' : nutrition;
        setDailyNutrition(typeof nutritionText === 'string' ? nutritionText : 'Uống đủ nước và ăn nhiều rau xanh!');
      } catch (err) {
        console.log('Home: Daily nutrition timeout, using default');
        setDailyNutrition('Uống đủ nước và ăn nhiều rau xanh!');
      }

      console.log('Home: Daily content loaded');
    } catch (error) {
      console.error('Load daily content error:', error);
    }
  };

  const syncProfileIfNeeded = async () => {
    if (!user || user.id === 'guest') return;
    
    try {
      console.log('Home: Syncing profile to database...');
      
      // Lấy email từ user store hoặc AsyncStorage
      let email = (user as any).email;
      
      if (!email) {
        console.log('Home: No email in user store, trying AsyncStorage');
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        email = await AsyncStorage.default.getItem('user_email');
      }
      
      if (!email) {
        console.log('Home: No email found, skipping sync');
        return;
      }
      
      console.log('Home: User email:', email);
      
      // Upsert profile với email
      const { upsertProfileByEmail } = await import('@/services/profileByEmail');
      const result = await upsertProfileByEmail(email, {
        full_name: user.full_name,
        age: user.age,
        occupation: user.occupation,
        pain_areas: user.pain_areas,
        symptoms: user.symptoms,
        surgery_history: user.surgery_history,
        preferred_time: user.preferred_time,
        notifications_enabled: user.notifications_enabled,
        is_pro: user.is_pro || false,
      });
      
      if (result.success) {
        console.log('Home: Profile synced successfully!');
      } else {
        console.error('Home: Profile sync failed:', result.error);
      }
    } catch (error) {
      console.error('Home: Sync profile error:', error);
    }
  };

  const calculateHealthScore = (painLog: any, behavior: any) => {
    if (!painLog) {
      setHealthScore(50);
      return;
    }

    // Công thức theo yeu cau.md:
    // score = ((10 - pain_level) * 0.5 + workout_streak * 0.3 + completion_rate * 0.2) * 10
    
    const painScore = (10 - painLog.pain_level) * 0.5;  // 0-5 điểm
    const streakScore = Math.min(behavior.streak_days, 30) * 0.3;  // 0-9 điểm (cap 30 ngày)
    
    // Completion rate = % bài tập hoàn thành (không bỏ dở)
    // Giả sử có field completed_workouts trong behavior, nếu không thì dùng total_workouts
    const completionRate = behavior.total_workouts > 0 
      ? Math.min(behavior.total_workouts / 30, 1)  // Tỷ lệ hoàn thành (0-1), cap ở 30 bài
      : 0;
    const completionScore = completionRate * 10 * 0.2;  // 0-2 điểm

    const score = Math.round((painScore + streakScore + completionScore) * 10);
    setHealthScore(Math.min(score, 100));
  };

  const handleStartWorkout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!todayPainLog) {
      router.push('/pain-input');
    } else {
      router.push('/(tabs)/exercises');
    }
  };

  const handlePainChartPress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (painHistory.length === 0) return;
    
    // Load 14 ngày để so sánh 2 tuần
    try {
      const { data: last14Days } = await getPainLogs(14);
      
      if (!last14Days || last14Days.length === 0) return;
      
      // Chia thành 2 tuần
      const thisWeek = last14Days.slice(0, 7); // 7 ngày gần nhất
      const lastWeek = last14Days.slice(7, 14); // 7 ngày trước đó
      
      // Tính trung bình mức đau
      const thisWeekAvg = thisWeek.reduce((sum: number, log: any) => sum + log.pain_level, 0) / thisWeek.length;
      const lastWeekAvg = lastWeek.length > 0 
        ? lastWeek.reduce((sum: number, log: any) => sum + log.pain_level, 0) / lastWeek.length 
        : thisWeekAvg;
      
      const diff = lastWeekAvg - thisWeekAvg;
      const diffPercent = lastWeekAvg > 0 ? (diff / lastWeekAvg) * 100 : 0;
      
      setPainAnalysisData({
        thisWeek,
        lastWeek,
        thisWeekAvg: Math.round(thisWeekAvg * 10) / 10,
        lastWeekAvg: Math.round(lastWeekAvg * 10) / 10,
        diff: Math.round(diff * 10) / 10,
        diffPercent: Math.round(diffPercent),
      });
      
      // Phân tích vùng đau và đề xuất thiết bị
      await analyzeDeviceRecommendation(thisWeek);
      
      setShowPainAnalysis(true);
    } catch (error) {
      console.error('Load pain analysis error:', error);
    }
  };

  const analyzeDeviceRecommendation = async (painLogs: any[]) => {
    try {
      // Lấy owned_devices từ profile
      const profile = await api.get('/auth/me');
      
      const ownedDevices = getOwnedDeviceIds(profile?.owned_devices || []);
      const painAreas = profile?.pain_areas || [];
      
      // Phân tích vùng đau từ pain logs
      const areaCount: Record<string, number> = {};
      painLogs.forEach(log => {
        if (log.pain_areas && typeof log.pain_areas === 'object') {
          Object.keys(log.pain_areas).forEach(area => {
            areaCount[area] = (areaCount[area] || 0) + 1;
          });
        }
      });
      
      // Tìm vùng đau nhiều nhất
      const mostPainfulArea = Object.keys(areaCount).reduce((a, b) => 
        areaCount[a] > areaCount[b] ? a : b, Object.keys(areaCount)[0]
      );
      
      if (!mostPainfulArea) {
        setDeviceRecommendation(null);
        return;
      }
      
      // Map vùng đau -> thiết bị
      const deviceMap: Record<string, { device: string; name: string; benefit: number }> = {
        'neck': { device: 'neck_device', name: 'Thiết bị cải thiện cổ', benefit: 35 },
        'shoulder_left': { device: 'shoulder_device', name: 'Thiết bị cải thiện vai', benefit: 30 },
        'shoulder_right': { device: 'shoulder_device', name: 'Thiết bị cải thiện vai', benefit: 30 },
        'upper_back': { device: 'back_device', name: 'Thiết bị cải thiện lưng', benefit: 40 },
        'middle_back': { device: 'back_device', name: 'Thiết bị cải thiện lưng', benefit: 40 },
        'lower_back': { device: 'back_device', name: 'Thiết bị cải thiện lưng', benefit: 40 },
        'arm_left': { device: 'arm_device', name: 'Thiết bị cải thiện tay', benefit: 25 },
        'arm_right': { device: 'arm_device', name: 'Thiết bị cải thiện tay', benefit: 25 },
        'hand_left': { device: 'arm_device', name: 'Thiết bị cải thiện tay', benefit: 25 },
        'hand_right': { device: 'arm_device', name: 'Thiết bị cải thiện tay', benefit: 25 },
        'thigh_left': { device: 'leg_device', name: 'Thiết bị cải thiện chân', benefit: 30 },
        'thigh_right': { device: 'leg_device', name: 'Thiết bị cải thiện chân', benefit: 30 },
        'leg_left': { device: 'leg_device', name: 'Thiết bị cải thiện chân', benefit: 30 },
        'leg_right': { device: 'leg_device', name: 'Thiết bị cải thiện chân', benefit: 30 },
        'foot_left': { device: 'leg_device', name: 'Thiết bị cải thiện chân', benefit: 30 },
        'foot_right': { device: 'leg_device', name: 'Thiết bị cải thiện chân', benefit: 30 },
      };
      
      const recommendation = deviceMap[mostPainfulArea];
      
      // Chỉ đề xuất nếu chưa có thiết bị này
      if (recommendation && !ownedDevices.includes(recommendation.device)) {
        setDeviceRecommendation({
          area: mostPainfulArea,
          device: recommendation.device,
          deviceName: recommendation.name,
          benefit: recommendation.benefit,
          areaName: getAreaName(mostPainfulArea),
        });
      } else {
        setDeviceRecommendation(null);
      }
    } catch (error) {
      console.error('Analyze device recommendation error:', error);
      setDeviceRecommendation(null);
    }
  };

  const getAreaName = (area: string): string => {
    const names: Record<string, string> = {
      'neck': 'cổ',
      'shoulder_left': 'vai trái',
      'shoulder_right': 'vai phải',
      'upper_back': 'lưng trên',
      'middle_back': 'lưng giữa',
      'lower_back': 'lưng dưới',
      'arm_left': 'cánh tay trái',
      'arm_right': 'cánh tay phải',
      'hand_left': 'bàn tay trái',
      'hand_right': 'bàn tay phải',
      'thigh_left': 'đùi trái',
      'thigh_right': 'đùi phải',
      'leg_left': 'cẳng chân trái',
      'leg_right': 'cẳng chân phải',
      'foot_left': 'bàn chân trái',
      'foot_right': 'bàn chân phải',
    };
    return names[area] || area;
  };

  const handleTryDevice = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const websiteUrl = 'https://therahome.vn';
    
    // Open website
    import('expo-linking').then(({ openURL }) => {
      openURL(websiteUrl);
    });
  };

  const loadWaterToday = async () => {
    if (!user || user.id === 'guest') return;
    try {
      const data = await getTodayWater();
      setWaterCups(data.cups ?? 0);
      setWaterGoal(data.goal ?? 8);
    } catch (error) {
      console.error('Load water today error:', error);
    }
  };

  const handleWaterChange = async (delta: number) => {
    try {
      const updated = await incrementWater({ delta, goal: waterGoal });
      setWaterCups(updated.cups);
      setWaterGoal(updated.goal);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Update water error:', error);
      // Graceful fallback: update local state so UX is not blocked
      setWaterCups(prev => Math.max(0, Math.min(waterGoal, prev + delta)));
    }
  };
  const handleOpenWaterTracking = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/water-tracking');
  };

  const scoreTrendData = useMemo(() => {
    const normalizeDate = (value: string | Date) => {
      const date = new Date(value);
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    };

    const painMap = new Map<string, any>();
    painHistory.forEach((log) => {
      painMap.set(normalizeDate(log.date || log.created_at), log);
    });

    const completedLogs = workoutHistory.filter((log) => log?.is_completed);
    const completedDates = completedLogs
      .map((log) => normalizeDate(log.completed_at || log.started_at || log.created_at))
      .sort();

    const completedDateSet = new Set(completedDates);

    const labels: string[] = [];
    const data: number[] = [];
    let lastKnownPainLevel = todayPainLog?.pain_level ?? 5;

    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      const key = normalizeDate(date);

      const painLog = painMap.get(key);
      if (painLog?.pain_level !== undefined) {
        lastKnownPainLevel = painLog.pain_level;
      }

      let streakAtDate = 0;
      const cursor = new Date(date);
      while (completedDateSet.has(normalizeDate(cursor))) {
        streakAtDate += 1;
        cursor.setDate(cursor.getDate() - 1);
      }

      const totalCompletedUntilDate = completedDates.filter((d) => d <= key).length;

      const painScore = (10 - lastKnownPainLevel) * 0.5;
      const streakScore = Math.min(streakAtDate, 30) * 0.3;
      const completionRate = totalCompletedUntilDate > 0 ? Math.min(totalCompletedUntilDate / 30, 1) : 0;
      const completionScore = completionRate * 10 * 0.2;
      const score = Math.min(Math.round((painScore + streakScore + completionScore) * 10), 100);

      labels.push(offset === 0 ? 'Nay' : `${offset}d`);
      data.push(score);
    }

    const normalizedData =
      data.every((value) => value === 50) && healthScore !== 50
        ? [...data.slice(0, -1), healthScore]
        : data;

    const average =
      normalizedData.length > 0
        ? Math.round(normalizedData.reduce((sum, value) => sum + value, 0) / normalizedData.length)
        : 0;
    const highest = normalizedData.length > 0 ? Math.max(...normalizedData) : 0;

    return { labels, data: normalizedData, average, highest };
  }, [painHistory, workoutHistory, todayPainLog, healthScore]);

  const handleHealthScorePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowHealthScoreChart(true);
  };

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${interpolate(scoreProgress.value, [0, 1], [0, 100])}%`,
    };
  });

  const loadingGradient: [string, string] = isDark
    ? ['#0B1220', '#111827']
    : ['#EFF6FF', '#FFFFFF'];
  const screenGradient: [string, string, string] = isDark
    ? ['#0B1220', '#111827', '#1F2937']
    : ['#EFF6FF', '#FFFFFF', '#F9FAFB'];

  if (loading) {
    return (
      <LinearGradient
        colors={loadingGradient}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={screenGradient}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xin chào,</Text>
          <View style={styles.userNameRow}>
            <Text style={styles.userName}>{user?.full_name} </Text>
            <WavingHand textStyle={styles.wavingEmoji} />
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/notifications');
            }}
            style={styles.notificationBellButton}
          >
            <Bell size={22} color={colors.text} />
            {unreadNotificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {streakDays > 0 && (
            <Animated.View entering={FadeInDown.delay(200)}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.streakBadge}
              >
                <Flame size={20} color="#FFF" />
                <Text style={styles.streakText}>{streakDays} ngày</Text>
              </LinearGradient>
            </Animated.View>
          )}
        </View>
      </Animated.View>

      {/* Health Score Card */}
      <Animated.View entering={FadeInDown.delay(300)}>
        <TouchableOpacity activeOpacity={0.9} onPress={handleHealthScorePress}>
          <LinearGradient
            colors={['#5B9BD5', '#4A7FB8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.scoreCard}
          >
            <View style={styles.scoreHeader}>
              <Heart size={24} color="#FFF" />
              <Text style={styles.scoreTitle}>Điểm sức khỏe</Text>
            </View>
            
            <View style={styles.scoreContent}>
              <Animated.Text style={styles.scoreValue}>
                {Math.round(scoreNumber.value)}
              </Animated.Text>
              <Text style={styles.scoreMax}>/100</Text>
            </View>

            <View style={styles.progressBar}>
              <Animated.View style={[styles.progressFill, progressStyle]}>
                <LinearGradient
                  colors={['#10B981', '#34D399']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.progressGradient}
                />
              </Animated.View>
            </View>

            <View style={styles.scoreFooter}>
              <TrendingUp size={16} color="#FFFFFF" />
              <Animated.View
                key={motivationIndex}
                entering={FadeInUp.duration(400)}
                exiting={FadeOutUp.duration(400)}
              >
                <Text style={styles.scoreFooterText}>
                  {healthScore >= 70 ? 'Tuyệt vời!' : motivationMessages[motivationIndex]}
                </Text>
              </Animated.View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Quick Stats */}
      <Animated.View entering={FadeInDown.delay(400)} style={styles.statsContainer}>
        <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.statCard}>
          <Activity size={24} color={colors.primary} />
          <Text style={styles.statValue}>{painHistory.length}</Text>
          <Text style={styles.statLabel}>Ngày theo dõi</Text>
        </BlurView>

        <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.statCard}>
          <Target size={24} color={colors.primary} />
          <Text style={styles.statValue}>{todayPainLog ? todayPainLog.pain_level : '-'}</Text>
          <Text style={styles.statLabel}>Mức đau hôm nay</Text>
        </BlurView>
      </Animated.View>

      {/* Water Tracker */}
      <Animated.View entering={FadeInDown.delay(430)}>
        <WaterTrackerCard
          cups={waterCups}
          goal={waterGoal}
          onDecrease={() => handleWaterChange(-1)}
          onIncrease={() => handleWaterChange(1)}
          onPress={handleOpenWaterTracking}
        />
      </Animated.View>

      {/* Therapy Plans Card */}
      <Animated.View entering={FadeInDown.delay(450)}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/pain-input');
          }}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.plansCard}
          >
            <View style={styles.plansHeader}>
              <ClipboardList size={28} color="#FFF" />
              <View style={styles.plansTextContainer}>
                <Text style={styles.plansTitle}>14 ngày phục hồi chuyên sâu</Text>
              </View>
            </View>
            <Text style={styles.plansDescription}>
              Theo dõi tiến độ phục hồi của bạn
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* CTA Button - Bắt đầu quá trình */}
      <Animated.View entering={FadeInDown.delay(500)}>
        <TouchableOpacity
          activeOpacity={personalizedPlanUnlocked ? 0.85 : 1}
          disabled={!personalizedPlanUnlocked}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push({
              pathname: '/pain-input',
              params: { redirectTo: '/recommendations' }
            });
          }}
        >
          <LinearGradient
            colors={personalizedPlanUnlocked ? ['#5B9BD5', '#4A7FB8'] : ['#A7C4E4', '#8FAFD3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaButton}
          >
            {personalizedPlanUnlocked ? (
              <Target size={24} color="#FFFFFF" strokeWidth={2.5} />
            ) : (
              <Lock size={24} color="#6B7280" strokeWidth={2.2} />
            )}
            <View style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <Text style={personalizedPlanUnlocked ? styles.ctaButtonText : styles.ctaButtonTextDisabled}>
                Cá nhân hoá lộ trình hôm nay
              </Text>
              {!personalizedPlanUnlocked && (
                <Text style={{ fontSize: 11.5, color: '#6B7280', marginTop: 2, fontWeight: '500' }}>
                  Mở khóa vào ngày 15 sau khi hoàn thành ngày 14
                </Text>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Pain Chart - Clickable */}
      {painHistory.length > 0 && (
        <Animated.View entering={FadeInDown.delay(600)}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handlePainChartPress}
          >
            <BlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={styles.chartCard}>
              <View style={styles.cardTitleRow}>
                <BarChart2 size={20} color={colors.primary} />
                <Text style={styles.cardTitle}>Xu hướng đau 7 ngày</Text>
                <Text style={styles.chartHint}>Nhấn để xem chi tiết</Text>
              </View>
              <PainChart painLogs={painHistory} days={7} />
            </BlurView>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Daily Tips */}
      <Animated.View entering={FadeInDown.delay(700)}>
        <LinearGradient
          colors={['#FEF3C7', '#FDE68A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.tipCard}
        >
          <Text style={styles.tipEmoji}>💡</Text>
          <Text style={[styles.tipTitle, { color: '#78350F' }]}>Mẹo hôm nay</Text>
          <Text style={[styles.tipText, { color: '#92400E' }]}>{dailyTip}</Text>
        </LinearGradient>
      </Animated.View>

      {/* Nutrition Tip */}
      <Animated.View entering={FadeInDown.delay(800)}>
        <LinearGradient
          colors={['#D1FAE5', '#A7F3D0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.tipCard}
        >
          <Text style={styles.tipEmoji}>🥗</Text>
          <Text style={[styles.tipTitle, { color: '#064E3B' }]}>Dinh dưỡng hôm nay</Text>
          <Text style={[styles.tipText, { color: '#065F46' }]}>{dailyNutrition}</Text>
        </LinearGradient>
      </Animated.View>

      <View style={{ height: 40 }} />
    </ScrollView>

    {/* Pain Analysis Modal */}
    <Modal
      visible={showPainAnalysis}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowPainAnalysis(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Phân tích xu hướng đau</Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowPainAnalysis(false);
                }}
                style={styles.closeButton}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {painAnalysisData && (
              <>
                {/* So sánh tuần này vs tuần trước */}
                <View style={styles.comparisonCard}>
                  <Text style={styles.comparisonTitle}>So sánh 2 tuần</Text>
                  
                  <View style={styles.comparisonRow}>
                    <View style={styles.weekCard}>
                      <Text style={styles.weekLabel}>Tuần này</Text>
                      <View style={styles.weekValueContainer}>
                        <Text style={styles.weekValue}>{painAnalysisData.thisWeekAvg}</Text>
                        <Text style={styles.weekMax}>/10</Text>
                      </View>
                    </View>

                    <View style={styles.trendIconContainer}>
                      {painAnalysisData.diff > 0 ? (
                        <View style={[styles.trendBadge, { backgroundColor: '#10B981' }]}>
                          <TrendingDown size={24} color="#FFF" />
                        </View>
                      ) : painAnalysisData.diff < 0 ? (
                        <View style={[styles.trendBadge, { backgroundColor: '#EF4444' }]}>
                          <TrendingUp size={24} color="#FFF" />
                        </View>
                      ) : (
                        <View style={[styles.trendBadge, { backgroundColor: '#F59E0B' }]}>
                          <Minus size={24} color="#FFF" />
                        </View>
                      )}
                    </View>

                    <View style={styles.weekCard}>
                      <Text style={styles.weekLabel}>Tuần trước</Text>
                      <View style={styles.weekValueContainer}>
                        <Text style={styles.weekValue}>{painAnalysisData.lastWeekAvg}</Text>
                        <Text style={styles.weekMax}>/10</Text>
                      </View>
                    </View>
                  </View>

                  {/* Diff Badge */}
                  <View style={[
                    styles.diffBadge,
                    { backgroundColor: painAnalysisData.diff > 0 ? '#D1FAE5' : painAnalysisData.diff < 0 ? '#FEE2E2' : '#FEF3C7' }
                  ]}>
                    <Text style={[
                      styles.diffText,
                      { color: painAnalysisData.diff > 0 ? '#059669' : painAnalysisData.diff < 0 ? '#DC2626' : '#D97706' }
                    ]}>
                      {painAnalysisData.diff > 0 ? 'Giảm' : painAnalysisData.diff < 0 ? 'Tăng' : 'Không đổi'} {Math.abs(painAnalysisData.diffPercent)}%
                    </Text>
                  </View>
                </View>

                {/* Biểu đồ 7 ngày gần nhất */}
                {painAnalysisData.thisWeek.length > 0 && (
                  <View style={styles.chartSection}>
                    <Text style={styles.sectionTitle}>7 ngày gần nhất</Text>
                    <LineChart
                      data={{
                        labels: painAnalysisData.thisWeek.map((log: any) => {
                          const date = new Date(log.date);
                          return `${date.getDate()}/${date.getMonth() + 1}`;
                        }).reverse(),
                        datasets: [{
                          data: painAnalysisData.thisWeek.map((log: any) => log.pain_level).reverse(),
                        }],
                      }}
                      width={width - 80}
                      height={220}
                      chartConfig={{
                        backgroundColor: colors.surface,
                        backgroundGradientFrom: colors.surface,
                        backgroundGradientTo: colors.surface,
                        decimalPlaces: 1,
                        color: (opacity = 1) =>
                          isDark ? `rgba(125, 179, 224, ${opacity})` : `rgba(91, 155, 213, ${opacity})`,
                        labelColor: (opacity = 1) =>
                          isDark ? `rgba(255, 255, 255, ${opacity * 0.7})` : `rgba(0, 0, 0, ${opacity * 0.6})`,
                        style: {
                          borderRadius: 16,
                        },
                        propsForDots: {
                          r: '6',
                          strokeWidth: '2',
                          stroke: colors.primary,
                        },
                      }}
                      bezier
                      style={styles.lineChart}
                    />
                  </View>
                )}

                {/* Nhận xét */}
                <View style={styles.insightCard}>
                  <Text style={styles.insightTitle}>Nhận xét</Text>
                  <Text style={styles.insightText}>
                    {painAnalysisData.diff > 0.5
                      ? `Tuyệt vời! Mức đau của bạn đã giảm ${Math.abs(painAnalysisData.diffPercent)}% so với tuần trước. Hãy tiếp tục duy trì luyện tập đều đặn!`
                      : painAnalysisData.diff < -0.5
                      ? `Mức đau tăng ${Math.abs(painAnalysisData.diffPercent)}% so với tuần trước. Hãy nghỉ ngơi hợp lý và tham khảo ý kiến bác sĩ nếu cần.`
                      : 'Mức đau ổn định. Hãy tiếp tục theo dõi và duy trì thói quen luyện tập tốt!'}
                  </Text>
                </View>

                {/* Device Recommendation */}
                {deviceRecommendation && (
                  <View style={styles.deviceCard}>
                    <LinearGradient
                      colors={['#8B5CF6', '#7C3AED']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.deviceGradient}
                    >
                      <Text style={styles.deviceTitle}>Gợi ý thiết bị</Text>
                      <Text style={styles.deviceSubtitle}>
                        Bạn đang đau vùng {deviceRecommendation.areaName} nhiều nhất
                      </Text>
                      
                      <View style={styles.deviceBenefit}>
                        <Text style={styles.deviceBenefitText}>
                          Tuần tới bạn sẽ giảm đau thêm{' '}
                          <Text style={styles.deviceBenefitNumber}>
                            {deviceRecommendation.benefit}%
                          </Text>
                          {'\n'}nếu sử dụng thêm {deviceRecommendation.deviceName}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.tryButton}
                        onPress={handleTryDevice}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.tryButtonText}>Thử ngay</Text>
                      </TouchableOpacity>
                    </LinearGradient>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>

    <Modal
      visible={showHealthScoreChart}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowHealthScoreChart(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Biểu đồ điểm sức khỏe</Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowHealthScoreChart(false);
                }}
                style={styles.closeButton}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.comparisonCard}>
              <Text style={styles.comparisonTitle}>Tổng quan 7 ngày</Text>
              <View style={styles.comparisonRow}>
                <View style={styles.weekCard}>
                  <Text style={styles.weekLabel}>Hiện tại</Text>
                  <View style={styles.weekValueContainer}>
                    <Text style={styles.weekValue}>{healthScore}</Text>
                    <Text style={styles.weekMax}>/100</Text>
                  </View>
                </View>

                <View style={styles.trendIconContainer}>
                  <View style={[styles.trendBadge, { backgroundColor: '#60A5FA' }]}>
                    <Heart size={22} color="#FFF" />
                  </View>
                </View>

                <View style={styles.weekCard}>
                  <Text style={styles.weekLabel}>Cao nhất</Text>
                  <View style={styles.weekValueContainer}>
                    <Text style={styles.weekValue}>{scoreTrendData.highest}</Text>
                    <Text style={styles.weekMax}>/100</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.diffBadge, { backgroundColor: isDark ? '#1E3A5F' : '#DBEAFE' }]}>
                <Text style={[styles.diffText, { color: isDark ? '#93C5FD' : '#2563EB' }]}>
                  Trung bình 7 ngày: {scoreTrendData.average}/100
                </Text>
              </View>
            </View>

            <View style={styles.chartSection}>
              <Text style={styles.sectionTitle}>Xu hướng điểm sức khỏe</Text>
              <LineChart
                data={{
                  labels: scoreTrendData.labels,
                  datasets: [
                    {
                      data: scoreTrendData.data,
                      color: (opacity = 1) =>
                        isDark ? `rgba(125, 179, 224, ${opacity})` : `rgba(91, 155, 213, ${opacity})`,
                      strokeWidth: 3,
                    },
                  ],
                }}
                width={width - 80}
                height={240}
                yAxisSuffix=""
                fromZero
                yLabelsOffset={8}
                chartConfig={{
                  backgroundColor: colors.surface,
                  backgroundGradientFrom: colors.surface,
                  backgroundGradientTo: colors.surface,
                  decimalPlaces: 0,
                  color: (opacity = 1) =>
                    isDark ? `rgba(125, 179, 224, ${opacity})` : `rgba(91, 155, 213, ${opacity})`,
                  labelColor: (opacity = 1) =>
                    isDark ? `rgba(255, 255, 255, ${opacity * 0.72})` : `rgba(0, 0, 0, ${opacity * 0.6})`,
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: colors.primary,
                  },
                  propsForBackgroundLines: {
                    stroke: isDark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(148, 163, 184, 0.25)',
                  },
                }}
                bezier
                style={styles.lineChart}
              />
            </View>

            <View style={styles.insightCard}>
              <Text style={styles.insightTitle}>Cách tính điểm</Text>
              <Text style={styles.insightText}>
                Điểm sức khỏe được suy ra từ mức đau, streak tập luyện và tỷ lệ hoàn thành bài tập. Đau giảm, tập đều và hoàn thành tốt thì đường biểu đồ sẽ đi lên.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
    </LinearGradient>
  );
}

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  greeting: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  wavingEmoji: {
    fontSize: 32,
  },
  notificationBellButton: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOpacity: isDark ? 0.12 : 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  notificationBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  streakText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scoreCard: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  scoreContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scoreMax: {
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
  },
  progressGradient: {
    flex: 1,
  },
  scoreFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreFooterText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(255, 255, 255, 0.5)',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  ctaButton: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 1,
  },
  ctaButtonTextDisabled: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#6B7280',
    letterSpacing: 0.4,
  },
  chartCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(255, 255, 255, 0.5)',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  chartHint: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  tipCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  tipEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  plansCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  plansHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  plansTextContainer: {
    flex: 1,
  },
  plansTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  plansSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  plansDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  comparisonCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weekCard: {
    flex: 1,
    alignItems: 'center',
  },
  weekLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  weekValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  weekValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
  },
  weekMax: {
    fontSize: 18,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  trendIconContainer: {
    marginHorizontal: 16,
  },
  trendBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  diffBadge: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  diffText: {
    fontSize: 15,
    fontWeight: '600',
  },
  chartSection: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  lineChart: {
    borderRadius: 16,
  },
  insightCard: {
    backgroundColor: isDark ? '#1E293B' : '#EFF6FF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#BFDBFE',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  deviceCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 20,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  deviceGradient: {
    padding: 24,
  },
  deviceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  deviceSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 20,
  },
  deviceBenefit: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  deviceBenefitText: {
    fontSize: 15,
    color: '#FFF',
    lineHeight: 24,
    textAlign: 'center',
  },
  deviceBenefitNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FDE68A',
  },
  tryButton: {
    backgroundColor: '#FFF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  tryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
});
