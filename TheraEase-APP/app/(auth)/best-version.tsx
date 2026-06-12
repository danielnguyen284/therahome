import React from 'react';
import { View, StyleSheet, Dimensions, ImageBackground, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function BestVersionScreen() {
  const router = useRouter();

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(auth)/plan-ready');
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/Bạn có muốn 2026.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <Animated.View entering={FadeInUp.duration(800)}>
              <Text style={styles.smallTitle}>Bạn muốn...</Text>
              <Text style={styles.mainTitle}>
                <Text style={styles.yearText}>2026{'\n'}</Text>
                Gặp Gỡ Phiên Bản Tốt Hơn Của Chính Bạn!
              </Text>
            </Animated.View>

            <View style={styles.footer}>
              <Animated.View entering={FadeInDown.delay(500).duration(800)}>
                <TouchableOpacity 
                  onPress={handleNext}
                  style={styles.mainButton}
                  activeOpacity={0.9}
                >
                  <Text style={styles.buttonText}>CÓ!</Text>
                </TouchableOpacity>


              </Animated.View>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)', // Overlay
  },
  content: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: 40,
  },
  smallTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '500',
    marginBottom: 10,
  },
  mainTitle: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: 'bold',
    lineHeight: 44,
  },
  yearText: {
    fontSize: 40,
  },
  footer: {
    marginTop: 'auto',
    marginBottom: 60,
    alignItems: 'center',
  },
  mainButton: {
    backgroundColor: '#FFFFFF',
    width: width * 0.85,
    paddingVertical: 18,
    borderRadius: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
});

