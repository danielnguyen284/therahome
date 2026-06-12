import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Searchbar, Chip, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Dumbbell } from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { useExerciseStore } from '@/stores/exerciseStore';
import { getExercises } from '@/services/exercises';
import ExerciseCard from '@/components/ExerciseCard';
import { colors } from '@/utils/theme';
import type { Exercise } from '@/types';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

import { mapPainAreasToCategories } from '@/utils/categoryMapper';

const { width } = Dimensions.get('window');

export default function ExercisesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { exercises, setExercises, recommendedExercises } = useExerciseStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [availableTabs, setAvailableTabs] = useState<string[]>([]);

  useEffect(() => {
    loadExercises();
  }, []);

  useEffect(() => {
    filterExercises();
  }, [exercises, selectedTab, searchQuery, recommendedExercises]);

  useEffect(() => {
    // Get unique pain areas from user and create tabs
    if (exercises.length > 0) {
      const userPainAreas = user?.pain_areas || [];
      const tabs = ['all']; // Always have "all" tab
      
      // Add tabs based on user's pain areas
      if (userPainAreas.includes('neck')) tabs.push('neck');
      if (userPainAreas.includes('back') || 
          userPainAreas.includes('upper_back') || 
          userPainAreas.includes('middle_back') || 
          userPainAreas.includes('lower_back')) {
        tabs.push('back');
      }
      
      // Check if there are exercises for other categories
      const hasArm = exercises.some(ex => ex.category === 'arm');
      const hasLeg = exercises.some(ex => ex.category === 'leg');
      const hasShoulder = exercises.some(ex => ex.category === 'shoulder');
      
      if (hasArm) tabs.push('arm');
      if (hasLeg) tabs.push('leg');
      if (hasShoulder && !tabs.includes('neck')) tabs.push('shoulder');
      
      // Add recommended tab if there are recommendations
      if (recommendedExercises.length > 0) tabs.push('recommended');
      
      setAvailableTabs(tabs);
    }
  }, [exercises, user, recommendedExercises]);

  const loadExercises = async () => {
    try {
      setLoading(true);
      
      // Thêm timeout 3 giây
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 3000)
      );
      
      const exercisesPromise = getExercises();
      const result = await Promise.race([exercisesPromise, timeout]) as any;
      
      if (result.error) {
        console.error('Load exercises error:', result.error);
        return;
      }

      if (result.data) {
        // Filter by PRO status
        const availableExercises = user?.is_pro 
          ? result.data 
          : result.data.filter((ex: Exercise) => !ex.is_pro);
        
        setExercises(availableExercises);
      }
    } catch (error) {
      console.error('Load exercises timeout/error:', error);
      // Set empty array nếu timeout
      setExercises([]);
    } finally {
      setLoading(false);
    }
  };

  const filterExercises = () => {
    let filtered = exercises;

    // Filter by tab
    if (selectedTab === 'neck') {
      const neckCategories = mapPainAreasToCategories(['neck']);
      filtered = filtered.filter(ex => neckCategories.includes(ex.category));
    } else if (selectedTab === 'back') {
      const backCategories = mapPainAreasToCategories(['back']);
      filtered = filtered.filter(ex => backCategories.includes(ex.category));
    } else if (selectedTab === 'arm') {
      filtered = filtered.filter(ex => ex.category === 'arm');
    } else if (selectedTab === 'leg') {
      filtered = filtered.filter(ex => ex.category === 'leg');
    } else if (selectedTab === 'shoulder') {
      filtered = filtered.filter(ex => ex.category === 'shoulder');
    } else if (selectedTab === 'recommended') {
      const recommendedIds = recommendedExercises.map(ex => ex.id);
      filtered = filtered.filter(ex => recommendedIds.includes(ex.id));
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(ex =>
        ex.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredExercises(filtered);
  };

  const getTabLabel = (tab: string): string => {
    const labels: Record<string, string> = {
      all: 'Tất cả',
      neck: 'Cổ',
      back: 'Lưng',
      shoulder: 'Vai',
      arm: 'Tay',
      leg: 'Chân',
      recommended: 'Dành cho bạn',
    };
    return labels[tab] || tab;
  };

  const handleExercisePress = (exercise: Exercise) => {
    router.push({
      pathname: '/exercise-detail',
      params: { id: exercise.id },
    });
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#EFF6FF', '#FFFFFF', '#F9FAFB']}
        style={styles.loadingContainer}
      >
        <Dumbbell size={48} color={colors.primary} />
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 16 }} />
        <Text style={styles.loadingText}>Đang tải bài tập...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#EFF6FF', '#FFFFFF', '#F9FAFB']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View style={styles.titleRow}>
            <Dumbbell size={32} color={colors.primary} />
            <Text style={styles.title}>Bài tập</Text>
          </View>
          
          <Searchbar
            placeholder="Tìm bài tập..."
            onChangeText={(text) => {
              setSearchQuery(text);
              if (text) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            value={searchQuery}
            style={styles.searchbar}
            inputStyle={styles.searchInput}
          />

          {/* Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsContainer}
            contentContainerStyle={styles.tabsContent}
          >
            {availableTabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setSelectedTab(tab);
                }}
              >
                <LinearGradient
                  colors={selectedTab === tab ? ['#5B9BD5', '#4A7FB8'] : ['#FFFFFF', '#F5F5F5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.tabChip, selectedTab === tab && styles.tabChipSelected]}
                >
                  <Text style={[styles.tabText, selectedTab === tab && styles.tabTextSelected]}>
                    {getTabLabel(tab)}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Exercise List */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredExercises.length === 0 ? (
            <Animated.View entering={FadeIn.duration(400)} style={styles.emptyContainer}>
              <Dumbbell size={64} color={colors.textSecondary} strokeWidth={1.5} />
              <Text style={styles.emptyText}>Không tìm thấy bài tập</Text>
              <Text style={styles.emptySubtext}>Thử tìm kiếm với từ khóa khác</Text>
            </Animated.View>
          ) : (
            filteredExercises.map((exercise, index) => (
              <Animated.View
                key={exercise.id}
                entering={FadeInDown.delay(index * 50).springify()}
              >
                <ExerciseCard
                  exercise={exercise}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    handleExercisePress(exercise);
                  }}
                  recommended={recommendedExercises.some(ex => ex.id === exercise.id)}
                />
              </Animated.View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  header: {
    padding: width * 0.04,
    paddingTop: 16,
    backgroundColor: 'transparent',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: 18,
    zIndex: 1,
  },
  searchbar: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 16,
  },
  searchInput: {
    paddingLeft: 32,
  },
  tabsContainer: {
    marginHorizontal: -width * 0.04,
  },
  tabsContent: {
    paddingHorizontal: width * 0.04,
    gap: 12,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabChipSelected: {
    shadowOpacity: 0.3,
    elevation: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextSelected: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: width * 0.04,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
});
