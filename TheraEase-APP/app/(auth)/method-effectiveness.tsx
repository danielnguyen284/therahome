import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { 
  XCircle, 
  Clock, 
  MapPin, 
  DollarSign,
  ListChecks,
  HelpCircle
} from 'lucide-react-native';
import { colors } from '@/utils/theme';

const { width } = Dimensions.get('window');

const OPTIONS = [
  { id: 'ineffective', label: 'Không hiệu quả với tôi', icon: XCircle, color: '#EF4444' },
  { id: 'no_time', label: 'Không có thời gian', icon: Clock, color: '#F59E0B' },
  { id: 'inconvenient', label: 'Đi lại bất tiện', icon: MapPin, color: '#6366F1' },
  { id: 'expensive', label: 'Chi phí cao', icon: DollarSign, color: '#10B981' },
  { id: 'all', label: 'Tất cả', icon: ListChecks, color: '#8B5CF6' }
];

export default function MethodEffectivenessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (id === 'all') {
      if (selectedIds.includes('all')) {
        setSelectedIds([]);
      } else {
        setSelectedIds(OPTIONS.map(o => o.id));
      }
      return;
    }

    let newSelected = [...selectedIds];
    if (newSelected.includes(id)) {
      newSelected = newSelected.filter(item => item !== id && item !== 'all');
    } else {
      newSelected.push(id);
      const allOthers = OPTIONS.filter(o => o.id !== 'all').map(o => o.id);
      if (allOthers.every(o => newSelected.includes(o))) {
        newSelected.push('all');
      }
    }
    setSelectedIds(newSelected);
  };

  const handleNext = async () => {
    if (selectedIds.length === 0) return;
    const selectedLabels = OPTIONS.filter(o => selectedIds.includes(o.id) && o.id !== 'all').map(o => o.label);
    const reasonText = selectedLabels.join(', ');
    
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace({ 
      pathname: '/(auth)/ai-analysing', 
      params: { ...params, methodFailureReason: reasonText } 
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
              <View style={[styles.progressBar, { width: '95%' }]} />
            </View>
            
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <HelpCircle size={32} color={colors.primary} strokeWidth={2.5} />
              </View>
            </View>
            
            <Text style={styles.title}>Những phương pháp cũ tại sao không hiệu quả với bạn?</Text>
          </MotiView>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {OPTIONS.map((option, index) => {
              const isSelected = selectedIds.includes(option.id);
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
              disabled={selectedIds.length === 0}
              style={[
                styles.button,
                selectedIds.length === 0 && styles.buttonDisabled
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
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 32,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 18,
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
    borderColor: colors.primary + '30',
    backgroundColor: '#F8FAFC',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
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
    elevation: 8,
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
