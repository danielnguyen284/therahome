import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Check } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function UnderstandingScreen() {
  const router = useRouter();

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(auth)/medical-history');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        <Animated.View entering={FadeInDown.duration(600)}>
          <Text style={styles.title}>Chúng tôi hiểu mong muốn{'\n'}của bạn!</Text>
        </Animated.View>

        <Animated.View entering={ZoomIn.delay(300).duration(800).springify()} style={styles.iconContainer}>
          <View style={styles.checkCircle}>
            <Check size={width * 0.15} color="#FFFFFF" strokeWidth={3} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(600)}>
          <Text style={styles.subtitle}>
            Chúng ta sẽ bắt đầu từ mục tiêu{'\n'}nhỏ, thực tế
          </Text>
          <Text style={styles.description}>
            Trước tiên <Text style={styles.highlightText}>kiểm tra tình trạng</Text> của bạn hiện tại
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(700).duration(600)} style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleNext}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            buttonColor="#3B82F6"
            uppercase={false}
          >
            Kiểm tra tình trạng
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
    paddingTop: 80,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 36,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  checkCircle: {
    width: width * 0.35,
    height: width * 0.35,
    borderRadius: (width * 0.35) / 2,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
  },
  highlightText: {
    color: '#3B82F6',
  },
  buttonContainer: {
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
    textTransform: 'none',
    lineHeight: 28,
  },
});
