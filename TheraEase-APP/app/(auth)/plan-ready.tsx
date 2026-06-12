import React from 'react';
import { View, StyleSheet, Dimensions, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/stores/authStore';
import Animated, { FadeInUp, FadeInDown, ZoomIn } from 'react-native-reanimated';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

const PLAN_DAYS = [
  { id: 1, title: 'Flexibility Boost' },
  { id: 2, title: 'Back Care' },
  { id: 3, title: 'Hip Opening' },
  { id: 4, title: 'Rest Day', isRest: true },
  { id: 5, title: 'Power Flow' },
  { id: 6, title: 'Detox Flow' },
  { id: 7, title: 'Rest Day', isRest: true },
  { id: 8, title: 'Deep Stretch' },
  { id: 9, title: 'Core Strength' },
  { id: 10, title: 'Balance' },
  { id: 11, title: 'Rest Day', isRest: true },
  { id: 12, title: 'Blissful Balance' },
  { id: 13, title: 'Energizing Boost' },
  { id: 14, title: 'Rest Day', isRest: true },
];

export default function PlanReadyScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(auth)/device-offer');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Animated.View entering={FadeInUp.duration(600).springify()}>
            <Text style={styles.title}>
              Chào bạn<Text style={styles.bold}>{user?.full_name?.trim() ? ` ${user.full_name.trim()}` : ''}</Text>,{'\n'}
              Lộ trình cá nhân hoá, ngay tại nhà của bạn đã sẵn sàng!
            </Text>
          </Animated.View>

          {/* Chart Section */}
          <View style={styles.chartContainer}>
             <View style={styles.chartLabels}>
                <Text style={styles.chartTitle}>Mục tiêu</Text>
             </View>
             
             <View style={styles.svgWrapper}>
                <Svg height="150" width={width - 40} viewBox={`0 0 ${width - 40} 150`}>
                   <Defs>
                      <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                         <Stop offset="0" stopColor="#F59E0B" stopOpacity="0.8" />
                         <Stop offset="1" stopColor="#10B981" stopOpacity="0.8" />
                      </LinearGradient>
                   </Defs>
                   {/* Background Line */}
                   <Path 
                     d={`M 0 120 Q ${(width-40)/2} 100, ${width-40} 20`} 
                     stroke="#E5E7EB" 
                     strokeWidth="6" 
                     fill="none" 
                   />
                   {/* Progress Line */}
                   <Path 
                     d={`M 0 120 Q ${(width-40)/2} 100, ${width-40} 20`} 
                     stroke="url(#grad)" 
                     strokeWidth="6" 
                     fill="none" 
                   />
                   {/* Start Point */}
                   <Circle cx="50" cy="115" r="8" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="4" />
                   {/* Goal Point */}
                   <Circle cx={width - 90} cy="35" r="10" fill="#FFFFFF" stroke="#10B981" strokeWidth="5" />
                   
                   {/* Indicator Line at Goal */}
                   <Path d={`M ${width-90} 35 L ${width-90} 15`} stroke="#10B981" strokeWidth="2" />
                   <Circle cx={width - 90} cy="10" r="4" fill="#10B981" />
                </Svg>
                
                <View style={[styles.chartMarker, { left: 35, top: 85 }]}>
                   <Text style={styles.markerText}>Bây giờ</Text>
                   <View style={styles.markerLine} />
                </View>

                <View style={styles.timeline}>
                   <Text style={styles.timeText}>Ngày 1</Text>
                   <Text style={styles.timeText}>Ngày 7</Text>
                   <Text style={styles.timeText}>Ngày 14</Text>
                </View>
             </View>
          </View>

          {/* Plan Grid */}
          <View style={styles.planContainer}>
             <View style={styles.planHeader}>
                <Text style={styles.planTitle}>Lộ trình 14 ngày</Text>
             </View>

             <View style={styles.topSection}>
                <View style={styles.topLeftGrid}>
                   {PLAN_DAYS.slice(0, 4).map((day, index) => (
                      <Animated.View 
                        key={day.id} 
                        entering={ZoomIn.delay(100 * index).duration(400)}
                        style={[styles.gridItem, { width: '47%' }]}
                      >
                         <Text style={styles.dayNumber}>{day.id}</Text>
                      </Animated.View>
                   ))}
                </View>

                <View style={styles.topRightImage}>
                   <View style={styles.planIllustrationCard}>
                      <Image
                        source={require('../../assets/Lấy lộ trình.png')}
                        style={styles.planIllustrationImage}
                        resizeMode="contain"
                      />
                   </View>
                </View>
             </View>
             
             <View style={styles.bottomGrid}>
                {PLAN_DAYS.slice(4).map((day, index) => (
                   <Animated.View 
                     key={day.id} 
                     entering={ZoomIn.delay(100 * (index + 4)).duration(400)}
                     style={styles.gridItem}
                   >
                      <Text style={styles.dayNumber}>{day.id}</Text>
                   </Animated.View>
                ))}
                <View style={{ width: '23%' }} />
                <View style={{ width: '23%' }} />
             </View>

             <TouchableOpacity 
               onPress={handleNext}
               style={styles.ctaButton}
               activeOpacity={0.9}
             >
                <Text style={styles.ctaText}>LẤY LỘ TRÌNH</Text>
             </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  title: {
    fontSize: 22,
    color: '#333',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 40,
  },
  bold: {
    fontWeight: 'bold',
    color: '#333',
  },
  chartContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 15,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  chartLabels: {
    alignItems: 'flex-end',
    marginBottom: 5,
  },
  chartTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1F2937',
    fontFamily: 'serif',
  },
  svgWrapper: {
    position: 'relative',
  },
  chartMarker: {
    position: 'absolute',
    alignItems: 'center',
  },
  markerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  markerLine: {
    width: 2,
    height: 10,
    backgroundColor: '#F59E0B',
  },
  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  planContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 25,
    paddingTop: 0,
    marginBottom: 40,
    overflow: 'hidden',
  },
  planHeader: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    alignItems: 'center',
  },
  planTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  topSection: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingTop: 14,
    justifyContent: 'space-between',
  },
  topLeftGrid: {
    width: '49%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'flex-start',
  },
  topRightImage: {
    width: '49%',
    alignItems: 'flex-end',
  },
  bottomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    justifyContent: 'space-between',
  },
  planIllustrationCard: {
    width: width * 0.36,
    height: width * 0.44,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  planIllustrationImage: {
    width: '100%',
    height: '100%',
  },
  gridItem: {
    width: '23%',
    minHeight: 76,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 10,
    paddingHorizontal: 6,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  ctaButton: {
    backgroundColor: '#3B82F6',
    margin: 15,
    marginTop: 5,
    paddingVertical: 18,
    borderRadius: 35,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  ctaText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
