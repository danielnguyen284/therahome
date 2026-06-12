import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image, Modal, StatusBar } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '@/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Library, PlayCircle, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { api } from '@/services/api';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import VideoPlayer from '@/components/VideoPlayer';

interface LibraryItem {
  _id: string;
  title: string;
  category: string;
  coverImage: string;
  link: string;
}

const DEFAULT_CATEGORIES = [
  'Hiểu đúng về bài tập',
  'Liệu pháp MC GILL',
  'Liệu pháp MC KENZIE',
  'Yoga Trị Liệu',
  'Dưỡng sinh Trị liệu',
  'Tập cùng TheraNECK'
];

const DEFAULT_LINK = 'https://www.youtube.com/watch?v=2UkYJTfaT8E';

export default function LibraryScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeVideo, setActiveVideo] = useState<{ url: string; title: string } | null>(null);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await api.get('/library');
      setItems(data || []);
    } catch (error) {
      console.error('Failed to load library items:', error);
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadItems();
  }, []);

  const handleWatchVideo = (item: LibraryItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveVideo({ url: item.link, title: item.title || item.category });
  };

  const handleCloseVideo = () => {
    setActiveVideo(null);
  };

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, LibraryItem[]>);

  // Ensure displaying categories in specific order if possible
  const displayCategories = [...new Set([...DEFAULT_CATEGORIES, ...Object.keys(groupedItems)])];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={styles.headerTitleRow}>
          <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}20` }]}>
            <Library size={24} color={colors.primary} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Thư viện</Text>
        </View>
        <Text style={[styles.headerDesc, { color: colors.textSecondary }]}>
          Khám phá các bài tập và liệu pháp phục hồi chuyên sâu.
        </Text>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {items.length === 0 && !loading && (
          <View style={{ alignItems: 'center', marginTop: 40, opacity: 0.5 }}>
            <Library size={48} color={colors.text} />
            <Text style={{ marginTop: 16, fontSize: 16, color: colors.text }}>
              Chưa có mục nội dung nào ở đây
            </Text>
          </View>
        )}

        {displayCategories.map((category, catIndex) => {
          const categoryItems = groupedItems[category];
          if (!categoryItems || categoryItems.length === 0) return null;

          return (
            <Animated.View 
              key={`cat-${category}`} 
              entering={FadeInDown.delay(catIndex * 150)}
              style={styles.categorySection}
            >
              <Text style={[styles.categoryTitle, { color: colors.text }]}>{category}</Text>
              
              {categoryItems.map((item, itemIndex) => (
                <TouchableOpacity
                  key={item._id}
                  activeOpacity={0.8}
                  onPress={() => handleWatchVideo(item)}
                  style={[
                    styles.card,
                    { 
                      backgroundColor: colors.surface,
                      borderColor: isDark ? colors.border : '#E5E7EB'
                    }
                  ]}
                >
                  <View style={styles.cardContent}>
                    {item.coverImage ? (
                      <Image 
                        source={{ uri: item.coverImage }} 
                        style={styles.thumbnail}
                        resizeMode="cover"
                      />
                    ) : (
                      <LinearGradient
                        colors={isDark ? ['#374151', '#1F2937'] : ['#E0E7FF', '#C7D2FE']}
                        style={styles.thumbnailPlaceholder}
                      >
                        <PlayCircle size={32} color={isDark ? '#9CA3AF' : '#6366F1'} opacity={0.8} />
                      </LinearGradient>
                    )}
                    
                    <View style={styles.cardTextContainer}>
                      <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={2}>
                        {item.title || category}
                      </Text>
                      <View style={styles.watchNowRow}>
                        <Text style={[styles.watchNowText, { color: colors.primary }]}>
                          Xem ngay
                        </Text>
                        <ChevronRight size={16} color={colors.primary} />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* In-app Video Player Modal */}
      <Modal
        visible={!!activeVideo}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseVideo}
        statusBarTranslucent
        supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}
      >
        <StatusBar hidden />
        {activeVideo && (
          <VideoPlayer
            videoUrl={activeVideo.url}
            title={activeVideo.title}
            isLibraryMode={true}
            onClose={handleCloseVideo}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerDesc: {
    fontSize: 15,
    lineHeight: 22,
  },
  content: {
    paddingHorizontal: 20,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  thumbnail: {
    width: 100,
    height: 70,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  thumbnailPlaceholder: {
    width: 100,
    height: 70,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextContainer: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 22,
  },
  watchNowRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  watchNowText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 2,
  },
});
