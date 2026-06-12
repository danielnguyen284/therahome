const MORNING_TIME = { hour: 8, minute: 0 };
const EVENING_TIME = { hour: 20, minute: 0 };
const BOTH_TIME_VALUE = '08:00,20:00';

const INACTIVITY_KEYS = new Set(['message_3', 'message_5', 'message_7']);

function normalizePreferredTime(value) {
  if (typeof value !== 'string') return '20:00';
  const trimmed = value.trim();
  if (!trimmed) return '20:00';

  if (trimmed === '08:00' || trimmed === '20:00' || trimmed === BOTH_TIME_VALUE) {
    return trimmed;
  }

  return trimmed;
}

function getPreferredTimeLabel(value) {
  const normalized = normalizePreferredTime(value);

  if (normalized === '08:00') return 'Buổi sáng';
  if (normalized === '20:00') return 'Buổi tối';
  if (normalized === BOTH_TIME_VALUE) return 'Cả 2';
  return normalized;
}

function parseHourMinute(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(String(value || '').trim());
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return { hour, minute };
}

function resolvePreferredTimeForTemplate(preferredTime, templateKey, fallbackHour, fallbackMinute) {
  const normalized = normalizePreferredTime(preferredTime);

  if (normalized === '08:00') {
    return MORNING_TIME;
  }

  if (normalized === '20:00') {
    return EVENING_TIME;
  }

  if (normalized === BOTH_TIME_VALUE) {
    return INACTIVITY_KEYS.has(templateKey) ? EVENING_TIME : MORNING_TIME;
  }

  return parseHourMinute(normalized) || { hour: fallbackHour, minute: fallbackMinute };
}

function applyPreferredTimeToTemplate(template, preferredTime) {
  const resolved = resolvePreferredTimeForTemplate(
    preferredTime,
    template.key,
    template.hour,
    template.minute,
  );

  return {
    ...template,
    hour: resolved.hour,
    minute: resolved.minute,
    preferred_time_label: getPreferredTimeLabel(preferredTime),
  };
}

module.exports = {
  normalizePreferredTime,
  getPreferredTimeLabel,
  resolvePreferredTimeForTemplate,
  applyPreferredTimeToTemplate,
  BOTH_TIME_VALUE,
};
