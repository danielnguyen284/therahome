import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { 
  Activity, 
  Bone, 
  Stethoscope, 
  PlusCircle, 
  ClipboardList,
  Check
} from 'lucide-react-native';
import { colors } from '@/utils/theme';

const { width } = Dimensions.get('window');

const OPTIONS = [
  { id: 'sore', label: 'Chỉ đau mỏi', icon: Activity, color: '#10B981', description: 'Đau mỏi cơ, nhức' },
  { id: 'degeneration', label: 'Thoái hoá', icon: Bone, color: '#F59E0B', description: 'Thoái hoá đốt sống' },
  { id: 'herniation', label: 'Thoát vị', icon: Stethoscope, color: '#EF4444', description: 'Thoát vị đĩa đệm, chèn ép' },
  { id: 'all', label: 'Tất cả', icon: PlusCircle, color: '#3B82F6', description: 'Tất cả những bệnh lý kể trên' },
];

export default function MedicalHistoryScreen() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleNext = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const selected = OPTIONS.find(o => o.id === selectedOption)?.label;
    router.replace({ pathname: '/(auth)/complications', params: { disease: selected } });
  };

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedOption(id);
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
              <View style={[styles.progressBar, { width: '60%' }]} />
            </View>
            
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <ClipboardList size={32} color={colors.primary} strokeWidth={2.5} />
              </View>
            </View>
            
            <Text style={styles.title}>Tiền sử bệnh lý</Text>
            <Text style={styles.subtitle}>
              Thông tin này giúp chúng tôi đưa ra các bài tập an toàn và phù hợp nhất với thể trạng của bạn.
            </Text>
          </MotiView>

          <ScrollView 
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {OPTIONS.map((option, index) => {
              const Icon = option.icon;
              const isSelected = selectedOption === option.id;
              
              return (
                <MotiView
                  key={option.id}
                  from={{ opacity: 0, translateX: -50 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ delay: 200 + index * 100, type: 'timing', duration: 500 }}
                >
                  <TouchableOpacity
                    onPress={() => handleSelect(option.id)}
                    activeOpacity={0.9}
                    style={styles.optionWrapper}
                  >
                    <View style={[
                      styles.optionCard,
                      isSelected && styles.optionCardSelected,
                    ]}>
                      <View style={[
                        styles.iconBox,
                        { backgroundColor: option.color + '10' },
                        isSelected && { backgroundColor: option.color }
                      ]}>
                        <Icon 
                          size={28} 
                          color={isSelected ? '#FFFFFF' : option.color} 
                          strokeWidth={2} 
                        />
                      </View>
                      
                      <View style={styles.optionInfo}>
                        <Text style={[
                          styles.optionLabel,
                          isSelected && styles.optionLabelSelected
                        ]}>
                          {option.label}
                        </Text>
                        <Text style={styles.optionDesc}>
                          {option.description}
                        </Text>
                      </View>

                      <View style={[
                        styles.radio,
                        isSelected && { borderColor: option.color }
                      ]}>
                        {isSelected && (
                          <View style={[styles.radioInner, { backgroundColor: option.color }]} />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                </MotiView>
              );
            })}
          </ScrollView>

          <MotiView 
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 800, type: 'timing', duration: 400 }}
            style={styles.footer}
          >
            <Button
              mode="contained"
              onPress={handleNext}
              disabled={!selectedOption}
              style={[
                styles.button, 
                !selectedOption && styles.buttonDisabled
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  optionWrapper: {
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  optionCardSelected: {
    borderColor: colors.primary + '40',
    shadowOpacity: 0.1,
    shadowColor: colors.primary,
    backgroundColor: '#FFFFFF',
    transform: [{ scale: 1.01 }],
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionInfo: {
    flex: 1,
    marginLeft: 16,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: colors.primary,
  },
  optionDesc: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
    elevation: 0,
    shadowOpacity: 0,
    opacity: 0.5,
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

