import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { createGuestUser, useAuthStore } from '@/stores/authStore';
import { colors } from '@/utils/theme';

export default function Index() {
  const router = useRouter();
  const { user, isLoading, setUser } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      // Add small delay to ensure layout is mounted
      setTimeout(() => {
        if (user) {
          if (user.id === 'guest') {
            router.replace('/(auth)/splash');
          } else if (user.onboarding_completed) {
            router.replace('/(tabs)/home');
          } else {
            router.replace('/(auth)/splash');
          }
        } else {
          setUser(createGuestUser());
          router.replace('/(auth)/splash');
        }
      }, 100);
    }
  }, [user, isLoading, router, setUser]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
