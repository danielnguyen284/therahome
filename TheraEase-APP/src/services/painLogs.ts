import { api } from './api';

// Get today's pain log
export async function getTodayPainLog() {
  try {
    return await api.get('/pain-logs/today');
  } catch (error) {
    console.error('Get today pain log error:', error);
    return null;
  }
}

// Create or update pain log
export async function createPainLog(data: {
  date: string;
  pain_areas: Record<string, number>;
  pain_level: number;
  notes?: string;
}) {
  try {
    return await api.post('/pain-logs', data);
  } catch (error) {
    console.error('Create pain log error:', error);
    throw error;
  }
}

// Update existing pain log
export async function updatePainLog(logId: string, data: any) {
  try {
    return await api.put(`/pain-logs/${logId}`, data);
  } catch (error) {
    console.error('Update pain log error:', error);
    throw error;
  }
}

// Get pain logs for a period
export async function getPainLogs(days: number = 30) {
  try {
    return await api.get(`/pain-logs?days=${days}`);
  } catch (error) {
    console.error('Get pain logs error:', error);
    return [];
  }
}

// Calculate average pain level
export function calculateAveragePainLevel(logs: any[]) {
  if (!logs || logs.length === 0) return 0;
  const total = logs.reduce((sum: number, log: any) => sum + (log.pain_level || 0), 0);
  return Math.round((total / logs.length) * 10) / 10;
}
