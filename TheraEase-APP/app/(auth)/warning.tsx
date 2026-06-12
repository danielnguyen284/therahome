import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, ZoomIn, FadeInRight } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function WarningScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const disease = params.disease as string;
  const { user, setUser } = useAuthStore();

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(auth)/thera-home');
  };

  // Nếu chọn thoái hóa, thoát vị, tất cả
  const isSevere = disease === 'Thoái hoá' || disease === 'Thoát vị' || disease === 'Tất cả';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        <View style={styles.avatarContainer}>
          <Animated.Image
            entering={ZoomIn.duration(800).springify()}
            source={require('../../assets/Xin chao tôi là trợ lí.png')}
            style={styles.avatar}
          />
        </View>

        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <Text style={styles.title}>XIN CHÀO!</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
          <Text style={styles.description}>
            {isSevere ? (
              <>
                Sức khoẻ cột sống của bạn đang ở giai đoạn cần <Text style={styles.highlightText}>cải thiện</Text> và <Text style={styles.highlightText}>bảo tồn</Text> gấp để tránh các biến chứng nguy hiểm:
              </>
            ) : (
              <>
                Sức khỏe cột sống của bạn đang phát tín hiệu <Text style={styles.highlightText}>cần được quan tâm sớm</Text>, nên can thiệp sớm nếu để lâu sẽ dẫn đến:
              </>
            )}
          </Text>
        </Animated.View>

        <View style={styles.bulletsContainer}>
          {isSevere ? (
            <>
              <Animated.View entering={FadeInRight.delay(600).duration(400)} style={styles.bulletRow}>
                <View style={styles.bulletPoint} />
                <Text style={styles.bulletText}>
                  Yếu <Text style={styles.highlightText}>liệt</Text> nửa/toàn thân
                </Text>
              </Animated.View>
              <Animated.View entering={FadeInRight.delay(800).duration(400)} style={styles.bulletRow}>
                <View style={styles.bulletPoint} />
                <Text style={styles.bulletText}>
                  Gián tiếp gây <Text style={styles.highlightText}>đột quỵ/tai biến</Text> nhẹ
                </Text>
              </Animated.View>
            </>
          ) : (
            <>
              <Animated.View entering={FadeInRight.delay(600).duration(400)} style={styles.bulletRow}>
                <View style={styles.bulletPoint} />
                <Text style={styles.bulletText}>
                  Thoái hóa/ thoái vị
                </Text>
              </Animated.View>
              <Animated.View entering={FadeInRight.delay(800).duration(400)} style={styles.bulletRow}>
                <View style={styles.bulletPoint} />
                <Text style={styles.bulletText}>
                  Chèn ép dây thần kinh/tủy
                </Text>
              </Animated.View>
            </>
          )}
        </View>

        <Animated.View entering={FadeInDown.delay(1000).duration(600)} style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleNext}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            buttonColor="#3B82F6"
            uppercase={false}
          >
            CẢI THIỆN NGAY
          </Button>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: width * 0.08,
    paddingTop: 40,
  },
  avatarContainer: {
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  avatar: {
    width: width * 0.35,
    height: width * 0.35,
    borderRadius: (width * 0.35) / 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 20,
    color: '#000000',
    lineHeight: 30,
    fontWeight: '400',
    marginBottom: 24,
  },
  highlightText: {
    color: '#3B82F6',
  },
  bulletsContainer: {
    paddingLeft: 10,
    marginBottom: 20,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000000',
    marginRight: 10,
  },
  bulletText: {
    fontSize: 18,
    color: '#000000',
    lineHeight: 26,
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 40,
  },
  button: {
    width: '100%',
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonContent: {
    paddingVertical: 12,
  },
  buttonLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 28,
  },
});
