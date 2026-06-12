import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Checkbox, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ArrowLeft } from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/services/api';
import { colors } from '@/utils/theme';

const NECK_SYMPTOMS = [
  'Đau cổ vai gáy',
  'Thoái hóa đốt sống cổ',
  'Thoát vị đĩa đệm cổ',
  'Chèn ép dây thần kinh',
  'Trợt đốt sống cổ',
  'Gù cổ',
  'Gai đốt sống',
];

const BACK_SYMPTOMS = [
  'Đau lưng',
  'Thoái hóa đốt sống lưng',
  'Thoát vị đĩa đệm',
  'Đau thần kinh tọa',
  'Trợt đốt sống',
  'Gù lưng',
  'Gai đốt sống',
];

export default function EditSymptomsScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(user?.symptoms || []);

  const painAreas = user?.pain_areas || [];
  const showNeck = painAreas.includes('neck');
  const showBack = painAreas.includes('back') || 
                   painAreas.includes('upper_back') || 
                   painAreas.includes('middle_back') || 
                   painAreas.includes('lower_back');

  const toggleSymptom = (symptom: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleSave = async () => {
    if (!user) return;

    if (selectedSymptoms.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất 1 triệu chứng');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const data = await api.put('/auth/profile', {
        symptoms: selectedSymptoms,
      });

      if (data) {
        setUser(data);
        Alert.alert('Thành công', 'Đã cập nhật triệu chứng', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      }
    } catch (error) {
      console.error('Update symptoms error:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật triệu chứng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa triệu chứng</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {showNeck && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Triệu chứng cổ</Text>
            {NECK_SYMPTOMS.map((symptom) => (
              <TouchableOpacity
                key={symptom}
                style={styles.checkboxItem}
                onPress={() => toggleSymptom(symptom)}
                activeOpacity={0.7}
              >
                <Checkbox
                  status={selectedSymptoms.includes(symptom) ? 'checked' : 'unchecked'}
                  onPress={() => toggleSymptom(symptom)}
                />
                <Text style={styles.checkboxLabel}>{symptom}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {showBack && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Triệu chứng lưng</Text>
            {BACK_SYMPTOMS.map((symptom) => (
              <TouchableOpacity
                key={symptom}
                style={styles.checkboxItem}
                onPress={() => toggleSymptom(symptom)}
                activeOpacity={0.7}
              >
                <Checkbox
                  status={selectedSymptoms.includes(symptom) ? 'checked' : 'unchecked'}
                  onPress={() => toggleSymptom(symptom)}
                />
                <Text style={styles.checkboxLabel}>{symptom}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.selectedCount}>
          Đã chọn: {selectedSymptoms.length} triệu chứng
        </Text>

        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          disabled={loading || selectedSymptoms.length === 0}
          style={styles.saveButton}
        >
          Lưu thay đổi
        </Button>
      </ScrollView>
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkboxLabel: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  selectedCount: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  saveButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
});
