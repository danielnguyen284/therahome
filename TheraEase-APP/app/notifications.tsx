import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Appbar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Bell, BellRing, CheckCheck } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/contexts/ThemeContext';
import type { NotificationInboxItem } from '@/types';
import {
  getNotificationInbox,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/services/notificationInbox';

function formatNotificationTime(value?: string | null) {
  if (!value) {
    return 'Vừa xong';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Vừa xong';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const [items, setItems] = useState<NotificationInboxItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getNotificationInbox();
      setItems(response.items || []);
      setUnreadCount(response.unread_count || 0);
    } catch (error) {
      console.error('Load notification inbox error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      void loadNotifications();
    }, [])
  );

  const handleMarkOne = async (item: NotificationInboxItem) => {
    if (item.is_read) {
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await markNotificationAsRead(item.id);
      setItems((current) =>
        current.map((notification) =>
          notification.id === item.id
            ? {
                ...notification,
                is_read: true,
                read_at: new Date().toISOString(),
              }
            : notification,
        ),
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (error) {
      console.error('Mark notification read error:', error);
    }
  };

  const handleMarkAll = async () => {
    if (markingAll || unreadCount === 0) {
      return;
    }

    try {
      setMarkingAll(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await markAllNotificationsAsRead();
      setItems((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
          read_at: notification.read_at || new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Mark all notifications read error:', error);
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <LinearGradient
      colors={isDark ? ['#0B1220', '#111827', '#1F2937'] : ['#EFF6FF', '#FFFFFF', '#F9FAFB']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Thông báo" subtitle={`${unreadCount} chưa xem`} />
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              void handleMarkAll();
            }}
            disabled={unreadCount === 0 || markingAll}
            style={[
              styles.markAllButton,
              unreadCount === 0 ? styles.markAllButtonDisabled : null,
            ]}
          >
            <CheckCheck size={18} color={unreadCount === 0 ? colors.textLight : colors.primary} />
            <Text
              style={[
                styles.markAllText,
                unreadCount === 0 ? styles.markAllTextDisabled : null,
              ]}
            >
              {markingAll ? 'Đang lưu' : 'Đã xem hết'}
            </Text>
          </TouchableOpacity>
        </Appbar.Header>

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => void loadNotifications(true)} />
            }
          >
            <View style={styles.summaryCard}>
              <View style={styles.summaryLeft}>
                <View style={styles.summaryIconWrap}>
                  <BellRing size={24} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.summaryTitle}>Hộp thư thông báo</Text>
                  <Text style={styles.summaryDescription}>
                    Mọi thông báo hệ thống đã gửi sẽ được lưu lại tại đây.
                  </Text>
                </View>
              </View>
              <View style={styles.summaryBadge}>
                <Text style={styles.summaryBadgeText}>{unreadCount}</Text>
              </View>
            </View>

            {items.length === 0 ? (
              <View style={styles.emptyCard}>
                <Bell size={28} color={colors.textLight} />
                <Text style={styles.emptyTitle}>Chưa có thông báo nào</Text>
                <Text style={styles.emptyDescription}>
                  Khi hệ thống gửi nhắc nhở, nội dung sẽ được lưu lại ở đây để bạn xem lại bất cứ lúc nào.
                </Text>
              </View>
            ) : (
              items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.86}
                  onPress={() => {
                    void handleMarkOne(item);
                  }}
                  style={[
                    styles.notificationCard,
                    !item.is_read ? styles.notificationCardUnread : null,
                  ]}
                >
                  <View style={styles.notificationTopRow}>
                    <View style={styles.notificationMeta}>
                      <Text style={styles.notificationTime}>
                        {formatNotificationTime(item.sent_at || item.created_at)}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          item.is_read ? styles.statusBadgeRead : styles.statusBadgeUnread,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            item.is_read ? styles.statusBadgeTextRead : styles.statusBadgeTextUnread,
                          ]}
                        >
                          {item.is_read ? 'Đã xem' : 'Mới'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.notificationTitle}>{item.title}</Text>
                  <Text style={styles.notificationBody}>{item.body}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
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
      backgroundColor: 'transparent',
      elevation: 0,
    },
    markAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 999,
      marginRight: 12,
      backgroundColor: isDark ? 'rgba(91, 155, 213, 0.18)' : '#EAF3FF',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(91, 155, 213, 0.25)' : '#D7E8FB',
    },
    markAllButtonDisabled: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6',
      borderColor: colors.border,
    },
    markAllText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary,
    },
    markAllTextDisabled: {
      color: colors.textLight,
    },
    loadingState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      padding: 20,
      paddingTop: 8,
      paddingBottom: 120,
      gap: 14,
    },
    summaryCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 18,
      borderRadius: 24,
      backgroundColor: isDark ? 'rgba(17, 24, 39, 0.92)' : '#FFFFFF',
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#0F172A',
      shadowOpacity: isDark ? 0.15 : 0.06,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
    },
    summaryLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingRight: 12,
    },
    summaryIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(91, 155, 213, 0.18)' : '#EAF3FF',
    },
    summaryTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 4,
    },
    summaryDescription: {
      fontSize: 13.5,
      lineHeight: 20,
      color: colors.textSecondary,
      maxWidth: '92%',
    },
    summaryBadge: {
      minWidth: 42,
      height: 42,
      paddingHorizontal: 12,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    summaryBadgeText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '800',
    },
    emptyCard: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      paddingHorizontal: 24,
      borderRadius: 24,
      backgroundColor: isDark ? 'rgba(17, 24, 39, 0.88)' : '#FFFFFF',
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
    },
    emptyDescription: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    notificationCard: {
      padding: 18,
      borderRadius: 22,
      backgroundColor: isDark ? 'rgba(17, 24, 39, 0.9)' : '#FFFFFF',
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#0F172A',
      shadowOpacity: isDark ? 0.12 : 0.05,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
    },
    notificationCardUnread: {
      borderColor: '#BFDBFE',
      backgroundColor: isDark ? 'rgba(16, 24, 39, 0.95)' : '#F8FBFF',
    },
    notificationTopRow: {
      marginBottom: 10,
    },
    notificationMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    notificationTime: {
      fontSize: 12.5,
      fontWeight: '600',
      color: colors.textSecondary,
      flex: 1,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
    },
    statusBadgeUnread: {
      backgroundColor: '#DBEAFE',
    },
    statusBadgeRead: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6',
    },
    statusBadgeText: {
      fontSize: 11.5,
      fontWeight: '800',
    },
    statusBadgeTextUnread: {
      color: '#1D4ED8',
    },
    statusBadgeTextRead: {
      color: colors.textSecondary,
    },
    notificationTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 8,
    },
    notificationBody: {
      fontSize: 14.5,
      lineHeight: 22,
      color: colors.textSecondary,
    },
  });
