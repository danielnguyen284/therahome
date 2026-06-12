import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Appbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Activity, TrendingUp, Award, Flame } from 'lucide-react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { colors } from '@/utils/theme';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/services/api';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function StatisticsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalDays: 0,
    currentStreak: 0,
    painLogs: 0,
    avgPainLevel: 0,
  });
  const [painChartData, setPainChartData] = useState<any>(null);
  const [workoutChartData, setWorkoutChartData] = useState<any>(null);
  const [streakCalendar, setStreakCalendar] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    if (!user?.id) return;

    try {
      // Get workout history count
      const workouts = await api.get(`/exercises/workout-history/${user.id}?limit=1000`);

      // Get pain logs count and average
      const painLogs = await api.get('/pain-logs');

      // Calculate unique workout days
      const uniqueDays = new Set(
        workouts?.map((w: any) => new Date(w.completed_at || w.created_at).toDateString()) || []
      );

      // Calculate average pain level
      const avgPain = painLogs?.length
        ? painLogs.reduce((sum: number, log: any) => sum + log.pain_level, 0) / painLogs.length
        : 0;

      // Calculate current streak
      const streak = calculateStreak(workouts || []);

      setStats({
        totalWorkouts: workouts?.length || 0,
        totalDays: uniqueDays.size,
        currentStreak: streak,
        painLogs: painLogs?.length || 0,
        avgPainLevel: Math.round(avgPain * 10) / 10,
      });

      // Prepare chart data for last 7 days
      preparePainChartData(painLogs || []);
      prepareWorkoutChartData(workouts || []);
      prepareStreakCalendar(workouts || []);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const preparePainChartData = (painLogs: any[]) => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const painByDay = last7Days.map(day => {
      const logsForDay = painLogs.filter((log: any) => 
        log.created_at.startsWith(day)
      );
      if (logsForDay.length === 0) return 0;
      return logsForDay.reduce((sum: number, log: any) => sum + log.pain_level, 0) / logsForDay.length;
    });

    setPainChartData({
      labels: last7Days.map(d => {
        const date = new Date(d);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      }),
      datasets: [{
        data: painByDay.length > 0 ? painByDay : [0],
      }],
    });
  };

  const prepareWorkoutChartData = (workouts: any[]) => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const workoutsByDay = last7Days.map(day => {
      return workouts.filter((w: any) => (w.completed_at || w.created_at).startsWith(day)).length;
    });

    setWorkoutChartData({
      labels: last7Days.map(d => {
        const date = new Date(d);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      }),
      datasets: [{
        data: workoutsByDay.length > 0 ? workoutsByDay : [0],
      }],
    });
  };

  const calculateStreak = (workouts: any[]) => {
    if (!workouts.length) return 0;

    const sortedDates = workouts
      .map((w: any) => new Date(w.completed_at || w.created_at).toDateString())
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const uniqueDates = [...new Set(sortedDates)];
    let streak = 0;

    for (let i = 0; i < uniqueDates.length; i++) {
      const date = new Date(uniqueDates[i]);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);

      if (date.toDateString() === expectedDate.toDateString()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const prepareStreakCalendar = (workouts: any[]) => {
    const calendar: { [key: string]: boolean } = {};
    
    // Get last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Check if there's a workout on this day
      const hasWorkout = workouts.some((w: any) => (w.completed_at || w.created_at).startsWith(dateStr));
      calendar[dateStr] = hasWorkout;
    }
    
    setStreakCalendar(calendar);
  };

  const renderStreakCalendar = () => {
    const days = Object.keys(streakCalendar).sort().reverse();
    const weeks: string[][] = [];
    
    // Group days into weeks (7 days each)
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    
    return (
      <View style={styles.calendarContainer}>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.calendarWeek}>
            {week.map((day) => {
              const date = new Date(day);
              const hasWorkout = streakCalendar[day];
              const isToday = day === new Date().toISOString().split('T')[0];
              
              return (
                <View
                  key={day}
                  style={[
                    styles.calendarDay,
                    hasWorkout && styles.calendarDayActive,
                    isToday && styles.calendarDayToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.calendarDayText,
                      hasWorkout && styles.calendarDayTextActive,
                      isToday && styles.calendarDayTextToday,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Thống kê" />
      </Appbar.Header>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Animated.View entering={FadeInDown.delay(100)}>
          <Text style={styles.sectionTitle}>Tổng quan</Text>
        </Animated.View>

        {/* Main Stats Grid */}
        <View style={styles.statsGrid}>
          <Animated.View entering={FadeInDown.delay(200)}>
            <LinearGradient
              colors={['#5B9BD5', '#4A7FB8']}
              style={styles.statCard}
            >
              <View style={styles.statIcon}>
                <Activity size={28} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
              <Text style={styles.statLabel}>Bài tập hoàn thành</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300)}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.statCard}
            >
              <View style={styles.statIcon}>
                <Calendar size={28} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Text style={styles.statValue}>{stats.totalDays}</Text>
              <Text style={styles.statLabel}>Ngày cải thiện</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400)}>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.statCard}
            >
              <View style={styles.statIcon}>
                <Flame size={28} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Text style={styles.statValue}>{stats.currentStreak}</Text>
              <Text style={styles.statLabel}>Chuỗi ngày liên tiếp</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500)}>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.statCard}
            >
              <View style={styles.statIcon}>
                <TrendingUp size={28} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Text style={styles.statValue}>{stats.avgPainLevel}/10</Text>
              <Text style={styles.statLabel}>Mức đau trung bình</Text>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Pain Chart */}
        {painChartData && stats.painLogs > 0 && (
          <Animated.View entering={FadeInDown.delay(600)}>
            <Text style={styles.sectionTitle}>Biểu đồ mức độ đau (7 ngày)</Text>
            <View style={styles.chartCard}>
              <LineChart
                data={painChartData}
                width={width - 60}
                height={220}
                chartConfig={{
                  backgroundColor: '#FFFFFF',
                  backgroundGradientFrom: '#FFFFFF',
                  backgroundGradientTo: '#F9FAFB',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.6})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: '#8B5CF6',
                  },
                }}
                bezier
                style={styles.chart}
              />
            </View>
          </Animated.View>
        )}

        {/* Workout Chart */}
        {workoutChartData && stats.totalWorkouts > 0 && (
          <Animated.View entering={FadeInDown.delay(650)}>
            <Text style={styles.sectionTitle}>Bài tập hoàn thành (7 ngày)</Text>
            <View style={styles.chartCard}>
              <BarChart
                data={workoutChartData}
                width={width - 60}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: '#FFFFFF',
                  backgroundGradientFrom: '#FFFFFF',
                  backgroundGradientTo: '#F9FAFB',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(91, 155, 213, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.6})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: '',
                  },
                }}
                style={styles.chart}
              />
            </View>
          </Animated.View>
        )}

        {/* Pain Logs Section */}
        <Animated.View entering={FadeInDown.delay(700)}>
          <Text style={styles.sectionTitle}>Nhật ký đau</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tổng số lần ghi nhận</Text>
              <Text style={styles.infoValue}>{stats.painLogs}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mức đau trung bình</Text>
              <Text style={[styles.infoValue, { color: getPainColor(stats.avgPainLevel) }]}>
                {stats.avgPainLevel}/10
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Achievements Section */}
        <Animated.View entering={FadeInDown.delay(750)}>
          <Text style={styles.sectionTitle}>Thành tích</Text>
          <View style={styles.achievementsContainer}>
            {stats.totalWorkouts >= 1 && (
              <View style={styles.achievementCard}>
                <Award size={32} color="#FFD700" fill="#FFD700" />
                <Text style={styles.achievementTitle}>Bước đầu tiên</Text>
                <Text style={styles.achievementDesc}>Hoàn thành bài tập đầu tiên</Text>
              </View>
            )}
            {stats.totalDays >= 7 && (
              <View style={styles.achievementCard}>
                <Award size={32} color="#10B981" fill="#10B981" />
                <Text style={styles.achievementTitle}>Kiên trì 1 tuần</Text>
                <Text style={styles.achievementDesc}>Cải thiện 7 ngày</Text>
              </View>
            )}
            {stats.currentStreak >= 3 && (
              <View style={styles.achievementCard}>
                <Award size={32} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.achievementTitle}>Chuỗi 3 ngày</Text>
                <Text style={styles.achievementDesc}>Tập liên tiếp 3 ngày</Text>
              </View>
            )}
            {stats.totalWorkouts >= 10 && (
              <View style={styles.achievementCard}>
                <Award size={32} color="#8B5CF6" fill="#8B5CF6" />
                <Text style={styles.achievementTitle}>Chuyên cần</Text>
                <Text style={styles.achievementDesc}>Hoàn thành 10 bài tập</Text>
              </View>
            )}
            {stats.currentStreak >= 7 && (
              <View style={styles.achievementCard}>
                <Award size={32} color="#EF4444" fill="#EF4444" />
                <Text style={styles.achievementTitle}>Streak Master</Text>
                <Text style={styles.achievementDesc}>Chuỗi 7 ngày liên tiếp</Text>
              </View>
            )}
            {stats.totalDays >= 30 && (
              <View style={styles.achievementCard}>
                <Award size={32} color="#06B6D4" fill="#06B6D4" />
                <Text style={styles.achievementTitle}>Tháng đầu tiên</Text>
                <Text style={styles.achievementDesc}>Cải thiện 30 ngày</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Streak Calendar */}
        {stats.totalWorkouts > 0 && (
          <Animated.View entering={FadeInDown.delay(800)}>
            <Text style={styles.sectionTitle}>Lịch cải thiện (30 ngày)</Text>
            <View style={styles.calendarCard}>
              <View style={styles.calendarLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.legendText}>Đã tập</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.border }]} />
                  <Text style={styles.legendText}>Chưa tập</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#5B9BD5', borderWidth: 2, borderColor: '#5B9BD5' }]} />
                  <Text style={styles.legendText}>Hôm nay</Text>
                </View>
              </View>
              {renderStreakCalendar()}
            </View>
          </Animated.View>
        )}

        {stats.totalWorkouts === 0 && (
          <Animated.View entering={FadeInDown.delay(800)} style={styles.emptyState}>
            <Activity size={64} color={colors.textSecondary} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Chưa có dữ liệu</Text>
            <Text style={styles.emptyDesc}>
              Bắt đầu luyện tập để xem thống kê của bạn
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getPainColor = (level: number) => {
  if (level <= 3) return '#10B981';
  if (level <= 6) return '#F59E0B';
  return '#EF4444';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 0,
  },
  header: {
    backgroundColor: colors.background,
    elevation: 0,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: (width - 52) / 2,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  statIcon: {
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  achievementsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  achievementCard: {
    width: (width - 52) / 2,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
  achievementDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  calendarCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  calendarContainer: {
    gap: 8,
  },
  calendarWeek: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: colors.border,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayActive: {
    backgroundColor: '#10B981',
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: '#5B9BD5',
  },
  calendarDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  calendarDayTextActive: {
    color: '#FFFFFF',
  },
  calendarDayTextToday: {
    color: '#5B9BD5',
    fontWeight: 'bold',
  },
});
