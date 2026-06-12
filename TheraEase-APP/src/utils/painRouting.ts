import type { PainLog } from '@/types';

export type PainVideoLevelKey = 'no_pain' | 'mild' | 'moderate' | 'severe';
type ExercisePainTargets = {
  target_areas?: string[];
};
type ExercisePainVideoSource = ExercisePainTargets & {
  video_url?: string;
  video_urls_by_pain?: {
    no_pain?: string;
    mild?: string;
    moderate?: string;
    severe?: string;
  };
};

const painVideoLabels: Record<PainVideoLevelKey, string> = {
  no_pain: 'Không đau',
  mild: 'Đau nhẹ (ấm ấm)',
  moderate: 'Đau vừa (khó chịu)',
  severe: 'Đau nặng/Tê',
};

export function getPainVideoLevel(level?: number | null): PainVideoLevelKey {
  const safeLevel = Number(level ?? 0);

  if (safeLevel <= 0) return 'no_pain';
  if (safeLevel <= 3) return 'mild';
  if (safeLevel <= 7) return 'moderate';
  return 'severe';
}

export function getPainVideoLevelLabel(levelKey: PainVideoLevelKey): string {
  return painVideoLabels[levelKey];
}

export function countPainVideoLevels(
  exercise?: ExercisePainVideoSource | null,
): number {
  const painVideos = exercise?.video_urls_by_pain || {};

  return (['no_pain', 'mild', 'moderate', 'severe'] as PainVideoLevelKey[]).filter(
    (key) => typeof painVideos[key] === 'string' && painVideos[key]!.trim() !== '',
  ).length;
}

export function hasCompletePainVideoSet(
  exercise?: ExercisePainVideoSource | null,
): boolean {
  return countPainVideoLevels(exercise) === 4;
}

export function getPreferredDifficultiesForPainLevel(
  level?: number | null,
): Array<'easy' | 'medium' | 'hard'> {
  const painLevel = getPainVideoLevel(level);

  switch (painLevel) {
    case 'no_pain':
      return ['medium', 'hard', 'easy'];
    case 'mild':
      return ['easy', 'medium', 'hard'];
    case 'moderate':
      return ['easy', 'medium'];
    case 'severe':
      return ['easy'];
    default:
      return ['easy', 'medium', 'hard'];
  }
}

export function getRelevantPainLevelForExercise(
  exercise?: ExercisePainTargets | null,
  painLog?: PainLog | null,
): number {
  if (!painLog || !exercise) return 0;

  const targetAreas = Array.isArray(exercise.target_areas) ? exercise.target_areas : [];
  const matchingLevels = targetAreas
    .map((area) => painLog.pain_areas?.[area])
    .filter((value): value is number => typeof value === 'number');

  if (matchingLevels.length > 0) {
    return Math.max(...matchingLevels);
  }

  return Number(painLog.pain_level || 0);
}

export function resolveExerciseVideoUrl(
  exercise?: ExercisePainVideoSource | null,
  painLog?: PainLog | null,
): string {
  if (!exercise) return '';

  const painLevel = getRelevantPainLevelForExercise(exercise, painLog);
  const painKey = getPainVideoLevel(painLevel);
  const painVideos = exercise.video_urls_by_pain || {};

  return (
    painVideos[painKey] ||
    painVideos.mild ||
    painVideos.moderate ||
    painVideos.severe ||
    painVideos.no_pain ||
    exercise.video_url ||
    ''
  );
}

export function hasPainLevelVideo(
  exercise?: ExercisePainVideoSource | null,
  painLog?: PainLog | null,
): boolean {
  return Boolean(resolveExerciseVideoUrl(exercise, painLog));
}
