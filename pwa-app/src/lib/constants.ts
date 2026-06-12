export const PAIN_AREAS = {
  NECK: 'neck',
  SHOULDER_LEFT: 'shoulder_left',
  SHOULDER_RIGHT: 'shoulder_right',
  UPPER_BACK: 'upper_back',
  MIDDLE_BACK: 'middle_back',
  LOWER_BACK: 'lower_back',
  GLUTES: 'glutes',
  CHEST: 'chest',
  ABDOMEN: 'abdomen',
  ARM_LEFT: 'arm_left',
  ARM_RIGHT: 'arm_right',
  HAND_LEFT: 'hand_left',
  HAND_RIGHT: 'hand_right',
  THIGH_LEFT: 'thigh_left',
  THIGH_RIGHT: 'thigh_right',
  LEG_LEFT: 'leg_left',
  LEG_RIGHT: 'leg_right',
  FOOT_LEFT: 'foot_left',
  FOOT_RIGHT: 'foot_right',
} as const;

export const PAIN_LEVELS = {
  NONE: 0,
  MILD: 3,
  MODERATE: 6,
  SEVERE: 9,
} as const;

export const SYMPTOMS = {
  NECK: [
    'Đau mỏi cổ vai gáy',
    'Thoái hóa cột sống cổ',
    'Thoát vị đĩa đệm cổ',
    'Chèn ép dây thần kinh (Tê tay, yếu tay)',
    'Trợt đốt sống cổ',
    'Gù cổ, cổ rùa',
    'Gai đốt sống',
  ],
  BACK: [
    'Đau lưng',
    'Thoái hóa cột sống lưng',
    'Thoát vị đĩa đệm lưng',
    'Đau thần kinh tọa (Lan xuống mông - xuống chân)',
    'Trợt đốt sống lưng',
    'Gù lưng',
    'Gai đốt sống',
  ],
  NUMBNESS: [
    'Tê tay trái',
    'Tê tay phải',
    'Tê chân trái',
    'Tê chân phải',
    'Tê lan từ cổ xuống tay',
    'Tê lan từ lưng xuống chân',
  ],
} as const;

export const SURGERY_HISTORY = {
  NEVER: 'never',
  UNDER_6_MONTHS: 'under_6_months',
  OVER_6_MONTHS: 'over_6_months',
} as const;

export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
} as const;

export const FEEDBACK_TYPES = {
  BETTER: 'better',
  SAME: 'same',
  WORSE: 'worse',
} as const;

export const PAIN_AREA_LABELS: Record<string, string> = {
  neck: 'Cổ',
  shoulder_left: 'Vai trái',
  shoulder_right: 'Vai phải',
  upper_back: 'Lưng',
  middle_back: 'Lưng giữa',
  lower_back: 'Thắt lưng',
  glutes: 'Mông / Eo dưới',
  chest: 'Ngực',
  abdomen: 'Bụng',
  arm_left: 'Cánh tay trái',
  arm_right: 'Cánh tay phải',
  hand_left: 'Bàn tay trái',
  hand_right: 'Bàn tay phải',
  thigh_left: 'Đùi trái',
  thigh_right: 'Đùi phải',
  leg_left: 'Cẳng chân trái',
  leg_right: 'Cẳng chân phải',
  foot_left: 'Bàn chân trái',
  foot_right: 'Bàn chân phải',
};

export const getPainAreaLabel = (areaKey: string): string => {
  return PAIN_AREA_LABELS[areaKey] || areaKey;
};
