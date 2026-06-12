import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface AuthLoadingModalProps {
  visible: boolean;
  message?: string;
}

export default function AuthLoadingModal({ 
  visible, 
  message = 'Đang kết nối với Google...' 
}: AuthLoadingModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View 
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={styles.container}
        >
          <LinearGradient
            colors={['#5B9BD5', '#4A7FB8']}
            style={styles.gradient}
          >
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.message}>{message}</Text>
            <Text style={styles.hint}>
              Bạn sẽ được chuyển đến trang đăng nhập Google
            </Text>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '80%',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradient: {
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  hint: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});
