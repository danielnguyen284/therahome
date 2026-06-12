import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { colors } from '@/utils/theme';
import type { PainLog } from '@/types';
import { format } from 'date-fns';

interface PainChartProps {
  painLogs: PainLog[];
  days?: 7 | 30;
}

export default function PainChart({ painLogs, days = 7 }: PainChartProps) {
  const screenWidth = Dimensions.get('window').width;

  const prepareChartData = () => {
    if (painLogs.length === 0) {
      return {
        labels: [''],
        datasets: [{ data: [0] }],
      };
    }

    const labels = painLogs
      .slice(0, days)
      .reverse()
      .map(log => format(new Date(log.date), 'dd/MM'));

    const data = painLogs
      .slice(0, days)
      .reverse()
      .map(log => log.pain_level);

    return {
      labels,
      datasets: [
        {
          data,
          color: (opacity = 1) => `rgba(239, 83, 80, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    };
  };

  const chartData = prepareChartData();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mức độ đau ({days} ngày)</Text>
      
      <LineChart
        data={chartData}
        width={screenWidth - 32}
        height={220}
        chartConfig={{
          backgroundColor: colors.surface,
          backgroundGradientFrom: colors.surface,
          backgroundGradientTo: colors.surface,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 137, 123, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(117, 117, 117, ${opacity})`,
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
        style={styles.chart}
        fromZero
        segments={5}
      />

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
          <Text style={styles.legendText}>Mức đau</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
