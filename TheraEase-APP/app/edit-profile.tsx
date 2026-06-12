import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  BriefcaseBusiness,
  Calendar,
  Dumbbell,
  Ruler,
  Scale,
  Target,
  UserRound,
} from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/services/api';
import { useTheme } from '@/contexts/ThemeContext';

type ProfileFieldProps = {
  colors: any;
  icon: React.ReactNode;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'number-pad';
  loading: boolean;
  isLast?: boolean;
};

function ProfileField({
  colors,
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  loading,
  isLast = false,
}: ProfileFieldProps) {
  return (
    <View
      style={[
        stylesShared.fieldRow,
        !isLast && stylesShared.fieldDivider,
        !isLast && { borderBottomColor: colors.border },
      ]}
    >
      <View style={stylesShared.fieldLeft}>
        <View style={[stylesShared.iconWrap, { backgroundColor: colors.background }]}>{icon}</View>
        <Text style={[stylesShared.fieldLabel, { color: colors.text }]}>{label}</Text>
      </View>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        keyboardType={keyboardType}
        editable={!loading}
        style={[stylesShared.input, { color: colors.text }]}
        textAlign="right"
      />
    </View>
  );
}

const stylesShared = StyleSheet.create({
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  fieldDivider: {
    borderBottomWidth: 1,
  },
  fieldLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    minWidth: 110,
    fontSize: 17,
    fontWeight: '600',
    paddingVertical: 0,
  },
});

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [age, setAge] = useState(user?.age?.toString() || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [height, setHeight] = useState(user?.height || '');
  const [weight, setWeight] = useState(user?.weight || '');
  const [targetWeight, setTargetWeight] = useState(user?.target_weight || '');
  const [primaryGoal, setPrimaryGoal] = useState(user?.primary_goal || '');
  const [focusArea, setFocusArea] = useState(user?.focus_area || '');
  const [limitations, setLimitations] = useState(user?.limitations || '');
  const [dietType, setDietType] = useState(user?.diet_type || '');
  const [occupation, setOccupation] = useState(user?.occupation || '');

  const screenGradient: [string, string, string] = isDark
    ? ['#0B1220', '#111827', '#1F2937']
    : ['#EFF6FF', '#FFFFFF', '#F9FAFB'];

  const handleSave = async () => {
    if (!user) return;

    if (!fullName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ tên');
      return;
    }

    if (!age || parseInt(age, 10) < 1 || parseInt(age, 10) > 120) {
      Alert.alert('Lỗi', 'Vui lòng nhập tuổi hợp lệ (1-120)');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const data = await api.put('/auth/profile', {
        full_name: fullName.trim(),
        age: parseInt(age, 10),
        gender: gender.trim(),
        height: height.trim(),
        weight: weight.trim(),
        target_weight: targetWeight.trim(),
        primary_goal: primaryGoal.trim(),
        focus_area: focusArea.trim(),
        limitations: limitations.trim(),
        diet_type: dietType.trim(),
        occupation: occupation.trim(),
      });

      if (data) {
        setUser(data);
        Alert.alert('Thành công', 'Đã cập nhật thông tin', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      }
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật thông tin. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={screenGradient} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroCard}>
            <Text style={styles.heroTitle}>Thông tin cá nhân</Text>
            <Text style={styles.heroDescription}>
              Cập nhật những thông tin cơ bản để hồ sơ hiển thị đồng nhất và ứng dụng cá nhân
              hóa tốt hơn cho bạn.
            </Text>
          </View>

          <View style={styles.formCard}>
            <ProfileField
              colors={colors}
              icon={<UserRound size={18} color={colors.primary} />}
              label="Họ tên"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nhập họ tên"
              loading={loading}
            />

            <ProfileField
              colors={colors}
              icon={<Calendar size={18} color={colors.primary} />}
              label="Tuổi"
              value={age}
              onChangeText={(value) => setAge(value.replace(/[^0-9]/g, ''))}
              placeholder="Nhập tuổi"
              keyboardType="number-pad"
              loading={loading}
            />

            <ProfileField
              colors={colors}
              icon={<UserRound size={18} color={colors.primary} />}
              label="Giới tính"
              value={gender}
              onChangeText={setGender}
              placeholder="Nhập giới tính"
              loading={loading}
            />

            <ProfileField
              colors={colors}
              icon={<Ruler size={18} color={colors.primary} />}
              label="Chiều cao"
              value={height}
              onChangeText={setHeight}
              placeholder="Ví dụ: 175 cm"
              loading={loading}
            />

            <ProfileField
              colors={colors}
              icon={<Scale size={18} color={colors.primary} />}
              label="Cân nặng"
              value={weight}
              onChangeText={setWeight}
              placeholder="Ví dụ: 70 kg"
              loading={loading}
            />

            <ProfileField
              colors={colors}
              icon={<Target size={18} color={colors.primary} />}
              label="Trọng lượng mục tiêu"
              value={targetWeight}
              onChangeText={setTargetWeight}
              placeholder="Ví dụ: 65 kg"
              loading={loading}
            />

            <ProfileField
              colors={colors}
              icon={<Target size={18} color={colors.primary} />}
              label="Mục tiêu chính"
              value={primaryGoal}
              onChangeText={setPrimaryGoal}
              placeholder="Ví dụ: Giảm cân"
              loading={loading}
            />

            <ProfileField
              colors={colors}
              icon={<Dumbbell size={18} color={colors.primary} />}
              label="Lĩnh vực trọng tâm"
              value={focusArea}
              onChangeText={setFocusArea}
              placeholder="Ví dụ: Toàn thân"
              loading={loading}
            />

            <ProfileField
              colors={colors}
              icon={<BriefcaseBusiness size={18} color={colors.primary} />}
              label="Hạn chế"
              value={limitations}
              onChangeText={setLimitations}
              placeholder="Ví dụ: Cổ tay nhạy cảm"
              loading={loading}
            />

            <ProfileField
              colors={colors}
              icon={<BriefcaseBusiness size={18} color={colors.primary} />}
              label="Loại chế độ ăn uống"
              value={dietType}
              onChangeText={setDietType}
              placeholder="Ví dụ: Cân bằng"
              loading={loading}
            />

            <ProfileField
              colors={colors}
              icon={<BriefcaseBusiness size={18} color={colors.primary} />}
              label="Nghề nghiệp"
              value={occupation}
              onChangeText={setOccupation}
              placeholder="Nhập nghề nghiệp"
              loading={loading}
              isLast
            />
          </View>

          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            disabled={loading}
            style={styles.saveButton}
            buttonColor={colors.secondary}
            contentStyle={styles.saveButtonContent}
            labelStyle={styles.saveButtonLabel}
          >
            Lưu thay đổi
          </Button>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: isDark ? 'rgba(17, 24, 39, 0.78)' : 'rgba(255, 255, 255, 0.82)',
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderCurve: 'continuous',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    headerSpacer: {
      width: 40,
      height: 40,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
      gap: 18,
    },
    heroCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderCurve: 'continuous',
      padding: 20,
      gap: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    heroTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    heroDescription: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.textSecondary,
    },
    formCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderCurve: 'continuous',
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    saveButton: {
      borderRadius: 999,
      borderCurve: 'continuous',
      overflow: 'hidden',
      marginTop: 8,
    },
    saveButtonContent: {
      minHeight: 58,
    },
    saveButtonLabel: {
      fontSize: 18,
      fontWeight: '700',
    },
  });
