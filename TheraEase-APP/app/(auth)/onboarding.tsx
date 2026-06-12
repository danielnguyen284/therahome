import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Checkbox, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { 
  User, 
  Cake, 
  Briefcase, 
  Heart, 
  Activity, 
  Clock,
  Sun,
  Moon,
  Bone,
  UserSquare2,
  Users,
  CheckCircle2,
  AlertTriangle,
  Dumbbell,
  Lightbulb,
  Sparkles,
  Wind,
  TrendingUp,
  Target,
  ArrowLeft
} from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { updateProfile } from '@/services/auth';
import { colors } from '@/utils/theme';
import { SYMPTOMS, SURGERY_HISTORY } from '@/utils/constants';
import Animated, { 
  FadeInDown,
  FadeInUp,
  FadeOutUp,
  SlideInRight,
  SlideOutLeft,
  ZoomIn
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const tips = [
  { icon: 'lightbulb', text: 'Luyện tập đều đặn mỗi ngày giúp giảm đau hiệu quả' },
  { icon: 'sparkles', text: 'Hãy lắng nghe cơ thể và nghỉ ngơi khi cần thiết' },
  { icon: 'dumbbell', text: 'Kiên trì là chìa khóa để cải thiện sức khỏe' },
  { icon: 'wind', text: 'Kết hợp bài tập với thở sâu để tăng hiệu quả' },
  { icon: 'trending-up', text: 'Theo dõi tiến độ giúp bạn duy trì động lực' },
  { icon: 'target', text: 'Đặt mục tiêu nhỏ và đạt được từng bước một' },
];

const PREFERRED_TIME_OPTIONS = [
  {
    id: 'morning',
    label: 'Buổi sáng',
    description: 'Nhận nhắc nhở vào đầu ngày',
    value: '08:00',
    icon: Sun,
    colors: ['#F59E0B', '#D97706'] as const,
  },
  {
    id: 'evening',
    label: 'Buổi tối',
    description: 'Phù hợp cho lịch tập cuối ngày',
    value: '20:00',
    icon: Moon,
    colors: ['#5B9BD5', '#4A7FB8'] as const,
  },
  {
    id: 'both',
    label: 'Cả 2',
    description: 'Bài tập hằng ngày sẽ thiên về sáng, các nhắc quay lại sẽ thiên về tối',
    value: '08:00,20:00',
    icon: Sparkles,
    colors: ['#10B981', '#059669'] as const,
  },
];

function getPreferredTimeChoice(value?: string | null): 'morning' | 'evening' | 'both' {
  if (value === '08:00') return 'morning';
  if (value === '08:00,20:00') return 'both';
  return 'evening';
}

function getPreferredTimeValue(choice: 'morning' | 'evening' | 'both') {
  return PREFERRED_TIME_OPTIONS.find((option) => option.id === choice)?.value || '20:00';
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');
  const [tipIndex, setTipIndex] = useState(0);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Check if user already has profile
  React.useEffect(() => {
    checkExistingProfile();
  }, []);

  const checkExistingProfile = async () => {
    try {
      console.log('Onboarding: Checking existing profile...');
      
      // Check từ local store trước (nhanh nhất)
      if (user?.onboarding_completed) {
        console.log('Onboarding: Profile exists in local store, redirecting to home');
        router.replace('/(tabs)/home');
        return;
      }
      
      console.log('Onboarding: No profile in local store, showing onboarding');
      setCheckingProfile(false);
    } catch (error) {
      console.error('Onboarding: Error checking profile:', error);
      setCheckingProfile(false);
    }
  };

  React.useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setTipIndex((prev) => (prev + 1) % tips.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [loading]);

  // Form data
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [occupation, setOccupation] = useState('');
  const [painArea, setPainArea] = useState<'neck' | 'back' | 'both' | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [surgeryHistory, setSurgeryHistory] = useState('');
  const [preferredTimeChoice, setPreferredTimeChoice] = useState<'morning' | 'evening' | 'both'>(
    getPreferredTimeChoice(user?.preferred_time),
  );
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
    if (type === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const renderTipIcon = (iconName: string) => {
    const iconProps = { size: 24, color: '#FFFFFF', strokeWidth: 2 };
    switch (iconName) {
      case 'lightbulb':
        return <Lightbulb {...iconProps} />;
      case 'sparkles':
        return <Sparkles {...iconProps} />;
      case 'dumbbell':
        return <Dumbbell {...iconProps} />;
      case 'wind':
        return <Wind {...iconProps} />;
      case 'trending-up':
        return <TrendingUp {...iconProps} />;
      case 'target':
        return <Target {...iconProps} />;
      default:
        return <Lightbulb {...iconProps} />;
    }
  };

  const handleSymptomToggle = (symptom: string) => {
    setSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const getSymptomsList = () => {
    if (painArea === 'neck') return SYMPTOMS.NECK;
    if (painArea === 'back') return SYMPTOMS.BACK;
    if (painArea === 'both') return [...SYMPTOMS.NECK, ...SYMPTOMS.BACK];
    return [];
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      console.log('Onboarding: Starting profile creation...');

      const profileData = {
        full_name: fullName,
        age: parseInt(age),
        occupation,
        gender: '',
        height: '',
        weight: '',
        target_weight: '',
        primary_goal: '',
        focus_area: '',
        limitations: '',
        diet_type: '',
        pain_areas: painArea === 'both' ? ['neck', 'back'] : painArea ? [painArea] : [],
        symptoms,
        surgery_history: surgeryHistory,
        preferred_time: getPreferredTimeValue(preferredTimeChoice),
        onboarding_completed: true,
        is_pro: false,
      };

      console.log('Onboarding: Profile data:', profileData);

      // Lấy email từ AsyncStorage
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const email = await AsyncStorage.default.getItem('user_email');
      console.log('Onboarding: Email from storage:', email);

      // Lưu vào local store ngay lập tức
      const userProfile = {
        id: user?.id || 'guest',
        email: email || '',
        avatar_url: user?.avatar_url || '',
        role: user?.role || 'user',
        owned_devices: user?.owned_devices || [],
        notifications_enabled: user?.notifications_enabled ?? true,
        ...profileData,
        created_at: new Date().toISOString(),
      };
      
      setUser(userProfile);
      console.log('Onboarding: Saved to local store with ID:', userProfile.id);
      console.log('Onboarding: Saved email:', userProfile.email);

      if (user?.id && user.id !== 'guest') {
        await updateProfile(profileData);
      }
      
      showToast('Đã lưu hồ sơ!', 'success');
      console.log('Onboarding: Navigating to home...');
      setTimeout(() => {
        setLoading(false);
        router.replace('/(tabs)/home');
      }, 1000);
    } catch (error) {
      console.error('Submit error:', error);
      showToast('Có lỗi xảy ra: ' + (error as Error).message, 'error');
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <Animated.View 
      entering={SlideInRight.duration(400).springify()}
      exiting={SlideOutLeft.duration(300)}
      style={styles.stepContainer}
    >
      <Animated.View entering={FadeInDown.delay(100)} style={styles.titleRow}>
        <User size={28} color={colors.primary} />
        <Text style={styles.stepTitle}>Thông tin cơ bản</Text>
      </Animated.View>
      
      <Animated.View entering={FadeInDown.delay(200)}>
        <View style={styles.inputRow}>
          <User size={20} color={colors.textSecondary} />
          <Text style={styles.inputLabel}>Họ và tên</Text>
        </View>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          mode="outlined"
          style={styles.input}
          placeholder="Nhập họ tên của bạn"
          left={<TextInput.Icon icon="account" />}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300)}>
        <View style={styles.inputRow}>
          <Cake size={20} color={colors.textSecondary} />
          <Text style={styles.inputLabel}>Tuổi</Text>
        </View>
        <TextInput
          value={age}
          onChangeText={(text) => {
            // Chỉ cho phép nhập số
            const numericValue = text.replace(/[^0-9]/g, '');
            if (numericValue && (parseInt(numericValue) < 1 || parseInt(numericValue) > 120)) {
              showToast('Tuổi phải từ 1 đến 120', 'error');
              return;
            }
            setAge(numericValue);
          }}
          keyboardType="number-pad"
          mode="outlined"
          style={styles.input}
          placeholder="Nhập tuổi của bạn (VD: 25)"
          left={<TextInput.Icon icon="cake-variant" />}
          maxLength={3}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400)}>
        <View style={styles.inputRow}>
          <Briefcase size={20} color={colors.textSecondary} />
          <Text style={styles.inputLabel}>Nghề nghiệp</Text>
        </View>
        <TextInput
          value={occupation}
          onChangeText={setOccupation}
          mode="outlined"
          style={styles.input}
          placeholder="Ví dụ: Nhân viên văn phòng"
          left={<TextInput.Icon icon="briefcase" />}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(500)}>
        <Button
          mode="contained"
          onPress={() => {
            if (!fullName.trim()) {
              showToast('Vui lòng nhập họ tên', 'error');
              return;
            }
            if (!age || parseInt(age) < 1) {
              showToast('Vui lòng nhập tuổi hợp lệ', 'error');
              return;
            }
            if (!occupation.trim()) {
              showToast('Vui lòng nhập nghề nghiệp', 'error');
              return;
            }
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            showToast('Đã lưu thông tin cơ bản', 'success');
            setStep(2);
          }}
          disabled={!fullName || !age || !occupation}
          style={styles.button}
          icon="arrow-right"
        >
          Tiếp tục
        </Button>
      </Animated.View>
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View 
      entering={SlideInRight.duration(400).springify()}
      exiting={SlideOutLeft.duration(300)}
      style={styles.stepContainer}
    >
      <Animated.View entering={FadeInDown.delay(100)} style={styles.titleRow}>
        <Heart size={28} color={colors.primary} />
        <Text style={styles.stepTitle}>Bạn đang gặp vấn đề về</Text>
      </Animated.View>
      
      <View style={styles.optionsContainer}>
        <Animated.View entering={ZoomIn.delay(200).springify()}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setPainArea('neck');
            }}
          >
            <LinearGradient
              colors={painArea === 'neck' ? ['#5B9BD5', '#4A7FB8'] : ['#FFFFFF', '#F5F5F5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.optionCard, painArea === 'neck' && styles.optionCardSelected]}
            >
              <Bone size={width * 0.14} color={painArea === 'neck' ? '#FFFFFF' : colors.primary} strokeWidth={2} />
              <Text style={[styles.optionText, painArea === 'neck' && styles.optionTextSelected]}>Cổ</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={ZoomIn.delay(300).springify()}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setPainArea('back');
            }}
          >
            <LinearGradient
              colors={painArea === 'back' ? ['#5B9BD5', '#4A7FB8'] : ['#FFFFFF', '#F5F5F5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.optionCard, painArea === 'back' && styles.optionCardSelected]}
            >
              <UserSquare2 size={width * 0.14} color={painArea === 'back' ? '#FFFFFF' : colors.primary} strokeWidth={2} />
              <Text style={[styles.optionText, painArea === 'back' && styles.optionTextSelected]}>Lưng</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={ZoomIn.delay(400).springify()}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setPainArea('both');
            }}
          >
            <LinearGradient
              colors={painArea === 'both' ? ['#5B9BD5', '#4A7FB8'] : ['#FFFFFF', '#F5F5F5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.optionCard, painArea === 'both' && styles.optionCardSelected]}
            >
              <Users size={width * 0.14} color={painArea === 'both' ? '#FFFFFF' : colors.primary} strokeWidth={2} />
              <Text style={[styles.optionText, painArea === 'both' && styles.optionTextSelected]}>Cả hai</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.delay(500)} style={styles.buttonRow}>
        <Button mode="outlined" onPress={() => setStep(1)} style={styles.halfButton}>
          Quay lại
        </Button>
        <Button
          mode="contained"
          onPress={() => {
            if (!painArea) {
              showToast('Vui lòng chọn vùng đau', 'error');
              return;
            }
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            showToast('Đã chọn vùng đau', 'success');
            setStep(3);
          }}
          disabled={!painArea}
          style={styles.halfButton}
        >
          Tiếp tục
        </Button>
      </Animated.View>
    </Animated.View>
  );

  const renderStep3 = () => (
    <Animated.View 
      entering={SlideInRight.duration(400).springify()}
      exiting={SlideOutLeft.duration(300)}
      style={styles.stepContainer}
    >
      <Animated.View entering={FadeInDown.delay(100)} style={styles.titleRow}>
        <Activity size={28} color={colors.primary} />
        <Text style={styles.stepTitle}>Chi tiết triệu chứng</Text>
      </Animated.View>
      
      <ScrollView style={styles.symptomsContainer} showsVerticalScrollIndicator={false}>
        {getSymptomsList().map((symptom, index) => (
          <Animated.View key={`${painArea}-${symptom}-${index}`} entering={FadeInDown.delay(index * 50)}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleSymptomToggle(symptom);
              }}
              activeOpacity={0.7}
            >
              <Checkbox
                status={symptoms.includes(symptom) ? 'checked' : 'unchecked'}
                onPress={() => handleSymptomToggle(symptom)}
                color={colors.primary}
              />
              <Text style={styles.checkboxLabel}>{symptom}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>

      <Animated.View entering={FadeInDown.delay(500)} style={styles.buttonRow}>
        <Button mode="outlined" onPress={() => setStep(2)} style={styles.halfButton}>
          Quay lại
        </Button>
        <Button
          mode="contained"
          onPress={() => {
            if (symptoms.length === 0) {
              showToast('Vui lòng chọn ít nhất 1 triệu chứng', 'error');
              return;
            }
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            showToast(`Đã chọn ${symptoms.length} triệu chứng`, 'success');
            setStep(4);
          }}
          disabled={symptoms.length === 0}
          style={styles.halfButton}
        >
          Tiếp tục
        </Button>
      </Animated.View>
    </Animated.View>
  );

  const renderStep4 = () => (
    <Animated.View 
      entering={SlideInRight.duration(400).springify()}
      exiting={SlideOutLeft.duration(300)}
      style={styles.stepContainer}
    >
      <Animated.View entering={FadeInDown.delay(100)} style={styles.titleRow}>
        <Activity size={28} color={colors.primary} />
        <Text style={styles.stepTitle}>Lịch sử phẫu thuật</Text>
      </Animated.View>
      
      <View style={styles.optionsContainer}>
        <Animated.View entering={ZoomIn.delay(200).springify()}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setSurgeryHistory(SURGERY_HISTORY.NEVER);
            }}
          >
            <LinearGradient
              colors={surgeryHistory === SURGERY_HISTORY.NEVER ? ['#5B9BD5', '#4A7FB8'] : ['#FFFFFF', '#F5F5F5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.optionCard, surgeryHistory === SURGERY_HISTORY.NEVER && styles.optionCardSelected]}
            >
              <CheckCircle2 size={width * 0.14} color={surgeryHistory === SURGERY_HISTORY.NEVER ? '#FFFFFF' : '#10B981'} strokeWidth={2} />
              <Text style={[styles.optionText, surgeryHistory === SURGERY_HISTORY.NEVER && styles.optionTextSelected]}>Chưa bao giờ</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={ZoomIn.delay(300).springify()}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setSurgeryHistory(SURGERY_HISTORY.UNDER_6_MONTHS);
            }}
          >
            <LinearGradient
              colors={surgeryHistory === SURGERY_HISTORY.UNDER_6_MONTHS ? ['#5B9BD5', '#4A7FB8'] : ['#FFFFFF', '#F5F5F5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.optionCard, surgeryHistory === SURGERY_HISTORY.UNDER_6_MONTHS && styles.optionCardSelected]}
            >
              <AlertTriangle size={width * 0.14} color={surgeryHistory === SURGERY_HISTORY.UNDER_6_MONTHS ? '#FFFFFF' : '#F59E0B'} strokeWidth={2} />
              <Text style={[styles.optionText, surgeryHistory === SURGERY_HISTORY.UNDER_6_MONTHS && styles.optionTextSelected]}>Dưới 6 tháng</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={ZoomIn.delay(400).springify()}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setSurgeryHistory(SURGERY_HISTORY.OVER_6_MONTHS);
            }}
          >
            <LinearGradient
              colors={surgeryHistory === SURGERY_HISTORY.OVER_6_MONTHS ? ['#5B9BD5', '#4A7FB8'] : ['#FFFFFF', '#F5F5F5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.optionCard, surgeryHistory === SURGERY_HISTORY.OVER_6_MONTHS && styles.optionCardSelected]}
            >
              <Dumbbell size={width * 0.14} color={surgeryHistory === SURGERY_HISTORY.OVER_6_MONTHS ? '#FFFFFF' : colors.primary} strokeWidth={2} />
              <Text style={[styles.optionText, surgeryHistory === SURGERY_HISTORY.OVER_6_MONTHS && styles.optionTextSelected]}>Trên 6 tháng</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {surgeryHistory === SURGERY_HISTORY.UNDER_6_MONTHS && (
        <Animated.View entering={FadeInDown.delay(500)} style={styles.warningBox}>
          <AlertTriangle size={20} color="#F59E0B" style={{ marginRight: 8 }} />
          <Text style={styles.warningText}>
            Hãy hỏi ý kiến bác sĩ trước khi tập
          </Text>
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.delay(500)} style={styles.buttonRow}>
        <Button mode="outlined" onPress={() => setStep(3)} style={styles.halfButton}>
          Quay lại
        </Button>
        <Button
          mode="contained"
          onPress={() => {
            if (!surgeryHistory) {
              showToast('Vui lòng chọn lịch sử phẫu thuật', 'error');
              return;
            }
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            showToast('Đã lưu lịch sử phẫu thuật', 'success');
            setStep(5);
          }}
          disabled={!surgeryHistory}
          style={styles.halfButton}
        >
          Tiếp tục
        </Button>
      </Animated.View>
    </Animated.View>
  );

  const renderStep5 = () => {
    const selectedOption = PREFERRED_TIME_OPTIONS.find((option) => option.id === preferredTimeChoice);

    return (
      <Animated.View 
        entering={SlideInRight.duration(400).springify()}
        exiting={SlideOutLeft.duration(300)}
        style={styles.stepContainer}
      >
        <Animated.View entering={FadeInDown.delay(100)} style={styles.titleRow}>
          <Clock size={28} color={colors.primary} />
          <Text style={styles.stepTitle}>Khung giờ tập</Text>
        </Animated.View>
        
        <Animated.View entering={FadeInDown.delay(200)}>
          <Text style={styles.subtitle}>
            Hãy chọn khung giờ ban đầu phù hợp nhất với bạn. Sau này người dùng chỉ được bật hoặc tắt thông báo, còn quản trị viên sẽ là người chỉnh giờ nếu cần.
          </Text>
        </Animated.View>

        <View style={styles.optionsContainer}>
          {PREFERRED_TIME_OPTIONS.map((option, index) => {
            const Icon = option.icon;
            const isSelected = preferredTimeChoice === option.id;

            return (
              <Animated.View key={option.id} entering={FadeInDown.delay(300 + index * 80)}>
                <TouchableOpacity
                  activeOpacity={0.82}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPreferredTimeChoice(option.id as 'morning' | 'evening' | 'both');
                  }}
                >
                  <LinearGradient
                    colors={isSelected ? [...option.colors] : ['#FFFFFF', '#F8FAFC']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  >
                    <Icon
                      size={width * 0.14}
                      color={isSelected ? '#FFFFFF' : option.colors[0]}
                      strokeWidth={2}
                    />
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {option.label}
                    </Text>
                    <Text
                      style={[
                        styles.optionDescription,
                        isSelected && styles.optionDescriptionSelected,
                      ]}
                    >
                      {option.description}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        <Animated.View entering={FadeInDown.delay(400)} style={styles.hintBox}>
          <Clock size={18} color={colors.primary} />
          <Text style={styles.hint}>
            {selectedOption?.id === 'both'
              ? 'Với lựa chọn "Cả 2", giờ mặc định của bài tập hằng ngày sẽ nghiêng về buổi sáng, còn các nhắc quay lại sau 3/5/7 ngày sẽ nghiêng về buổi tối.'
              : `Lựa chọn của bạn sẽ đặt giờ mặc định ban đầu cho các message của riêng tài khoản này là ${selectedOption?.label.toLowerCase()}.`}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500)} style={styles.buttonRow}>
          <Button mode="outlined" onPress={() => setStep(4)} style={styles.halfButton}>
            Quay lại
          </Button>
          <Button
            mode="contained"
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              handleSubmit();
            }}
            loading={loading}
            disabled={loading || !preferredTimeChoice}
            style={styles.halfButton}
          >
            Hoàn thành
          </Button>
        </Animated.View>
      </Animated.View>
    );
  };

  // Show loading while checking profile
  if (checkingProfile) {
    return (
      <LinearGradient
        colors={['#EFF6FF', '#FFFFFF', '#F9FAFB']}
        style={styles.gradientContainer}
      >
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, color: colors.textSecondary }}>
              Đang kiểm tra thông tin...
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#EFF6FF', '#FFFFFF', '#F9FAFB']}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Nút Back */}
        {step > 1 && (
          <Animated.View 
            entering={FadeInDown.duration(400)}
            style={styles.backButton}
          >
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setStep(step - 1);
              }}
              style={styles.backButtonTouchable}
            >
              <ArrowLeft size={24} color={colors.primary} strokeWidth={2.5} />
            </TouchableOpacity>
          </Animated.View>
        )}

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={0}
        >
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
          <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
            <Text style={styles.title}>Thiết lập hồ sơ</Text>
              <View style={styles.progressBar}>
                <Animated.View 
                  style={[styles.progressFill, { width: `${(step / 5) * 100}%` }]} 
                >
                  <LinearGradient
                    colors={['#5B9BD5', '#4A7FB8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.progressGradient}
                  />
                </Animated.View>
              </View>
              <Text style={styles.progress}>Bước {step}/5</Text>
            </Animated.View>

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
            {step === 5 && renderStep5()}
          </ScrollView>
        </KeyboardAvoidingView>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={2000}
          style={[
            styles.snackbar,
            snackbarType === 'error' && styles.snackbarError
          ]}
          action={{
            label: 'OK',
            onPress: () => setSnackbarVisible(false),
          }}
        >
          {snackbarMessage}
        </Snackbar>

        {/* Loading Tips Modal */}
        <Modal
          visible={loading}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.loadingOverlay}>
            <LinearGradient
              colors={['#5B9BD5', '#4A7FB8']}
              style={styles.loadingCard}
            >
              <Animated.View
                key={tipIndex}
                entering={FadeInUp.duration(400)}
                exiting={FadeOutUp.duration(400)}
                style={styles.tipContent}
              >
                <Text style={styles.loadingTitle}>Đang tạo hồ sơ...</Text>
                <View style={styles.tipRow}>
                  {renderTipIcon(tips[tipIndex].icon)}
                  <Text style={styles.loadingTip}>{tips[tipIndex].text}</Text>
                </View>
              </Animated.View>
              <View style={styles.loadingDots}>
                <View style={[styles.dot, styles.dotActive]} />
                <View style={[styles.dot, styles.dotActive]} />
                <View style={[styles.dot, styles.dotActive]} />
              </View>
            </LinearGradient>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
  },
  backButtonTouchable: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: width * 0.05,
    paddingBottom: 60,
    minHeight: '100%',
  },
  header: {
    marginBottom: width * 0.08,
    alignItems: 'center',
  },
  title: {
    fontSize: width * 0.08,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(91, 155, 213, 0.2)',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
    width: '100%',
  },
  progressFill: {
    height: '100%',
    borderRadius: 20,
  },
  progressGradient: {
    flex: 1,
    borderRadius: 20,
  },
  progress: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  stepContainer: {
    gap: width * 0.05,
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: width * 0.038,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 22,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: width * 0.04,
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    backgroundColor: colors.surface,
    fontSize: width * 0.04,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    padding: width * 0.07,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#5B9BD5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    minHeight: width * 0.35,
    justifyContent: 'center',
  },
  optionCardSelected: {
    shadowOpacity: 0.3,
    elevation: 8,
    transform: [{ scale: 1.03 }],
  },

  optionText: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  optionDescription: {
    marginTop: 10,
    fontSize: width * 0.034,
    lineHeight: 20,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  optionDescriptionSelected: {
    color: 'rgba(255,255,255,0.92)',
  },
  symptomsContainer: {
    maxHeight: 400,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkboxLabel: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 8,
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary + '10',
    padding: 12,
    borderRadius: 12,
  },
  hint: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    flex: 1,
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  timePickerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 2,
  },
  button: {
    marginTop: 'auto',
    borderRadius: 16,
    elevation: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
    paddingTop: 24,
  },
  halfButton: {
    flex: 1,
    borderRadius: 16,
    elevation: 2,
  },
  snackbar: {
    backgroundColor: colors.primary,
    marginBottom: 20,
  },
  snackbarError: {
    backgroundColor: '#EF4444',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingCard: {
    width: width * 0.85,
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  tipContent: {
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  loadingTip: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    opacity: 0.95,
    flex: 1,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerModal: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    width: width * 0.85,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  timeColumn: {
    flex: 1,
    maxHeight: 200,
  },
  timeItem: {
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 4,
  },
  timeItemSelected: {
    backgroundColor: colors.primary,
  },
  timeItemText: {
    fontSize: 20,
    color: colors.text,
    fontWeight: '500',
  },
  timeItemTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  timeSeparator: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginHorizontal: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
  },
});
