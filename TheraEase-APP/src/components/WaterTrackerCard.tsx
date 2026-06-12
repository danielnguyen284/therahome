import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { Droplets, Plus } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';

interface WaterTrackerCardProps {
  cups: number;
  goal: number;
  onDecrease: () => void;
  onIncrease: () => void;
  onPress: () => void;
}

export default function WaterTrackerCard({
  cups,
  goal,
  onDecrease,
  onIncrease,
  onPress,
}: WaterTrackerCardProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const safeGoal = Math.max(goal, 1);
  const progressRatio = Math.min(Math.max(cups / safeGoal, 0), 1);
  const radius = 54;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Droplets size={18} color="#38BDF8" />
          <Text style={styles.title}>Uống nước</Text>
        </View>
        <Text style={styles.goalText}>Mục tiêu {goal} cốc</Text>
      </View>

      <View style={styles.mainRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionDark]}
          onPress={onDecrease}
          activeOpacity={0.85}
        >
          <Text style={styles.actionText}>-</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.ringArea} activeOpacity={0.9} onPress={onPress}>
          <View style={styles.ringWrap}>
            <Svg width={150} height={150} viewBox="0 0 150 150">
              <Circle
                cx="75"
                cy="75"
                r={radius}
                stroke={isDark ? 'rgba(148, 163, 184, 0.22)' : '#D1E5F5'}
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
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 75 75)"
              />
            </Svg>
            <View style={styles.ringCenter}>
              <Droplets size={16} color="#7DD3FC" />
              <Text style={styles.count}>{cups}</Text>
              <Text style={styles.unit}>/{goal} cốc</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionBlue]}
          onPress={onIncrease}
          activeOpacity={0.85}
        >
          <Plus size={18} color="#FFFFFF" strokeWidth={2.6} />
        </TouchableOpacity>
      </View>

      <View style={styles.noteContainer}>
        <Text style={styles.noteText}>* Đừng quên nước rất tốt cho đĩa đệm</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    card: {
      borderRadius: 24,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(148, 163, 184, 0.2)' : '#DBEAFE',
      backgroundColor: isDark ? '#1A2234' : '#FFFFFF',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    titleWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
    },
    goalText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    mainRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    ringArea: {
      paddingVertical: 4,
      paddingHorizontal: 6,
    },
    ringWrap: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    ringCenter: {
      position: 'absolute',
      alignItems: 'center',
    },
    count: {
      fontSize: 56,
      fontWeight: '700',
      color: colors.text,
      lineHeight: 62,
    },
    unit: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: -2,
    },
    actionButton: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionDark: {
      backgroundColor: isDark ? '#26344A' : '#E5E7EB',
    },
    actionBlue: {
      backgroundColor: '#0EA5E9',
    },
    actionText: {
      fontSize: 34,
      lineHeight: 36,
      color: isDark ? '#94A3B8' : '#4B5563',
      fontWeight: '400',
    },
    noteContainer: {
      marginTop: 16,
      alignItems: 'center',
    },
    noteText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
  });
