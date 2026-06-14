const { prisma } = require('../config/db');
const { applyPreferredTimeToTemplate } = require('./userNotificationPreferences');
const {
  DEFAULT_NOTIFICATION_TEMPLATES,
  VALID_NOTIFICATION_KEYS,
  sortNotificationTemplates,
} = require('./notificationCatalog');

let seeded = false;

// Seed defaults if table is empty, or migrate from old schema.
// Runs only once per server lifecycle.
async function seedNotificationTemplates() {
  if (seeded) return;

  try {
    await prisma.notificationTemplate.deleteMany({
      where: {
        key: { in: ['message_1', 'message_1_recovery', 'message_1_personalized'] },
      },
    });

    for (const tmpl of DEFAULT_NOTIFICATION_TEMPLATES) {
      const exists = await prisma.notificationTemplate.findUnique({
        where: { key: tmpl.key },
      });

      if (!exists) {
        await prisma.notificationTemplate.create({ data: tmpl });
        console.log(`Seeded missing template: ${tmpl.key}`);
        continue;
      }

      if (exists.label !== tmpl.label || exists.description !== tmpl.description) {
        await prisma.notificationTemplate.update({
          where: { key: tmpl.key },
          data: {
            label: tmpl.label,
            description: tmpl.description,
          },
        });
        console.log(`Synced metadata for template: ${tmpl.key}`);
      }
    }

    seeded = true;
  } catch (error) {
    console.error('Error seeding notification templates:', error);
  }
}

async function getMergedTemplatesForUser(userId) {
  const [user, templates, overrides] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { preferred_time: true },
    }),
    prisma.notificationTemplate.findMany({
      where: { key: { in: VALID_NOTIFICATION_KEYS } },
    }),
    prisma.notificationUserOverride.findMany({
      where: { user_id: userId, key: { in: VALID_NOTIFICATION_KEYS } },
    }),
  ]);

  return mergeNotificationTemplatesForUser({
    templates,
    overrides,
    preferredTime: user?.preferred_time,
  });
}

function mergeNotificationTemplatesForUser({ templates, overrides = [], preferredTime }) {
  const overrideMap = new Map(overrides.map((override) => [override.key, override]));

  return sortNotificationTemplates(templates).map((templateDoc) => {
    const override = overrideMap.get(templateDoc.key);

    if (override) {
      return {
        ...templateDoc,
        title: override.title,
        body: override.body,
        hour: override.hour,
        minute: override.minute,
        is_active: override.is_active,
        is_overridden: true,
      };
    }

    const template = applyPreferredTimeToTemplate(templateDoc, preferredTime);
    return {
      ...template,
      is_overridden: false,
    };
  });
}

module.exports = {
  seedNotificationTemplates,
  getMergedTemplatesForUser,
  mergeNotificationTemplatesForUser,
};
