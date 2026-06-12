import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { Text, Button, Divider, Switch, Dialog, Portal, TextInput } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { User, Settings, Crown, LogOut, BarChart3, Bell, BellOff, ChevronRight, Activity, Calendar } from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { signOut, updateProfile } from '@/services/auth';
import { api } from '@/services/api';
import { useTheme } from '@/contexts/ThemeContext';
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';
import { rescheduleSmartNotifications, cancelAllNotifications, registerForPushNotifications } from '@/services/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, width, isDark), [colors, isDark]);
  const { user, setUser } = useAuthStore();
  const [qrDialogVisible, setQrDialogVisible] = useState(false);
  const [signOutDialogVisible, setSignOutDialogVisible] = useState(false);
  const [activationCode, setActivationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      if (typeof user?.notifications_enabled === 'boolean') {
        setNotificationsEnabled(user.notifications_enabled);
        void AsyncStorage.setItem('notificationsEnabled', String(user.notifications_enabled));
        return;
      }

      AsyncStorage.getItem('notificationsEnabled').then((val) => {
        if (val !== null) {
          setNotificationsEnabled(val === 'true');
          return;
        }
      });
    }, [user?.notifications_enabled])
  );
  const screenGradient: [string, string, string] = isDark
    ? ['#0B1220', '#111827', '#1F2937']
    : ['#EFF6FF', '#FFFFFF', '#F9FAFB'];
  const statCardGradient: [string, string] = isDark
    ? [colors.surface, colors.surfaceLight]
    : ['#FFFFFF', '#F9FAFB'];

  const handleSignOut = async () => {
    setSignOutDialogVisible(false);
    await signOut();
    setUser(null);
    router.replace('/(auth)/login');
  };

  const handleActivateCode = async () => {
    if (!activationCode.trim() || !user) return;

    try {
      setLoading(true);

      const response = await api.post('/codes/activate', { code: activationCode.trim() });
      
      if (response?.user) {
        setUser(response.user);
      } else {
        const updatedUser = { ...user, is_pro: true };
        setUser(updatedUser);
      }
      setQrDialogVisible(false);
      setActivationCode('');

      Alert.alert(
        'Thành công! 🎉',
        'Bạn đã là thành viên PRO. Tận hưởng tất cả tính năng cao cấp!'
      );
    } catch (error: any) {
      console.warn('Activate code error:', error?.message || error);
      Alert.alert('Lỗi', error?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={screenGradient}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={ZoomIn.duration(600).springify()} style={styles.header}>
            <LinearGradient
              colors={['#5B9BD5', '#4A7FB8']}
              style={styles.avatar}
            >
              <User size={48} color="#FFFFFF" strokeWidth={2.5} />
            </LinearGradient>
            
            <Text style={styles.name}>{user?.full_name}</Text>
            <Text style={styles.occupation}>{user?.occupation}</Text>
            
            {user?.is_pro && (
              <Animated.View entering={FadeIn.delay(300)}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.proBadge}
                >
                  <Crown size={18} color="#FFFFFF" fill="#FFFFFF" />
                  <Text style={styles.proText}>THÀNH VIÊN PRO</Text>
                </LinearGradient>
              </Animated.View>
            )}
          </Animated.View>

          {/* Stats Cards */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.statsContainer}>
            <LinearGradient
              colors={statCardGradient}
              style={styles.statCard}
            >
              <Calendar size={24} color={colors.primary} />
              <Text style={styles.statValue}>{user?.age}</Text>
              <Text style={styles.statLabel}>Tuổi</Text>
            </LinearGradient>

            <LinearGradient
              colors={statCardGradient}
              style={styles.statCard}
            >
              <Activity size={24} color={colors.primary} />
              <Text style={styles.statValue}>{user?.pain_areas?.length || 0}</Text>
              <Text style={styles.statLabel}>Vùng đau</Text>
            </LinearGradient>

            <LinearGradient
              colors={statCardGradient}
              style={styles.statCard}
            >
              <BarChart3 size={24} color={colors.primary} />
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Ngày tập</Text>
            </LinearGradient>
          </Animated.View>

          {/* Actions */}
          <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
            <Text style={styles.sectionTitle}>Tính năng</Text>

            {!user?.is_pro && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setQrDialogVisible(true);
                }}
              >
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.proCard}
                >
                  <View style={styles.proCardLeft}>
                    <Crown size={28} color="#FFFFFF" fill="#FFFFFF" />
                    <View style={styles.proCardText}>
                      <Text style={styles.proCardTitle}>Nâng cấp PRO</Text>
                      <Text style={styles.proCardDesc}>Mở khóa tất cả tính năng</Text>
                    </View>
                  </View>
                  <ChevronRight size={24} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            )}

            <View style={styles.menuCard}>
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={async () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  const newValue = !notificationsEnabled;
                  setNotificationsEnabled(newValue);
                  await AsyncStorage.setItem('notificationsEnabled', String(newValue));
                  let currentUser = user;
                  if (user) {
                    const updatedUser = await updateProfile({ notifications_enabled: newValue });
                    setUser(updatedUser);
                    currentUser = updatedUser;
                  }
                  if (newValue && currentUser) {
                    await registerForPushNotifications();
                    await rescheduleSmartNotifications(currentUser, true);
                  } else {
                    await cancelAllNotifications();
                  }
                }}
              >
                <View style={styles.menuItemLeft}>
                  <Animated.View
                    key={notificationsEnabled ? 'bell-on' : 'bell-off'}
                    entering={ZoomIn.springify()}
                  >
                    {notificationsEnabled ? (
                      <Bell size={24} color={colors.primary} />
                    ) : (
                      <BellOff size={24} color={colors.textSecondary} />
                    )}
                  </Animated.View>
                  <View style={styles.menuItemText}>
                    <Text style={styles.menuItemTitle}>Thông báo</Text>
                    <Text style={styles.menuItemDesc}>
                      {notificationsEnabled ? 'Đang bật' : 'Đang tắt'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={async (value) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setNotificationsEnabled(value);
                    await AsyncStorage.setItem('notificationsEnabled', String(value));
                    let currentUser = user;
                    if (user) {
                      const updatedUser = await updateProfile({ notifications_enabled: value });
                      setUser(updatedUser);
                      currentUser = updatedUser;
                    }
                    if (value && currentUser) {
                      await registerForPushNotifications();
                      await rescheduleSmartNotifications(currentUser, true);
                    } else {
                      await cancelAllNotifications();
                    }
                  }}
                  color={colors.primary}
                />
              </TouchableOpacity>

              <Divider style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push('/settings');
                }}
              >
                <View style={styles.menuItemLeft}>
                  <Settings size={24} color={colors.textSecondary} />
                  <View style={styles.menuItemText}>
                    <Text style={styles.menuItemTitle}>Cài đặt</Text>
                    <Text style={styles.menuItemDesc}>Thay đổi thông tin</Text>
                  </View>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <Divider style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push('/statistics');
                }}
              >
                <View style={styles.menuItemLeft}>
                  <BarChart3 size={24} color={colors.textSecondary} />
                  <View style={styles.menuItemText}>
                    <Text style={styles.menuItemTitle}>Thống kê</Text>
                    <Text style={styles.menuItemDesc}>Xem tiến độ</Text>
                  </View>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Sign Out */}
          <Animated.View entering={FadeInDown.delay(400)}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                setSignOutDialogVisible(true);
              }}
            >
              <View style={styles.signOutButton}>
                <LogOut size={20} color="#EF4444" strokeWidth={2} />
                <Text style={styles.signOutText}>Đăng xuất</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {/* Dialogs */}
      <Portal>
        {/* Sign Out Dialog */}
        <Dialog 
          visible={signOutDialogVisible} 
          onDismiss={() => setSignOutDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Content style={styles.signOutDialogContent}>
            <View style={styles.signOutDialogIcon}>
              <LogOut size={48} color="#EF4444" strokeWidth={1.5} />
            </View>
            <Text style={styles.signOutDialogTitle}>Đăng xuất?</Text>
            <Text style={styles.dialogText}>
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <Button 
              onPress={() => setSignOutDialogVisible(false)}
              textColor={colors.textSecondary}
              style={styles.dialogButton}
            >
              Hủy
            </Button>
            <Button
              onPress={handleSignOut}
              buttonColor="#EF4444"
              textColor="#FFFFFF"
              style={styles.dialogButton}
            >
              Đăng xuất
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* QR Code Dialog */}
        <Dialog 
          visible={qrDialogVisible} 
          onDismiss={() => setQrDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Content style={styles.proDialogContent}>
            <View style={styles.proDialogIcon}>
              <Crown size={48} color="#FFD700" fill="#FFD700" />
            </View>
            <Text style={styles.proDialogTitle}>Kích hoạt PRO</Text>
            <Text style={styles.dialogText}>
              Nhập mã kích hoạt từ sản phẩm TheraHome của bạn
            </Text>
            <TextInput
              label="Mã kích hoạt"
              value={activationCode}
              onChangeText={setActivationCode}
              mode="outlined"
              style={styles.input}
              autoCapitalize="characters"
              activeOutlineColor={colors.primary}
            />
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <Button 
              onPress={() => setQrDialogVisible(false)}
              textColor={colors.textSecondary}
              style={styles.dialogButton}
            >
              Hủy
            </Button>
            <Button
              onPress={handleActivateCode}
              loading={loading}
              disabled={!activationCode.trim() || loading}
              buttonColor={colors.primary}
              textColor="#FFFFFF"
              style={styles.dialogButton}
            >
              Kích hoạt
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </LinearGradient>
  );
}

const createStyles = (colors: any, width: number, isDark: boolean) =>
  StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    padding: width * 0.04,
    paddingTop: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  occupation: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  proText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  proCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  proCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  proCardText: {
    gap: 4,
  },
  proCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  proCardDesc: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  menuItemText: {
    gap: 4,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  menuItemDesc: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  menuDivider: {
    marginHorizontal: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 16,
    backgroundColor: isDark ? colors.surface : '#FFFFFF',
    borderWidth: 1.5,
    borderColor: isDark ? colors.border : '#FEE2E2',
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  dialog: {
    borderRadius: 24,
    backgroundColor: colors.surface,
  },
  signOutDialogContent: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
  },
  signOutDialogIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  signOutDialogTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  proDialogContent: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
  },
  proDialogIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  proDialogTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  dialogText: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  dialogActions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  dialogButton: {
    minWidth: 100,
  },
  input: {
    backgroundColor: colors.background,
    width: '100%',
    marginTop: 8,
  },
});
