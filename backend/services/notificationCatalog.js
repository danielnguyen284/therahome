const RECOVERY_DAYS = 14;
const PERSONALIZED_START_DAY = 15;
const PERSONALIZED_END_DAY = 29;
const PERSONALIZED_DAYS = PERSONALIZED_END_DAY - PERSONALIZED_START_DAY + 1;

const RECOVERY_TITLE = 'Phục hồi chuyên sâu 🧘‍♀️';
const RECOVERY_BODY = 'Đã đến giờ thực hiện 14 ngày phục hồi chuyên sâu! Vào app và bắt đầu tập ngay nào.';
const PERSONALIZED_TITLE = 'Lộ trình cá nhân hoá 🧘‍♀️';
const PERSONALIZED_BODY = 'Đã đến giờ tập lộ trình cá nhân hoá của bạn hôm nay! Vào app và bắt đầu ngay nào.';

const INACTIVITY_TEMPLATES = [
  {
    key: 'message_3',
    label: 'Không tập 3 ngày',
    title: 'TheraHome nhớ bạn 🥺',
    body: 'Đã 3 ngày bạn chưa tập luyện. Hãy quay lại để duy trì thói quen phục hồi nhé!',
    hour: 20,
    minute: 0,
    is_active: true,
    description: 'Gửi khi người dùng không tập liên tiếp 3 ngày. Lời nhắc nhẹ nhàng.',
  },
  {
    key: 'message_5',
    label: 'Không tập 5 ngày',
    title: 'Đừng bỏ cuộc! 💪',
    body: '5 ngày trôi qua rồi. Việc duy trì đều đặn là chìa khóa để phục hồi thành công. Vào app ngay nào!',
    hour: 20,
    minute: 0,
    is_active: true,
    description: 'Gửi khi người dùng vẫn không tập sau thông báo ngày 3.',
  },
  {
    key: 'message_7',
    label: 'Không tập 7 ngày',
    title: 'Thông báo cuối cùng ⚠️',
    body: 'Bạn đã nghỉ 1 tuần rồi. Cột sống và cơ thể đang rất cần bạn chăm sóc. Hãy bắt đầu lại từ hôm nay nhé!',
    hour: 20,
    minute: 0,
    is_active: true,
    description: 'Gửi khi người dùng không tập 7 ngày liên tiếp. Thông báo khẩn cấp cuối cùng.',
  },
];

function padDay(dayNumber) {
  return String(dayNumber).padStart(2, '0');
}

function getRecoveryTemplateKey(dayNumber) {
  return `message_1_recovery_day_${padDay(dayNumber)}`;
}

function getPersonalizedTemplateKey(dayNumber) {
  return `message_1_personalized_day_${padDay(dayNumber)}`;
}

const RECOVERY_TEMPLATE_KEYS = Array.from(
  { length: RECOVERY_DAYS },
  (_, index) => getRecoveryTemplateKey(index + 1),
);

const PERSONALIZED_TEMPLATE_KEYS = Array.from(
  { length: PERSONALIZED_DAYS },
  (_, index) => getPersonalizedTemplateKey(PERSONALIZED_START_DAY + index),
);

const DAILY_NOTIFICATION_KEYS = [
  ...RECOVERY_TEMPLATE_KEYS,
  ...PERSONALIZED_TEMPLATE_KEYS,
];

const INACTIVITY_NOTIFICATION_KEYS = INACTIVITY_TEMPLATES.map((template) => template.key);

const VALID_NOTIFICATION_KEYS = [
  ...DAILY_NOTIFICATION_KEYS,
  ...INACTIVITY_NOTIFICATION_KEYS,
];

const DEFAULT_NOTIFICATION_TEMPLATES = [
  ...RECOVERY_TEMPLATE_KEYS.map((key, index) => ({
    key,
    label: `Nhắc tập — Phục hồi chuyên sâu ngày ${index + 1}`,
    title: RECOVERY_TITLE,
    body: RECOVERY_BODY,
    hour: 20,
    minute: 0,
    is_active: true,
    description: `Gửi ở ngày ${index + 1} của giai đoạn phục hồi chuyên sâu.`,
  })),
  ...PERSONALIZED_TEMPLATE_KEYS.map((key, index) => {
    const dayNumber = PERSONALIZED_START_DAY + index;
    return {
      key,
      label: `Nhắc tập — Lộ trình cá nhân hoá ngày ${dayNumber}`,
      title: PERSONALIZED_TITLE,
      body: PERSONALIZED_BODY,
      hour: 20,
      minute: 0,
      is_active: true,
      description: `Gửi ở ngày ${dayNumber} của lộ trình cá nhân hoá.`,
    };
  }),
  ...INACTIVITY_TEMPLATES,
];

const TEMPLATE_ORDER = new Map(
  VALID_NOTIFICATION_KEYS.map((key, index) => [key, index]),
);

function sortNotificationTemplates(templates) {
  return [...templates].sort((left, right) => {
    const leftIndex = TEMPLATE_ORDER.get(left.key) ?? 9999;
    const rightIndex = TEMPLATE_ORDER.get(right.key) ?? 9999;
    return leftIndex - rightIndex;
  });
}

function isRecoveryTemplateKey(key) {
  return RECOVERY_TEMPLATE_KEYS.includes(key);
}

function isPersonalizedTemplateKey(key) {
  return PERSONALIZED_TEMPLATE_KEYS.includes(key);
}

module.exports = {
  RECOVERY_DAYS,
  PERSONALIZED_DAYS,
  PERSONALIZED_START_DAY,
  PERSONALIZED_END_DAY,
  RECOVERY_TEMPLATE_KEYS,
  PERSONALIZED_TEMPLATE_KEYS,
  DAILY_NOTIFICATION_KEYS,
  INACTIVITY_NOTIFICATION_KEYS,
  VALID_NOTIFICATION_KEYS,
  DEFAULT_NOTIFICATION_TEMPLATES,
  sortNotificationTemplates,
  getRecoveryTemplateKey,
  getPersonalizedTemplateKey,
  isRecoveryTemplateKey,
  isPersonalizedTemplateKey,
};
