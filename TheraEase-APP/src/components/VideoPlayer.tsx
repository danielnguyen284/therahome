import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Linking, useWindowDimensions } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Play, Pause, SkipBack, SkipForward, X, RotateCcw, RotateCw } from 'lucide-react-native';
import { colors } from '@/utils/theme';
import * as ScreenOrientation from 'expo-screen-orientation';
import { extractYouTubeVideoId, isYouTubeUrl } from '@/utils/youtube';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  currentIndex?: number;
  totalCount?: number;
  isLibraryMode?: boolean;
  onComplete?: () => void;
  onClose?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

export default function VideoPlayer({
  videoUrl,
  title,
  currentIndex,
  totalCount,
  isLibraryMode = false,
  onComplete,
  onClose,
  onNext,
  onPrevious,
}: VideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // YouTube specific state
  const isYouTube = isYouTubeUrl(videoUrl);
  const youtubeVideoId = isYouTube ? extractYouTubeVideoId(videoUrl) : null;
  const [youtubeReady, setYoutubeReady] = useState(false);
  const [embedError, setEmbedError] = useState(false);
  const [autoOpenedExternal, setAutoOpenedExternal] = useState(false);
  const youtubePlayerRef = useRef<any>(null);

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    if (isYouTube && youtubePlayerRef.current && youtubeReady && !embedError) {
      // YouTube player control - use ref methods
      try {
        const playerState = await youtubePlayerRef.current.getPlayerState();

        if (isPlaying) {
          await youtubePlayerRef.current.pauseVideo();
        } else {
          await youtubePlayerRef.current.playVideo();
        }
        setIsPlaying(!isPlaying);
      } catch (error) {
        console.log('YouTube control error:', error);
      }
    } else if (videoRef.current) {
      // Regular video control
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSkip = async (seconds: number) => {
    if (isYouTube && youtubePlayerRef.current && youtubeReady && !embedError) {
      // YouTube player seek
      try {
        const currentTime = await youtubePlayerRef.current.getCurrentTime();
        const newTime = Math.max(0, currentTime + seconds);
        await youtubePlayerRef.current.seekTo(newTime, true);
      } catch (error) {
        console.log('YouTube seek error:', error);
      }
    } else if (videoRef.current) {
      // Regular video seek
      const newPosition = Math.max(0, Math.min(position + seconds * 1000, duration));
      await videoRef.current.setPositionAsync(newPosition);
    }
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);
      setIsPlaying(status.isPlaying);

      // Auto-play next exercise when finished
      if (status.didJustFinish) {
        if (onNext && currentIndex !== undefined && totalCount !== undefined && currentIndex < totalCount - 1) {
          // Auto play next after 2 seconds
          setTimeout(() => {
            onNext();
          }, 2000);
        } else if (onComplete) {
          onComplete();
        }
      }
    }
  };

  // Calculate countdown (remaining time)
  const remainingTime = Math.ceil((duration - position) / 1000);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  const handleFullScreenChange = (isFullScreen: boolean) => {
    if (isLibraryMode) return;
    setIsFullscreen(isFullScreen);
  };

  // YouTube player handlers
  const onYouTubeReady = () => {
    setYoutubeReady(true);
  };

  const openVideoExternally = async () => {
    const externalUrl = youtubeVideoId
      ? `https://www.youtube.com/watch?v=${youtubeVideoId}`
      : videoUrl;

    try {
      const supported = await Linking.canOpenURL(externalUrl);
      if (!supported) {
        return false;
      }

      await Linking.openURL(externalUrl);
      onClose?.();
      return true;
    } catch (error) {
      console.warn('Open external video error:', error);
      return false;
    }
  };

  const onYouTubeError = (error: string) => {
    console.log('YouTube error:', error);
    if (error === '150' || error === '101' || error === 'UNPLAYABLE') {
      setEmbedError(true);
    }
  };

  const onYouTubeStateChange = (state: string) => {
    if (state === 'ended') {
      // Auto-play next exercise when finished
      if (onNext && currentIndex !== undefined && totalCount !== undefined && currentIndex < totalCount - 1) {
        setTimeout(() => {
          onNext();
        }, 2000);
      } else if (onComplete) {
        onComplete();
      }
    }
  };

  // Update position and duration for YouTube
  useEffect(() => {
    if (!isYouTube || !youtubeReady || !youtubePlayerRef.current || embedError) return;

    const interval = setInterval(async () => {
      try {
        const currentTime = await youtubePlayerRef.current.getCurrentTime();
        const videoDuration = await youtubePlayerRef.current.getDuration();

        setPosition(currentTime * 1000);
        setDuration(videoDuration * 1000);
      } catch (error) {
        // Ignore errors
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isYouTube, youtubeReady, embedError]);

  useEffect(() => {
    setEmbedError(false);
    setYoutubeReady(false);
    setAutoOpenedExternal(false);
  }, [videoUrl]);

  useEffect(() => {
    if (!embedError || !isLibraryMode || autoOpenedExternal) {
      return;
    }

    setAutoOpenedExternal(true);
    void openVideoExternally();
  }, [autoOpenedExternal, embedError, isLibraryMode]);

  // Set fullscreen visual mode and lock to landscape when library mode is active
  useEffect(() => {
    if (isLibraryMode) {
      setIsFullscreen(true);
      // Delay orientation lock to let Modal animation finish first
      const timer = setTimeout(() => {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch((err) => {
          console.warn('Orientation lock error (library mode):', err);
        });
      }, 350);

      return () => {
        clearTimeout(timer);
        ScreenOrientation.unlockAsync().catch(() => {});
      };
    }
  }, [isLibraryMode]);

  return (
    <View style={[styles.container, (isFullscreen || isLibraryMode) && { backgroundColor: '#000000' }]}>
      <View style={styles.videoContainer}>
        {/* Video - YouTube or Regular */}
        {isYouTube && youtubeVideoId ? (
          <View style={styles.youtubeWrapper}>
            {embedError ? (
              <View style={styles.embedErrorContainer}>
                <Text style={styles.embedErrorText}>
                  Video này không cho phát trực tiếp trong app. Mở trên YouTube để tiếp tục xem nhé.
                </Text>
                <TouchableOpacity
                  style={styles.openYoutubeButton}
                  onPress={() => {
                    void openVideoExternally();
                  }}
                >
                  <Text style={styles.openYoutubeText}>Xem trên YouTube</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <YoutubePlayer
                ref={youtubePlayerRef}
                height={isFullscreen ? windowHeight : windowWidth * 9 / 16}
                width={windowWidth}
                videoId={youtubeVideoId}
                play={true}
                onReady={onYouTubeReady}
                onChangeState={onYouTubeStateChange}
                onError={onYouTubeError}
                onFullScreenChange={handleFullScreenChange}
                initialPlayerParams={{
                  controls: true,
                  modestbranding: true,
                  rel: false,
                }}
              />
            )}
          </View>
        ) : (
          <Video
            ref={videoRef}
            source={{ uri: videoUrl }}
            style={styles.video}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            isLooping={false}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />
        )}

        {/* Top Bar: Title + Close */}
        <View style={[styles.topBar, (isFullscreen || isLibraryMode) && styles.topBarFullscreen]}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, (isFullscreen || isLibraryMode) && { color: '#FFFFFF' }]}>{title}</Text>
            {currentIndex !== undefined && totalCount !== undefined && (
              <Text style={[styles.exerciseProgress, (isFullscreen || isLibraryMode) && { color: '#rgba(255,255,255,0.8)' }]}>
                Bài tập {currentIndex + 1}/{totalCount}
              </Text>
            )}
          </View>
          {onClose && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={(isFullscreen || isLibraryMode) ? '#FFFFFF' : colors.text} />
            </TouchableOpacity>
          )}
        </View>

        {!isLibraryMode && (
          <>
            {/* COUNTDOWN TIMER - Ở trên video, không đè */}
            <View style={styles.timerSection}>
              <Text style={styles.countdownText}>{formatCountdown(remainingTime)}</Text>
            </View>

            {/* Bottom Controls - Luôn hiện */}
            <View style={styles.bottomSection}>
              {/* Progress Bar */}
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: duration > 0 ? `${(position / duration) * 100}%` : '0%' }
                  ]}
                />
              </View>

              {/* Control Buttons */}
              <View style={styles.controlsRow}>
                {/* Previous Exercise */}
                {onPrevious && currentIndex !== undefined && currentIndex > 0 && (
                  <TouchableOpacity
                    style={styles.navButton}
                    onPress={onPrevious}
                  >
                    <SkipBack size={24} color={colors.primary} />
                  </TouchableOpacity>
                )}

                {/* Rewind 15s */}
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={() => handleSkip(-15)}
                >
                  <RotateCcw size={24} color={colors.primary} />
                </TouchableOpacity>

                {/* Forward 15s */}
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={() => handleSkip(15)}
                >
                  <RotateCw size={24} color={colors.primary} />
                </TouchableOpacity>

                {/* Next Exercise */}
                {onNext && currentIndex !== undefined && totalCount !== undefined && currentIndex < totalCount - 1 && (
                  <TouchableOpacity
                    style={styles.navButton}
                    onPress={onNext}
                  >
                    <SkipForward size={24} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  video: {
    flex: 1,
    width: '100%',
  },
  youtubeWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000', // Đổi nền video sang đen để dễ xem
  },
  embedErrorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  embedErrorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  openYoutubeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  openYoutubeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Top Bar: Title + Close
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  topBarFullscreen: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    paddingTop: 40,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  exerciseProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  closeButton: {
    padding: 12,
    position: 'absolute',
    right: 12,
    top: 56,
  },

  // Timer Section - Ở trên video
  timerSection: {
    position: 'absolute',
    top: 140,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  countdownText: {
    fontSize: 120,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: -4,
  },

  // Bottom Section - Controls
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingTop: 16,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  skipButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  playPauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  fullscreenButton: {
    padding: 4,
    marginLeft: 8,
  },
});
