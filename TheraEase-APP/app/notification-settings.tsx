import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Bell, ShieldCheck } from 'lucide-react-native';
import { colors } from '@/utils/theme';

export default function NotificationSettingsScreen() {
  const router = useRouter();

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
        <Text style={styles.headerTitle}>Lịch thông báo</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.description}>
          Khung giờ gửi thông báo được cấu hình tập trung để nội dung nhắc nhở đồng bộ cho toàn bộ người dùng.
        </Text>

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Bell size={22} color={colors.primary} />
            <Text style={styles.infoTitle}>Giờ gửi do quản trị viên thiết lập</Text>
          </View>
          <Text style={styles.infoText}>
            Bạn không thể tự thay đổi giờ nhắc trên ứng dụng. Khi cần cập nhật lịch gửi, đội ngũ quản trị sẽ điều chỉnh từ trang quản trị.
          </Text>
        </View>

        <View style={styles.noteCard}>
          <View style={styles.infoHeader}>
            <ShieldCheck size={22} color={colors.success} />
            <Text style={styles.infoTitle}>Bạn vẫn kiểm soát việc nhận thông báo</Text>
          </View>
          <Text style={styles.infoText}>
            Bạn vẫn có thể bật hoặc tắt thông báo bất cứ lúc nào trong phần Cài đặt của ứng dụng.
          </Text>
        </View>

        <Button
          mode="contained"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backAction}
        >
          Quay lại cài đặt
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
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  infoCard: {
    marginBottom: 20,
    padding: 24,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  noteCard: {
    marginBottom: 32,
    padding: 24,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  infoText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  backAction: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 6,
  },
});
