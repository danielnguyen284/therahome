import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { usePainStore } from '@/stores/painStore';
import { createPainLog } from '@/services/painLogs';
import BodyMap from '@/components/BodyMap';
import { colors } from '@/utils/theme';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { getPainAreaLabel } from '@/utils/constants';

export default function PainInputScreen() {
  const router = useRouter();
  const { redirectTo } = useLocalSearchParams();
  const { user } = useAuthStore();
  const { selectedPainAreas, setSelectedPainAreas, setTodayPainLog } = usePainStore();
  const [loading, setLoading] = useState(false);

  const handleAreaPress = (area: string, level: number) => {
    setSelectedPainAreas({
      [area]: level,
    });
  };

  const handleContinue = async () => {
    if (!user || Object.keys(selectedPainAreas).length === 0) return;
    // Check if user is authenticated (not guest)
    if (!user.id || user.id === 'guest') {
      alert('Vui lòng đăng nhập để lưu dữ liệu đau');
      router.push('/(auth)/login');
      return;
    }

    try {
      setLoading(true);

      const values = Object.values(selectedPainAreas) as number[];
      const painLevel = values.length > 0 ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : 0;
      
      const data = await createPainLog({
        date: format(new Date(), 'yyyy-MM-dd'),
        pain_areas: selectedPainAreas,
        pain_level: painLevel,
      });

      setTodayPainLog(data);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const primaryAreaEntry = Object.entries(selectedPainAreas).sort((a, b) => b[1] - a[1])[0];
      const primaryArea = primaryAreaEntry?.[0];
      const primaryAreaLabel = primaryArea ? getPainAreaLabel(primaryArea) : 'Cổ';

      if (redirectTo) {
        router.replace({
          pathname: '/pain-analysis',
          params: {
            painArea: primaryArea,
            painAreaLabel: primaryAreaLabel,
            redirectTo: redirectTo as string,
          },
        });
      } else {
        router.push({
          pathname: '/pain-analysis',
          params: {
            painArea: primaryArea,
            painAreaLabel: primaryAreaLabel,
          },
        });
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      alert('Có lỗi xảy ra: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Back Button */}
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
        <Text style={styles.title}>Vị trí đau</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Chạm vào vùng đau trên cơ thể và chọn mức độ đau
        </Text>

        <BodyMap
          selectedAreas={selectedPainAreas}
          onAreaPress={handleAreaPress}
        />

        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Chú thích:</Text>
          <View style={styles.legendRow}>
            <View style={[styles.legendColor, { backgroundColor: colors.painNone }]} />
            <Text style={styles.legendText}>Không đau</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendColor, { backgroundColor: colors.painMild }]} />
            <Text style={styles.legendText}>Đau nhẹ (ấm ấm)</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendColor, { backgroundColor: colors.painModerate }]} />
            <Text style={styles.legendText}>Đau vừa (khó chịu)</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendColor, { backgroundColor: colors.painSevere }]} />
            <Text style={styles.legendText}>Đau nặng/Tê</Text>
          </View>
        </View>

        <Text style={styles.note}>
          Dữ liệu sẽ được lưu để theo dõi mức độ đau của bạn theo từng ngày.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            handleContinue();
          }}
          loading={loading}
          disabled={loading || Object.keys(selectedPainAreas).length === 0}
          style={styles.button}
          contentStyle={styles.buttonContent}
          buttonColor={colors.primary}
        >
          Tiếp tục
        </Button>
      </View>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 16,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  legend: {
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  legendTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  legendColor: {
    width: 22,
    height: 22,
    borderRadius: 5,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
  },
  legendText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  note: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 14,
    fontStyle: 'italic',
    paddingHorizontal: 12,
  },
  footer: {
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
