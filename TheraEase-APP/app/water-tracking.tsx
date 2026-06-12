import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ArrowLeft, Droplets, MoreHorizontal, Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import {
  getLocalDateKey,
  getTodayWater,
  getWeekWater,
  incrementWater,
  WaterWeekDay,
} from '@/services/water';

const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const toDate = (dateKey: string) => new Date(`${dateKey}T00:00:00`);
const toMonthText = (dateKey: string) => {
  const d = toDate(dateKey);
  return `tháng ${d.getMonth() + 1} ${d.getFullYear()}`;
};
const toWeekRangeText = (start: string, end: string) => {
  const s = toDate(start);
  const e = toDate(end);
  return `thg ${s.getMonth() + 1} ${String(s.getDate()).padStart(2, '0')} - thg ${
    e.getMonth() + 1
  } ${String(e.getDate()).padStart(2, '0')}`;
};
const toWeekLabel = (dateKey: string) => WEEKDAY_LABELS[toDate(dateKey).getDay()];
const calcAverage = (days: WaterWeekDay[]) =>
  days.length ? Number((days.reduce((sum, item) => sum + item.cups, 0) / days.length).toFixed(1)) : 0;

export default function WaterTrackingScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState(8);
  const [cups, setCups] = useState(0);
  const [todayDate, setTodayDate] = useState(getLocalDateKey());
  const [weekDays, setWeekDays] = useState<WaterWeekDay[]>([]);
  const [weekRange, setWeekRange] = useState<{ start: string; end: string } | null>(null);
  const average = useMemo(() => calcAverage(weekDays), [weekDays]);

  const progress = cups / goal;
  const radius = 54;
  const strokeWidth = 12;
  const circleLength = 2 * Math.PI * radius;
  const strokeDashoffset = circleLength * (1 - progress);

  useEffect(() => {
    loadWaterData();
  }, []);

  const loadWaterData = async () => {
    try {
      setLoading(true);
      const [today, week] = await Promise.all([getTodayWater(), getWeekWater()]);
      setTodayDate(today.date);
      setCups(today.cups);
      setGoal(today.goal);
      setWeekDays(week.days || []);
      setWeekRange(week.range || null);
    } catch (error) {
      console.error('Load water tracking error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = async (delta: number) => {
    try {
      const updated = await incrementWater({ delta, goal });
      setCups(updated.cups);
      setGoal(updated.goal);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      setWeekDays(prev => {
        if (!prev.length) return prev;
        const next = prev.map((item) =>
          item.date === updated.date ? { ...item, cups: updated.cups, goal: updated.goal } : item
        );
        return next;
      });
    } catch (error) {
      console.error('Change water cups error:', error);
      setCups(prev => clamp(prev + delta, 0, goal));
    }
  };

  const monthText = toMonthText(todayDate);
  const weekRangeText = weekRange ? toWeekRangeText(weekRange.start, weekRange.end) : '';

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient colors={['#0E1422', '#111827']} style={[styles.container, styles.loadingWrap]}>
          <ActivityIndicator size="large" color="#38BDF8" />
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#0E1422', '#111827']} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()} activeOpacity={0.8}>
            <ArrowLeft size={22} color="#E5E7EB" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Theo Dõi Uống Nước</Text>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.8}>
            <MoreHorizontal size={22} color="#E5E7EB" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Hôm Nay</Text>

        <View style={styles.todayCard}>
          <TouchableOpacity
            style={[styles.controlButton, styles.controlSecondary]}
            onPress={() => handleChange(-1)}
            activeOpacity={0.85}
          >
            <Text style={styles.controlMinus}>-</Text>
          </TouchableOpacity>

          <View style={styles.ringWrap}>
            <Svg width={150} height={150} viewBox="0 0 150 150">
              <Circle
                cx="75"
                cy="75"
                r={radius}
                stroke="rgba(148, 163, 184, 0.2)"
                strokeWidth={strokeWidth}
                fill="none"
              />
              <Circle
                cx="75"
                cy="75"
                r={radius}
                stroke="#38BDF8"
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circleLength}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 75 75)"
              />
            </Svg>
            <View style={styles.ringCenter}>
              <Droplets size={18} color="#7DD3FC" />
              <Text style={styles.ringValue}>{cups}</Text>
              <Text style={styles.ringUnit}>/{goal} cốc</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.controlButton, styles.controlPrimary]}
            onPress={() => handleChange(1)}
            activeOpacity={0.85}
          >
            <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, styles.monthTitle]}>{monthText}</Text>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.weekRange}>{weekRangeText || '-'}</Text>
              <Text style={styles.yearText}>{toDate(todayDate).getFullYear()}</Text>
            </View>
            <View style={styles.avgWrap}>
              <Text style={styles.avgValue}>{average.toFixed(1)}</Text>
              <Text style={styles.avgLabel}>Trung bình (cốc)</Text>
            </View>
          </View>

          <View style={styles.barsRow}>
            {weekDays.map((item) => {
              const height = clamp(item.cups * 18, 10, 64);
              const isToday = item.date === todayDate;
              return (
                <View key={item.date} style={styles.barItem}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height },
                        isToday ? styles.barFillActive : undefined,
                      ]}
                    />
                  </View>
                  {isToday && <Text style={styles.todayValue}>{item.cups}</Text>}
                  <Text style={styles.barLabel}>{toWeekLabel(item.date)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E1422',
  },
  loadingWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#F3F4F6',
    fontSize: 22,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#F3F4F6',
    fontSize: 30,
    fontWeight: '700',
    marginTop: 18,
    marginHorizontal: 20,
  },
  todayCard: {
    marginTop: 14,
    marginHorizontal: 20,
    borderRadius: 24,
    backgroundColor: '#1A2234',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    paddingVertical: 24,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlPrimary: {
    backgroundColor: '#0EA5E9',
  },
  controlSecondary: {
    backgroundColor: '#273447',
  },
  controlMinus: {
    color: '#94A3B8',
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '400',
  },
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  ringValue: {
    color: '#F3F4F6',
    fontSize: 44,
    fontWeight: '700',
    marginTop: 2,
  },
  ringUnit: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: '500',
  },
  monthTitle: {
    marginTop: 24,
  },
  chartCard: {
    marginTop: 14,
    marginHorizontal: 20,
    borderRadius: 24,
    backgroundColor: '#1A2234',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
    padding: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  weekRange: {
    color: '#E5E7EB',
    fontSize: 18,
    fontWeight: '600',
  },
  yearText: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 4,
  },
  avgWrap: {
    alignItems: 'flex-end',
  },
  avgValue: {
    color: '#F3F4F6',
    fontSize: 26,
    fontWeight: '700',
  },
  avgLabel: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 2,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  barItem: {
    alignItems: 'center',
    width: 34,
  },
  barTrack: {
    width: 10,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#253145',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: 10,
    borderRadius: 8,
    backgroundColor: '#334155',
    minHeight: 8,
  },
  barFillActive: {
    backgroundColor: '#38BDF8',
  },
  todayValue: {
    color: '#F3F4F6',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  barLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});
