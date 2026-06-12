export type OwnedDeviceEntry =
  | string
  | {
      key?: string;
      name?: string;
      activation_code?: string;
    };

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function mapOwnedDeviceToLegacyId(item: OwnedDeviceEntry): string {
  if (typeof item === 'string') {
    return item;
  }

  const key = item.key?.trim().toLowerCase();
  if (key === 'ech') return 'neck_device';
  if (key === 'rung') return 'back_device';

  const name = normalizeText(item.name || '');
  if (name.includes('ech') || name.includes('co') || name.includes('neck')) {
    return 'neck_device';
  }
  if (name.includes('rung') || name.includes('lung') || name.includes('back')) {
    return 'back_device';
  }

  return key || '';
}

export function getOwnedDeviceIds(items: OwnedDeviceEntry[] = []): string[] {
  return items.map(mapOwnedDeviceToLegacyId).filter(Boolean);
}

export function getOwnedDeviceDisplayName(item: OwnedDeviceEntry): string {
  if (typeof item === 'string') {
    return item;
  }

  return item.name || item.key || item.activation_code || 'Thiết bị';
}
