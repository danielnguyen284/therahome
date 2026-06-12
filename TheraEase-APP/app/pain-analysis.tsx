import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, TrendingDown, TrendingUp, Minus, Target, Zap } from 'lucide-react-native';
import { LineChart } from 'react-native-chart-kit';
import { useAuthStore } from '@/stores/authStore';
import { getPainLogs } from '@/services/painLogs';
import { colors } from '@/utils/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { usePainStore } from '@/stores/painStore';
import type { PainLog } from '@/types';

const { width } = Dimensions.get('window');

export default function PainAnalysisScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ painArea?: string; painAreaLabel?: string; redirectTo?: string }>();
  const { user } = useAuthStore();
  const { todayPainLog, setTodayPainLog, setPainHistory } = usePainStore();
  const [loading, setLoading] = useState(true);
  const [todayPain, setTodayPain] = useState<PainLog | null>(todayPainLog);
  const [yesterdayPain, setYesterdayPain] = useState<PainLog | null>(null);
  const [trendLogs, setTrendLogs] = useState<PainLog[]>([]);
  const [aiInsight, setAiInsight] = useState('');

  useEffect(() => {
    loadPainComparison();
  }, []);

  const loadPainComparison = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const logs = await getPainLogs(7);
      const normalizedLogs = Array.isArray(logs) ? logs : [];
      setTrendLogs(normalizedLogs);
      setPainHistory(normalizedLogs);

      if (normalizedLogs.length > 0) {
        setTodayPain(normalizedLogs[0]);
        setTodayPainLog(normalizedLogs[0]);
        setYesterdayPain(normalizedLogs.length > 1 ? normalizedLogs[1] : null);
      } else {
        setTodayPain(null);
        setYesterdayPain(null);
      }

      generateInsight(normalizedLogs);
    } catch (error) {
      console.error('Load pain comparison error:', error);
      setAiInsight('Chưa thể phân tích tình trạng lúc này. Vui lòng thử lại sau ít phút.');
    } finally {
      setLoading(false);
    }
  };

  const generateInsight = async (logs: any[] | null) => {
    if (!logs || logs.length === 0) {
      setAiInsight('Hãy tiếp tục theo dõi tình trạng đau để nhận được phân tích chính xác hơn.');
      return;
    }

    const today = logs[0];
    const yesterday = logs.length > 1 ? logs[1] : null;
    const oldest = logs[logs.length - 1];
    const weeklyDiff =
      oldest && typeof oldest.pain_level === 'number'
        ? Number(today.pain_level || 0) - Number(oldest.pain_level || 0)
        : 0;

    const weeklyTrendText =
      weeklyDiff <= -1
        ? 'và trong 7 ngày gần đây cũng có sự giảm dần'
        : weeklyDiff >= 1
          ? 'và trong 7 ngày gần đây có xu hướng tăng lên'
          : 'và trong 7 ngày gần đây nhìn chung khá ổn định';

    if (!yesterday) {
      setAiInsight(
        `Mức đau của bạn hiện ở mức ${today.pain_level}/10 hôm nay, ${weeklyTrendText}. ` +
        'Điều này cho thấy cơ thể bạn đang trong giai đoạn cần được theo dõi đều đặn hơn để đánh giá chính xác tiến triển. ' +
        'Tôi khuyến khích bạn tiếp tục duy trì việc ghi nhận mức đau mỗi ngày, kết hợp nghỉ ngơi hợp lý và luyện tập nhẹ nhàng để cải thiện sức khỏe tổng thể.'
      );
      return;
    }

    const diff = Number(today.pain_level || 0) - Number(yesterday.pain_level || 0);

    if (diff < 0) {
      setAiInsight(
        `Xu hướng đau của bạn đang giảm xuống rõ rệt, từ mức ${yesterday.pain_level}/10 hôm qua xuống còn ${today.pain_level}/10 hôm nay, ` +
        `${weeklyTrendText}. Điều này cho thấy cơ thể bạn đang có những cải thiện tích cực, và bạn nên tiếp tục duy trì các hoạt động và phương pháp điều trị đã áp dụng. ` +
        'Tôi khuyến khích bạn tiếp tục chăm sóc cơ thể đúng cách, đồng thời duy trì lối sống lành mạnh để giữ sự giảm đau và cải thiện sức khỏe tổng thể.'
      );
      return;
    }

    if (diff > 0) {
      setAiInsight(
        `Xu hướng đau của bạn đang tăng lên, từ mức ${yesterday.pain_level}/10 hôm qua lên ${today.pain_level}/10 hôm nay, ` +
        `${weeklyTrendText}. Điều này cho thấy cơ thể bạn có thể đang chịu thêm áp lực hoặc chưa phục hồi tốt như kỳ vọng, và bạn nên điều chỉnh lại cường độ sinh hoạt cũng như luyện tập. ` +
        'Tôi khuyến khích bạn chú ý nghỉ ngơi nhiều hơn, theo dõi kỹ các vùng đau và duy trì các phương pháp chăm sóc phù hợp để ổn định lại tình trạng sức khỏe tổng thể.'
      );
      return;
    }

    setAiInsight(
      `Xu hướng đau của bạn hiện đang giữ nguyên, ở mức ${yesterday.pain_level}/10 hôm qua và ${today.pain_level}/10 hôm nay, ` +
      `${weeklyTrendText}. Điều này cho thấy tình trạng của cơ thể bạn hiện khá ổn định, nhưng vẫn cần được theo dõi đều để bảo đảm không xuất hiện diễn biến xấu hơn. ` +
      'Tôi khuyến khích bạn tiếp tục duy trì thói quen chăm sóc cơ thể, vận động vừa sức và theo dõi đều đặn để cải thiện sức khỏe tổng thể.'
    );
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (params.redirectTo) {
      router.replace(params.redirectTo as any);
    } else {
      router.push({
        pathname: '/workout-plans',
        params: {
          painArea: typeof params.painArea === 'string' ? params.painArea : '',
          painAreaLabel: typeof params.painAreaLabel === 'string' ? params.painAreaLabel : '',
        },
      });
    }
  };

  const chartData = useMemo(() => {
    const labels: string[] = [];
    const values: number[] = [];

    const source = [...trendLogs].slice(0, 7).reverse();

    source.forEach((log, index) => {
      if (index === source.length - 2) {
        labels.push('Qua');
      } else if (index === source.length - 1) {
        labels.push('Nay');
      } else {
        const distance = source.length - index - 1;
        labels.push(`${distance}d`);
      }
      values.push(Number(log.pain_level || 0));
    });

    if (values.length === 0) {
      return null;
    }

    return {
      labels,
      datasets: [{ data: values }],
    };
  }, [trendLogs]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
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
        <Text style={styles.headerTitle}>Phân tích tình trạng</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Comparison Card - Redesigned */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <View style={styles.comparisonCard}>
            <Text style={styles.comparisonTitle}>So sánh với hôm qua</Text>
            
            <View style={styles.comparisonRow}>
              {/* Yesterday */}
              <View style={styles.dayColumn}>
                <Text style={styles.dayLabel}>Hôm qua</Text>
                <View style={styles.painCircle}>
                  <View style={styles.painValueRow}>
                    <Text style={styles.painValue}>
                      {yesterdayPain ? yesterdayPain.pain_level : '-'}
                    </Text>
                    <Text style={styles.painMax}>/10</Text>
                  </View>
                </View>
              </View>

              {/* Trend Arrow */}
              <View style={styles.arrowContainer}>
                {todayPain && yesterdayPain && (
                  <>
                    {todayPain.pain_level < yesterdayPain.pain_level && (
                      <View style={styles.trendBadgeGood}>
                        <TrendingDown size={28} color="#FFF" strokeWidth={3} />
                      </View>
                    )}
                    {todayPain.pain_level > yesterdayPain.pain_level && (
                      <View style={styles.trendBadgeBad}>
                        <TrendingUp size={28} color="#FFF" strokeWidth={3} />
                      </View>
                    )}
                    {todayPain.pain_level === yesterdayPain.pain_level && (
                      <View style={styles.trendBadgeNeutral}>
                        <Minus size={28} color="#FFF" strokeWidth={3} />
                      </View>
                    )}
                  </>
                )}
              </View>

              {/* Today */}
              <View style={styles.dayColumn}>
                <Text style={styles.dayLabel}>Hôm nay</Text>
                <View style={styles.painCircle}>
                  <View style={styles.painValueRow}>
                    <Text style={styles.painValue}>
                      {todayPain ? todayPain.pain_level : '-'}
                    </Text>
                    <Text style={styles.painMax}>/10</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Difference Badge */}
            {todayPain && yesterdayPain && (
              <View style={styles.diffContainer}>
                {todayPain.pain_level < yesterdayPain.pain_level && (
                  <View style={styles.diffBadgeGood}>
                    <Text style={styles.diffTextGood}>
                      Giảm {Math.abs(todayPain.pain_level - yesterdayPain.pain_level)} điểm 🎉
                    </Text>
                  </View>
                )}
                {todayPain.pain_level > yesterdayPain.pain_level && (
                  <View style={styles.diffBadgeBad}>
                    <Text style={styles.diffTextBad}>
                      Tăng {todayPain.pain_level - yesterdayPain.pain_level} điểm
                    </Text>
                  </View>
                )}
                {todayPain.pain_level === yesterdayPain.pain_level && (
                  <View style={styles.diffBadgeNeutral}>
                    <Text style={styles.diffTextNeutral}>
                      Ổn định
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </Animated.View>

        {/* AI Insight */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Zap size={24} color={colors.primary} />
              <Text style={styles.insightTitle}>Phân tích AI</Text>
            </View>
            <Text style={styles.insightText}>{aiInsight}</Text>
          </View>
        </Animated.View>

        {/* Chart Card - 7 Days Trend */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Xu hướng 7 ngày</Text>
            {chartData && (
              <LineChart
                data={chartData}
                width={width - 64}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#f8f9fa',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(91, 155, 213, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.6})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: colors.primary,
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: '',
                    stroke: '#e0e0e0',
                    strokeWidth: 1,
                  },
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
                withInnerLines={true}
                withOuterLines={true}
                withVerticalLines={false}
                withHorizontalLines={true}
                fromZero={true}
                segments={5}
              />
            )}
          </View>
        </Animated.View>

        {/* Pain Areas Today */}
        {todayPain && todayPain.pain_areas && (
          <Animated.View entering={FadeInDown.delay(200)}>
            <View style={styles.areasCard}>
              <Text style={styles.areasTitle}>Vùng đau hôm nay</Text>
              <View style={styles.areasList}>
                {Object.entries(todayPain.pain_areas).map(([area, level]: [string, any]) => (
                  <View key={area} style={styles.areaItem}>
                    <Text style={styles.areaName}>{getAreaName(area)}</Text>
                    <View style={styles.areaLevel}>
                      <View style={[styles.levelBar, { width: `${(level / 10) * 100}%`, backgroundColor: getLevelColor(level) }]} />
                      <Text style={styles.levelText}>{level}/10</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {/* CTA Button */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <LinearGradient
            colors={[colors.primary, '#4A7FB8']}
            style={styles.ctaButton}
          >
            <TouchableOpacity
              onPress={handleContinue}
              style={styles.ctaButtonInner}
            >
              <Target size={24} color="#FFF" />
              <Text style={styles.ctaButtonText}>
                {params.redirectTo === '/recommendations' ? 'Xem lộ trình cá nhân' : 'Xem bài tập phù hợp'}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getAreaName = (area: string) => {
  const names: Record<string, string> = {
    neck: 'Cổ',
    shoulder_left: 'Vai trái',
    shoulder_right: 'Vai phải',
    upper_back: 'Lưng trên',
    middle_back: 'Lưng giữa',
    lower_back: 'Lưng dưới',
    arm_left: 'Cánh tay trái',
    arm_right: 'Cánh tay phải',
    hand_left: 'Bàn tay trái',
    hand_right: 'Bàn tay phải',
    thigh_left: 'Đùi trái',
    thigh_right: 'Đùi phải',
    leg_left: 'Cẳng chân trái',
    leg_right: 'Cẳng chân phải',
    foot_left: 'Bàn chân trái',
    foot_right: 'Bàn chân phải',
  };
  return names[area] || area;
};

const getLevelColor = (level: number) => {
  if (level <= 3) return colors.success;
  if (level <= 6) return colors.warning;
  return colors.error;
};

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
  },
  content: {
    flex: 1,
    padding: 20,
  },
  chartCard: {
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
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  comparisonCard: {
    backgroundColor: colors.surface,
    padding: 28,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  painCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  painValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  painValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFF',
    lineHeight: 40,
  },
  painMax: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    marginLeft: 2,
  },
  arrowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  trendBadgeGood: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  trendBadgeBad: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  trendBadgeNeutral: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  diffContainer: {
    alignItems: 'center',
  },
  diffBadgeGood: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: '#D1FAE5',
  },
  diffTextGood: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
  },
  diffBadgeBad: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
  },
  diffTextBad: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991B1B',
  },
  diffBadgeNeutral: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
  },
  diffTextNeutral: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
  },
  insightCard: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  insightText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  areasCard: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  areasTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  areasList: {
    gap: 12,
  },
  areaItem: {
    gap: 8,
  },
  areaName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  areaLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelBar: {
    height: 8,
    borderRadius: 4,
    flex: 1,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    width: 40,
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
    gap: 12,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
