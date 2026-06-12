import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Text, Button, ActivityIndicator, Card } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Sparkles, ArrowLeft, PlayCircle } from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { usePainStore } from '@/stores/painStore';
import { useExerciseStore } from '@/stores/exerciseStore';
import { getPainLogs } from '@/services/painLogs';
import {
  getRandomizedPersonalizedPlanVideos,
  type PersonalizedPlanDayVideo,
} from '@/services/videos';
import VideoPlayer from '@/components/VideoPlayer';
import { colors } from '@/utils/theme';
import { getPainVideoLevel, getPainVideoLevelLabel } from '@/utils/painRouting';

const VIDEO_GROUP_LABELS: Record<string, string> = {
  regular: 'Bài tập đơn',
  device_supported: 'Bài tập sử dụng máy',
};

export default function RecommendationsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { todayPainLog } = usePainStore();
  const { setRecommendedExercises } = useExerciseStore();
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<PersonalizedPlanDayVideo[]>([]);

  const [errorMessage, setErrorMessage] = useState('');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    loadRecommendations();
  }, [user?.id, todayPainLog?.id]);

  const activeVideo = activeIndex !== null ? videos[activeIndex] : null;

  const regularVideosCount = useMemo(
    () => videos.filter((item) => item.video_group === 'regular').length,
    [videos],
  );
  const deviceVideosCount = useMemo(
    () => videos.filter((item) => item.video_group === 'device_supported').length,
    [videos],
  );

  const loadRecommendations = async () => {
    if (!user || !todayPainLog) {
      setVideos([]);
      setErrorMessage('Bạn chưa nhập mức đau hôm nay. Vui lòng cập nhật mức đau để nhận lộ trình cá nhân hoá.');

      setRecommendedExercises([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      const [videoResult, painLogsResult] = await Promise.all([
        getRandomizedPersonalizedPlanVideos({
          regularCount: 6,
          deviceCount: 1,
        }),
        getPainLogs(7),
      ]);

      if (videoResult.error || !videoResult.data) {
        setVideos([]);
        setRecommendedExercises([]);
        setErrorMessage(videoResult.error || 'Không thể tạo lộ trình video cá nhân hoá.');
        return;
      }

      const videoItems = videoResult.data.items || [];
      setVideos(videoItems);
      setRecommendedExercises([]);

      if (videoItems.length === 0) {

        setErrorMessage('Chưa có video nào trong hệ thống. Quản trị viên vui lòng thêm video để tạo lộ trình cá nhân hoá.');
        return;
      }


    } catch (error) {
      console.error('Load personalized recommendations error:', error);
      setVideos([]);
      setRecommendedExercises([]);
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải lộ trình video cá nhân hoá.');
    } finally {
      setLoading(false);
    }
  };

  const openVideo = (index: number) => {
    setActiveIndex(index);
  };

  const closeVideo = () => {
    setActiveIndex(null);
  };

  const handleVideoComplete = () => {
    setActiveIndex(null);
    router.push('/daily-recommendations');
  };

  const handleNextVideo = () => {
    setActiveIndex((current) => {
      if (current === null || current >= videos.length - 1) return current;
      return current + 1;
    });
  };

  const handlePreviousVideo = () => {
    setActiveIndex((current) => {
      if (current === null || current <= 0) return current;
      return current - 1;
    });
  };

  const handleStartWorkout = () => {
    if (videos.length > 0) {
      openVideo(0);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          Đang random lộ trình video cá nhân hoá cho bạn...
        </Text>
      </View>
    );
  }

  const activePainVideoLabel = getPainVideoLevelLabel(getPainVideoLevel(todayPainLog?.pain_level));

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lộ trình cá nhân hoá</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Sparkles size={32} color={colors.primary} />
          <Text style={styles.title}>
            Chúng tôi đã chuẩn bị {videos.length} video cho hôm nay
          </Text>
          <Text style={styles.activeLevelText}>
            Mức đau hiện tại: {activePainVideoLabel}
          </Text>
          <Text style={styles.mixSummary}>
            Đã thiết lập {regularVideosCount} bài tập đơn và {deviceVideosCount} bài tập có sử dụng máy
          </Text>

        </View>

        {errorMessage ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyText}>{errorMessage}</Text>
            </Card.Content>
          </Card>
        ) : videos.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyText}>
                Chưa có đủ video để tạo lộ trình cá nhân hoá hôm nay.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          videos.map((video, index) => (
            <TouchableOpacity
              key={video.id || (video as any)._id || `video-${index}`}
              activeOpacity={0.85}
              onPress={() => openVideo(index)}
              style={styles.videoCardWrapper}
            >
              <View style={styles.priorityBadge}>
                <Text style={styles.priorityText}>#{index + 1}</Text>
              </View>
              <Card style={styles.videoCard}>
                <Card.Content style={styles.videoCardContent}>
                  <View style={styles.videoMain}>
                    <Text style={styles.videoTitle}>
                      {video.title || `Video ${index + 1}`}
                    </Text>
                    <Text style={styles.videoDescription}>
                      {video.description || 'Video được chọn ngẫu nhiên cho lộ trình cá nhân hoá của bạn.'}
                    </Text>
                    <View style={styles.badgesRow}>
                      <View style={[styles.infoBadge, video.video_group === 'device_supported' ? styles.deviceBadge : styles.regularBadge]}>
                        <Text style={[styles.infoBadgeText, video.video_group === 'device_supported' ? styles.deviceBadgeText : styles.regularBadgeText]}>
                          {VIDEO_GROUP_LABELS[video.video_group || 'regular']}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.playIconWrap}>
                    <PlayCircle size={34} color={colors.primary} />
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {videos.length > 0 && !errorMessage ? (
        <View style={styles.footer}>
          <Button
            mode="contained"
            onPress={handleStartWorkout}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Bắt đầu tập luyện
          </Button>
          <Button
            mode="outlined"
            onPress={() => router.push('/device-recommendation')}
            style={styles.button}
          >
            Bỏ qua, đến gợi ý thiết bị
          </Button>
        </View>
      ) : null}

      <Modal
        visible={activeVideo !== null}
        animationType="slide"
        supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}
      >
        {activeVideo ? (
          <VideoPlayer
            videoUrl={activeVideo.link}
            title={activeVideo.title || 'Video lộ trình cá nhân hoá'}
            currentIndex={activeIndex ?? 0}
            totalCount={videos.length}
            isLibraryMode
            onClose={closeVideo}
            onNext={handleNextVideo}
            onPrevious={handlePreviousVideo}
            onComplete={handleVideoComplete}
          />
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 60,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  content: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  activeLevelText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  mixSummary: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },

  emptyCard: {
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  videoCardWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  priorityBadge: {
    position: 'absolute',
    top: -8,
    left: -4,
    zIndex: 2,
    backgroundColor: colors.primary,
    borderRadius: 999,
    minWidth: 42,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  videoCard: {
    borderRadius: 20,
    backgroundColor: colors.surface,
    elevation: 2,
  },
  videoCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  videoMain: {
    flex: 1,
    paddingTop: 8,
  },
  videoTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  videoDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  regularBadge: {
    backgroundColor: `${colors.success}20`,
  },
  deviceBadge: {
    backgroundColor: `${colors.warning}20`,
  },
  infoBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  regularBadgeText: {
    color: colors.success,
  },
  deviceBadgeText: {
    color: colors.warning,
  },
  playIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}12`,
  },
  footer: {
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    borderRadius: 12,
    marginBottom: 10,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
