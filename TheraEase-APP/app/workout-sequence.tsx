import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  PanResponder,
  InteractionManager,
  useWindowDimensions,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, CheckCircle } from 'lucide-react-native';
import { Video, ResizeMode } from 'expo-av';
import YoutubePlayer, { YoutubeIframeRef } from 'react-native-youtube-iframe';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/services/api';
import { getVideoByPlanDay } from '@/services/videos';
import { colors } from '@/utils/theme';
import * as Haptics from 'expo-haptics';
import * as ScreenOrientation from 'expo-screen-orientation';
import { extractYouTubeVideoId, isYouTubeUrl } from '@/utils/youtube';
import { usePainStore } from '@/stores/painStore';
import { resolveExerciseVideoUrl } from '@/utils/painRouting';

interface Exercise {
  id: string;
  title: string;
  video_url: string;
  video_urls_by_pain?: {
    no_pain?: string;
    mild?: string;
    moderate?: string;
    severe?: string;
  };
  target_areas?: string[];
  duration: number;
  thumbnail_url?: string;
}

const RECOVERY_PLAN_DAYS = 14;

function getNextLocalDayStart(date = new Date()) {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(0, 0, 0, 0);
  return nextDay;
}

export default function WorkoutSequenceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, setUser } = useAuthStore();
  const { todayPainLog } = usePainStore();
  const { width, height } = useWindowDimensions();
  const youtubePlayerRef = useRef<YoutubeIframeRef | null>(null);
  const videoRef = useRef<Video | null>(null);
  
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dayVideoUrl, setDayVideoUrl] = useState<string | null>(null);
  const [isStartingCountdown, setIsStartingCountdown] = useState(false);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [progressTrackWidth, setProgressTrackWidth] = useState(0);
  const [pendingSeekTime, setPendingSeekTime] = useState<number | null>(null);
  const [showPlaybackControls, setShowPlaybackControls] = useState(true);

  useEffect(() => {
    loadExercises();
    // Lock to landscape for better video experience - delay to let navigation animation finish
    const interactionPromise = InteractionManager.runAfterInteractions(() => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch((err) => {
        console.warn('Failed to lock orientation to landscape:', err);
      });
    });
    
    return () => {
      interactionPromise.cancel();
      ScreenOrientation.unlockAsync().catch(() => {});
    };
  }, []);

  const loadExercises = async () => {
    if (!params.planId || !params.day) return;

    try {
      setLoading(true);
      
      const response = await api.get(`/workout-plans/${params.planId}/exercises`);
      
      // Filter exercises by day
      const dayNum = parseInt(params.day as string);
      const dayExercises = response.filter((item: any) => item.day_number === dayNum);
      const exerciseList = dayExercises.map((item: any) => item.exercise).filter(Boolean);

      setExercises(exerciseList);

      // Resolve one video per day from backend videos collection
      const { data: dayVideo, error: dayVideoError } = await getVideoByPlanDay(
        params.planId as string,
        dayNum
      );
      if (dayVideoError) {
        console.log('Load day video error:', dayVideoError);
      }
      setDayVideoUrl(dayVideo?.link || null);
    } catch (error) {
      console.error('Load exercises error:', error);
      setDayVideoUrl(null);
    } finally {
      setLoading(false);
    }
  };

  const maybeMarkRecoveryPlanStarted = async () => {
    if (!user || isStartingCountdown) return;
    if (user.personalized_plan_started_at) return;
    if ((params.day as string) !== '1') return;

    try {
      setIsStartingCountdown(true);
      const startedAt = new Date();

      const updatedUser = await api.put('/auth/profile', {
        personalized_plan_started_at: startedAt.toISOString(),
      });

      if (updatedUser) {
        setUser(updatedUser);
      }
    } catch (error) {
      console.warn('Start personalized plan countdown error:', error);
    } finally {
      setIsStartingCountdown(false);
    }
  };

  const maybeUnlockPersonalizedPlanAfterDay14 = async () => {
    if (!user || !params.day) return user;

    const dayNumber = parseInt(params.day as string, 10);
    if (dayNumber !== RECOVERY_PLAN_DAYS) return user;
    if (user.personalized_plan_completed_at && user.personalized_plan_unlock_at) return user;

    try {
      const completedAt = new Date();
      const unlockAt = getNextLocalDayStart(completedAt);
      const updatedUser = await api.put('/auth/profile', {
        personalized_plan_completed_at: completedAt.toISOString(),
        personalized_plan_unlock_at: unlockAt.toISOString(),
      });

      if (updatedUser) {
        setUser(updatedUser);
        return updatedUser;
      }
    } catch (error) {
      console.warn('Unlock personalized plan after day 14 error:', error);
    }

    return user;
  };



  const handleComplete = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Unlock orientation back to portrait before navigating away
    try {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    } catch {
      await ScreenOrientation.unlockAsync().catch(() => {});
    }
    
    // Save workout log for each exercise
    if (user && params.planId && params.day) {
      try {
        const completedAt = new Date().toISOString();
        const promises = exercises.map(ex => 
          api.post('/exercises/workout-log', {
            exercise_id: ex.id,
            plan_id: params.planId,
            day_number: parseInt(params.day as string),
            is_completed: true,
            completed_at: completedAt,
          })
        );
        await Promise.all(promises);
        const notificationUser = await maybeUnlockPersonalizedPlanAfterDay14();

        // Reschedule notifications — reset inactivity timers since user just worked out
        try {
          const { rescheduleSmartNotifications } = await import('@/services/notifications');
          await rescheduleSmartNotifications(
            notificationUser,
            !!notificationUser?.personalized_plan_unlock_at,
          );
        } catch (e) {
          console.warn('Reschedule notifications after workout error:', e);
        }
      } catch (error) {
        console.error('Save workout log error:', error);
      }
    }
    
    router.push('/daily-recommendations');
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setVideoCompleted(true);
    setShowPlaybackControls(true);
  };

  const currentExercise = exercises[0] ?? null;
  const currentVideoUrl =
    dayVideoUrl || (currentExercise ? resolveExerciseVideoUrl(currentExercise, todayPainLog) : '');
  const isYoutubeVideo = currentVideoUrl ? isYouTubeUrl(currentVideoUrl) : false;
  const youtubeVideoId =
    isYoutubeVideo && currentVideoUrl ? extractYouTubeVideoId(currentVideoUrl) : null;
  const displayTime = pendingSeekTime ?? currentTime;
  const progressRatio = duration > 0 ? Math.min(1, Math.max(0, displayTime / duration)) : 0;
  const playerWidth = width;
  const playerHeight = height;

  const formatSeconds = (value: number) => {
    const safeValue = Math.max(0, Math.floor(value));
    const minutes = Math.floor(safeValue / 60);
    const seconds = safeValue % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const clampToDuration = (value: number) => {
    if (duration <= 0) {
      return 0;
    }

    return Math.min(Math.max(value, 0), duration);
  };

  const seekToTime = async (seconds: number) => {
    const target = clampToDuration(seconds);
    setPendingSeekTime(null);
    setCurrentTime(target);

    try {
      if (isYoutubeVideo) {
        youtubePlayerRef.current?.seekTo(target, true);
        return;
      }

      if (videoRef.current) {
        await videoRef.current.setPositionAsync(target * 1000);
      }
    } catch (error) {
      console.warn('Seek video error:', error);
    }
  };

  const handleSeekBy = (deltaSeconds: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void seekToTime(displayTime + deltaSeconds);
  };

  const getSeekTimeFromLocation = (locationX: number) => {
    if (!progressTrackWidth || duration <= 0) {
      return currentTime;
    }

    const ratio = Math.min(Math.max(locationX / progressTrackWidth, 0), 1);
    return ratio * duration;
  };

  const seekResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => duration > 0,
        onMoveShouldSetPanResponder: () => duration > 0,
        onPanResponderGrant: (event) => {
          setPendingSeekTime(getSeekTimeFromLocation(event.nativeEvent.locationX));
        },
        onPanResponderMove: (event) => {
          setPendingSeekTime(getSeekTimeFromLocation(event.nativeEvent.locationX));
        },
        onPanResponderRelease: (event) => {
          const target = getSeekTimeFromLocation(event.nativeEvent.locationX);
          void seekToTime(target);
        },
        onPanResponderTerminate: () => {
          setPendingSeekTime(null);
        },
      }),
    [currentTime, duration, progressTrackWidth],
  );

  useEffect(() => {
    if (!isYoutubeVideo || !youtubeVideoId) {
      return;
    }

    let isMounted = true;

    const syncYoutubeProgress = async () => {
      if (!youtubePlayerRef.current) {
        return;
      }

      try {
        const [nextDuration, nextCurrentTime] = await Promise.all([
          youtubePlayerRef.current.getDuration(),
          youtubePlayerRef.current.getCurrentTime(),
        ]);

        if (!isMounted) {
          return;
        }

        if (Number.isFinite(nextDuration) && nextDuration > 0) {
          setDuration(nextDuration);
        }

        if (pendingSeekTime === null && Number.isFinite(nextCurrentTime)) {
          setCurrentTime(nextCurrentTime);
        }
      } catch (error) {
        console.warn('Sync YouTube progress error:', error);
      }
    };

    void syncYoutubeProgress();
    const intervalId = setInterval(() => {
      void syncYoutubeProgress();
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [isYoutubeVideo, pendingSeekTime, youtubeVideoId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!currentExercise) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Không có bài tập nào</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <Pressable
        style={styles.videoContainer}
        onPress={() => setShowPlaybackControls((prev) => !prev)}
      >
        {isYoutubeVideo && youtubeVideoId ? (
          <YoutubePlayer
            ref={youtubePlayerRef}
            height={playerHeight}
            width={playerWidth}
            play={isPlaying}
            videoId={youtubeVideoId}
            onChangeState={(state: string) => {
              if (state === 'ended') {
                handleVideoEnd();
                setIsPlaying(false);
              } else if (state === 'playing') {
                setIsPlaying(true);
                maybeMarkRecoveryPlanStarted();
              } else if (state === 'paused') {
                setIsPlaying(false);
              }
            }}
            initialPlayerParams={{
              controls: true,
              modestbranding: true,
              rel: false,
            }}
          />
        ) : (
          <Video
            ref={videoRef}
            source={{ uri: currentVideoUrl }}
            style={[styles.video, { width: playerWidth, height: playerHeight }]}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={isPlaying}
            isLooping={false}
            onPlaybackStatusUpdate={(status: any) => {
              if (!status.isLoaded) {
                return;
              }

              if (status.isPlaying) {
                maybeMarkRecoveryPlanStarted();
              }

              if (pendingSeekTime === null) {
                setCurrentTime((status.positionMillis || 0) / 1000);
              }

              setDuration((status.durationMillis || 0) / 1000);

              if (status.didJustFinish) {
                handleVideoEnd();
              }
            }}
          />
        )}

        <View style={styles.overlay} pointerEvents="box-none">
          <View style={styles.header} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.backButton}
              onPress={async (event) => {
                event.stopPropagation();
                try {
                  await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
                } catch {
                  await ScreenOrientation.unlockAsync().catch(() => {});
                }
                router.back();
              }}
              activeOpacity={0.85}
            >
              <ArrowLeft size={28} color="#FFF" />
            </TouchableOpacity>

            {showPlaybackControls && (
              <View style={styles.headerInfo}>
                <Text style={styles.headerTitle}>{currentExercise.title}</Text>
              </View>
            )}
          </View>

          {/* showPlaybackControls && (
            <Pressable
              style={styles.controlsDock}
              onPress={(event) => {
                event.stopPropagation();
              }}
            >
              <LinearGradient
                colors={['rgba(17,24,39,0.86)', 'rgba(17,24,39,0.72)']}
                style={styles.controlsCard}
              >
                <View style={styles.progressInfo}>
                  <Text style={styles.timeBadgeText}>{formatSeconds(displayTime)}</Text>
                  <Text style={styles.timeBadgeText}>{formatSeconds(duration)}</Text>
                </View>

                <View
                  style={styles.progressTrack}
                  onLayout={(event) => {
                    setProgressTrackWidth(event.nativeEvent.layout.width);
                  }}
                  {...seekResponder.panHandlers}
                >
                  <View style={styles.progressTrackBackground} />
                  <View
                    style={[
                      styles.progressTrackFill,
                      { width: `${progressRatio * 100}%` },
                    ]}
                  />
                  <View
                    style={[
                      styles.progressThumb,
                      {
                        left:
                          progressTrackWidth > 0
                            ? Math.max(
                                0,
                                Math.min(
                                  progressTrackWidth - 18,
                                  progressRatio * progressTrackWidth - 9,
                                ),
                              )
                            : 0,
                      },
                    ]}
                  />
                </View>

                <View style={styles.seekButtonsRow}>
                  <TouchableOpacity
                    style={styles.seekButton}
                    onPress={(event) => {
                      event.stopPropagation();
                      handleSeekBy(-10);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.seekButtonText}>-10s</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.seekButton}
                    onPress={(event) => {
                      event.stopPropagation();
                      handleSeekBy(10);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.seekButtonText}>+10s</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Pressable>
          ) */}

          {videoCompleted && (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={(event) => {
                event.stopPropagation();
                handleComplete();
              }}
              activeOpacity={0.9}
            >
              <>
                <CheckCircle size={22} color="#FFF" />
                <Text style={styles.nextButtonText}>Xong</Text>
              </>
            </TouchableOpacity>
          )}
        </View>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: colors.primary,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  header: {
    position: 'absolute',
    top: 18,
    right: 18,
    left: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  headerInfo: {
    marginLeft: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.4)',
    maxWidth: '74%',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
  },
  controlsDock: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 24,
    alignItems: 'center',
  },
  controlsCard: {
    width: '70%',
    minWidth: 280,
    maxWidth: 520,
    borderRadius: 26,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.26,
    shadowRadius: 22,
    elevation: 8,
  },
  timeBadgeText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
    opacity: 0.92,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTrack: {
    width: '100%',
    height: 24,
    justifyContent: 'center',
    marginBottom: 14,
  },
  progressTrackBackground: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  progressTrackFill: {
    position: 'absolute',
    left: 0,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  progressThumb: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  seekButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  seekButton: {
    minWidth: 82,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: 'rgba(31,41,55,0.84)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  seekButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  nextButton: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
