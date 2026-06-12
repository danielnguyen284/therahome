import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Text } from 'react-native';
import { Card } from 'react-native-paper';
import { TrendingUp } from 'lucide-react-native';
import { colors } from '@/utils/theme';
import type { Exercise } from '@/types';

interface ExerciseCardProps {
  exercise: Exercise;
  onPress: () => void;
  recommended?: boolean;
  currentPainVideoLabel?: string;
}

export default function ExerciseCard({
  exercise,
  onPress,
  recommended,
  currentPainVideoLabel,
}: ExerciseCardProps) {
  const [imageError, setImageError] = React.useState(false);

  const hasValidThumbnail = exercise.thumbnail_url && exercise.thumbnail_url.trim() !== '' && !imageError;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.content}>
          {hasValidThumbnail ? (
            <Image
              source={{ uri: exercise.thumbnail_url }}
              style={styles.thumbnail}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
              <TrendingUp size={32} color={colors.textSecondary} />
            </View>
          )}
          
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={2}>
              {exercise.title}
            </Text>

            {recommended && (
              <View style={styles.recommendedBadge}>
                <TrendingUp size={14} color={colors.primary} />
                <Text style={styles.recommendedText}>Phù hợp với bạn</Text>
              </View>
            )}

            {currentPainVideoLabel && (
              <View style={styles.videoLevelBadge}>
                <Text style={styles.videoLevelText}>Video theo mức: {currentPainVideoLabel}</Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: colors.surface,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    padding: 12,
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  placeholderThumbnail: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.border,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  recommendedText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  videoLevelBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.primary + '14',
  },
  videoLevelText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
});
