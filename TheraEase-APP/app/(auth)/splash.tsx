import React from 'react';
import { View, StyleSheet, Dimensions, ImageBackground, TouchableOpacity, Image } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp, FadeInDown, FadeIn } from 'react-native-reanimated';
import { ArrowRight, Home } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();

  const handleStart = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(auth)/welcome');
  };
  

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/background_login.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            
            {/* Center Logo Section */}
            <View style={styles.logoContainer}>
              <Animated.View entering={FadeInUp.duration(1000)} style={styles.logoImageContainer}>
                <Image 
                  source={require('../../assets/TheraHome_logo_black.png')} 
                  style={styles.logoImage} 
                  resizeMode="contain" 
                 />
              </Animated.View>
              <Animated.View entering={FadeIn.delay(1000).duration(1500)}>
                <Text style={styles.subtitle}>
                  14 NGÀY CẢI THIỆN TẠI NHÀ CÙNG AI
                </Text>
              </Animated.View>
            </View>

            {/* Bottom Actions */}
            <View style={styles.bottomSection}>
              <Animated.View entering={FadeInDown.delay(500).duration(800)}>
                <TouchableOpacity activeOpacity={0.85} onPress={handleStart} style={styles.mainButton}>
                  <Text style={styles.mainButtonText}>BẮT ĐẦU</Text>
                  <ArrowRight size={24} color="#FFF" style={{ marginLeft: 8 }} />
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
  },
  content: {
    flex: 1,
    paddingHorizontal: width * 0.08,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 'auto',
    marginTop: '50%',
  },
  logoImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: width * 0.8,
    height: width * 0.25,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bottomSection: {
    paddingBottom: 40,
    width: '100%',
  },
  mainButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 30,
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  }
});
