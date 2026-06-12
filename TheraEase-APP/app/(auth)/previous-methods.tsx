import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { 
  Activity, 
  Pill, 
  Stethoscope, 
  HeartPulse,
  CircleCheckBig,
  ListChecks,
  History
} from 'lucide-react-native';
import { colors } from '@/utils/theme';

const { width } = Dimensions.get('window');

const OPTIONS = [
  { id: 'physical', label: 'Vật lí trị liệu', icon: Activity, color: '#10B981' },
  { id: 'acupuncture', label: 'Châm cứu, bấm huyệt', icon: HeartPulse, color: '#6366F1' },
  { id: 'pills', label: 'Uống thuốc giảm đau', icon: Pill, color: '#F59E0B' },
  { id: 'devices', label: 'Sử dụng các thiết bị hỗ trợ', icon: Stethoscope, color: '#0EA5E9' },
  { id: 'all', label: 'Tất cả', icon: ListChecks, color: '#8B5CF6' }
];

export default function PreviousMethodsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedId(id);
  };

  const handleNext = async () => {
    if (!selectedId) return;
    const selectedOption = OPTIONS.find(o => o.id === selectedId);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace({ 
      pathname: '/(auth)/method-effectiveness', 
      params: { ...params, previousMethods: selectedOption?.label } 
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
              <View style={[styles.progressBar, { width: '93%' }]} />
            </View>
            
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <History size={32} color={colors.primary} strokeWidth={2.5} />
              </View>
            </View>
            
            <Text style={styles.title}>Phương pháp đã dùng?</Text>
            <Text style={styles.subtitle}>
              Lịch sử điều trị giúp chúng tôi cá nhân hóa lộ trình tập luyện của bạn.
            </Text>
          </MotiView>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {OPTIONS.map((option, index) => {
              const isSelected = selectedId === option.id;
              const Icon = option.icon;
              
              return (
                <MotiView
                  key={option.id}
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: 100 * index, type: 'timing', duration: 400 }}
                >
                  <TouchableOpacity
                    style={[
                      styles.optionCard,
                      isSelected && styles.optionCardSelected
                    ]}
                    onPress={() => handleSelect(option.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[
                      styles.iconWrapper, 
                      { backgroundColor: isSelected ? option.color : '#F3F4F6' }
                    ]}>
                      <Icon size={24} color={isSelected ? '#FFFFFF' : '#6B7280'} strokeWidth={2.5} />
                    </View>
                    
                    <Text style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected
                    ]}>
                      {option.label}
                    </Text>

                    <View style={[
                      styles.radioCircle,
                      isSelected && { borderColor: option.color }
                    ]}>
                      {isSelected && <View style={[styles.radioInner, { backgroundColor: option.color }]} />}
                    </View>
                  </TouchableOpacity>
                </MotiView>
              );
            })}
          </ScrollView>

          <MotiView 
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 600, type: 'timing', duration: 500 }}
            style={styles.footer}
          >
            <Button
              mode="contained"
              onPress={handleNext}
              disabled={!selectedId}
              style={[
                styles.button,
                !selectedId && styles.buttonDisabled
              ]}
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
    marginBottom: 30,
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
    fontSize: 26,
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
  scrollContent: {
    paddingBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  optionCardSelected: {
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionLabel: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#374151',
  },
  optionLabelSelected: {
    color: colors.primary,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
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
  buttonDisabled: {
    opacity: 0.5,
    elevation: 0,
    shadowOpacity: 0,
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

