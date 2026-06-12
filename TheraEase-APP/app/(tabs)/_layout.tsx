import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Home, Activity, Sparkles, User, Library } from 'lucide-react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import FloatingChatbot from '@/components/FloatingChatbot';
import { useTheme } from '@/contexts/ThemeContext';

// Animated Icon Component
function AnimatedTabIcon({ Icon, color, size, focused }: any) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(focused ? 1.15 : 1, { damping: 15, stiffness: 150 }) },
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Icon size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
    </Animated.View>
  );
}

export default function TabsLayout() {
  const { colors, isDark } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            height: 88,
            paddingBottom: 28,
            paddingTop: 8,
          },
          tabBarBackground: () => (
            <BlurView
              intensity={100}
              tint={isDark ? 'dark' : 'light'}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                overflow: 'hidden',
              }}
            />
          ),
          animation: 'shift',
          tabBarHideOnKeyboard: true,
        }}
        screenListeners={{
          tabPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Trang chủ',
            tabBarIcon: ({ color, size, focused }) => (
              <AnimatedTabIcon Icon={Home} color={color} size={size} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="posture"
          options={{
            title: 'Tư thế',
            tabBarIcon: ({ color, size, focused }) => (
              <AnimatedTabIcon Icon={Activity} color={color} size={size} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Khám phá',
            tabBarIcon: ({ color, size, focused }) => (
              <AnimatedTabIcon Icon={Sparkles} color={color} size={size} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Thư viện',
            tabBarIcon: ({ color, size, focused }) => (
              <AnimatedTabIcon Icon={Library} color={color} size={size} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Cá nhân',
            tabBarIcon: ({ color, size, focused }) => (
              <AnimatedTabIcon Icon={User} color={color} size={size} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="exercises"
          options={{
            href: null, // Keep old Exercises screen in code, hidden from tab bar
          }}
        />
        <Tabs.Screen
          name="devices"
          options={{
            href: null, // Keep old Devices screen in code, hidden from tab bar
          }}
        />
        {/* Hide settings and chat tabs */}
        <Tabs.Screen
          name="settings"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            href: null, // Hide from tab bar
          }}
        />
      </Tabs>
      
      {/* Floating Chatbot - Available on all tabs */}
      <FloatingChatbot />
    </View>
  );
}
