import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, List, Switch, Button, Divider, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { signOut, updateProfile } from '@/services/auth';
import { rescheduleSmartNotifications, cancelAllNotifications, registerForPushNotifications } from '@/services/notifications';
import { useTheme } from '@/contexts/ThemeContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { colors, themeMode, setThemeMode } = useTheme();
  const styles = createStyles(colors);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Derive unlocked state similarly to home.tsx (or assume true if bypassed)
  const personalizedPlanUnlocked = true;

  useFocusEffect(
    React.useCallback(() => {
      if (typeof user?.notifications_enabled === 'boolean') {
        setNotificationsEnabled(user.notifications_enabled);
        void AsyncStorage.setItem('notificationsEnabled', String(user.notifications_enabled));
        return;
      }

      AsyncStorage.getItem('notificationsEnabled').then((val: string | null) => {
        if (val !== null) {
          setNotificationsEnabled(val === 'true');
          return;
        }
      });
    }, [user?.notifications_enabled])
  );

  const handleNotificationToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('notificationsEnabled', String(value));

    let currentUser = user;

    if (user) {
      const updatedUser = await updateProfile({ notifications_enabled: value });
      useAuthStore.getState().setUser(updatedUser);
      currentUser = updatedUser;
    }

    if (value && currentUser) {
      await registerForPushNotifications();
      await rescheduleSmartNotifications(currentUser, personalizedPlanUnlocked);
    } else {
      await cancelAllNotifications();
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Nút Back */}
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}
        style={styles.backButton}
      >
        <ArrowLeft size={24} color={colors.primary} strokeWidth={2.5} />
      </TouchableOpacity>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Cài đặt</Text>
        </View>

      {/* Profile Section */}
      <List.Section>
        <List.Subheader>Tài khoản</List.Subheader>
        <List.Item
          title="Chỉnh sửa hồ sơ"
          description="Họ tên, tuổi, nghề nghiệp"
          left={props => <List.Icon {...props} icon="account" />}
          onPress={() => router.push('/edit-profile')}
        />
        <List.Item
          title="Triệu chứng"
          description="Cập nhật tình trạng sức khỏe"
          left={props => <List.Icon {...props} icon="medical-bag" />}
          onPress={() => router.push('/edit-symptoms')}
        />
      </List.Section>

      <Divider />

      {/* Notifications Section */}
      <List.Section>
        <List.Subheader>Thông báo</List.Subheader>
        <List.Item
          title="Nhắc nhở tập luyện"
          description={notificationsEnabled ? 'Đang bật' : 'Đang tắt'}
          left={props => <List.Icon {...props} icon="bell" />}
          right={() => (
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
            />
          )}
        />
        {notificationsEnabled && (
          <List.Item
            title="Lịch gửi thông báo"
            description="Do quản trị viên thiết lập"
            left={props => <List.Icon {...props} icon="clock" />}
          />
        )}
      </List.Section>

      <Divider />

      {/* Appearance Section */}
      <List.Section>
        <List.Subheader>Giao diện</List.Subheader>
        <View style={styles.themeSegmentWrap}>
          <SegmentedButtons
            value={themeMode}
            onValueChange={(value) => setThemeMode(value as 'light' | 'dark' | 'auto')}
            buttons={[
              { value: 'light', label: 'Sáng' },
              { value: 'dark', label: 'Tối' },
              { value: 'auto', label: 'Tự động' },
            ]}
          />
        </View>
      </List.Section>

      <Divider />

      {/* About Section */}
      <List.Section>
        <List.Subheader>Về ứng dụng</List.Subheader>
        <List.Item
          title="Giới thiệu"
          left={props => <List.Icon {...props} icon="information" />}
          onPress={() => router.push('/about')}
        />
        <List.Item
          title="Chính sách bảo mật"
          left={props => <List.Icon {...props} icon="shield-check" />}
          onPress={() => router.push('/privacy')}
        />
        <List.Item
          title="Điều khoản sử dụng"
          left={props => <List.Icon {...props} icon="file-document" />}
          onPress={() => router.push('/terms')}
        />
        <List.Item
          title="Phiên bản"
          description="1.0.0"
          left={props => <List.Icon {...props} icon="information-outline" />}
        />
      </List.Section>

      <View style={styles.footer}>
        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutButton}
          textColor={colors.error}
        >
          Đăng xuất
        </Button>
      </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    backButton: {
      position: 'absolute',
      top: 60,
      left: 16,
      zIndex: 10,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
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
    scrollContent: {
      paddingBottom: 150, // Space for tab bar + floating button
    },
    header: {
      padding: 16,
      paddingTop: 60,
      paddingLeft: 70,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
    },
    themeSegmentWrap: {
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    footer: {
      padding: 16,
      paddingBottom: 40,
    },
    logoutButton: {
      borderColor: colors.error,
    },
  });
