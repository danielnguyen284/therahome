import { api } from './api';

export type WaterToday = {
  date: string;
  cups: number;
  goal: number;
};

export type WaterWeekDay = {
  date: string;
  cups: number;
  goal: number;
};

export type WaterWeekResponse = {
  range: { start: string; end: string };
  days: WaterWeekDay[];
  average_cups: number;
};

export function getLocalDateKey(input = new Date()): string {
  const year = input.getFullYear();
  const month = String(input.getMonth() + 1).padStart(2, '0');
  const day = String(input.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function getTodayWater(date = getLocalDateKey()): Promise<WaterToday> {
  return api.get<WaterToday>(`/water/today?date=${encodeURIComponent(date)}`);
}

export async function setTodayWater(payload: {
  cups: number;
  goal?: number;
  date?: string;
}): Promise<WaterToday> {
  const date = payload.date || getLocalDateKey();
  return api.put<WaterToday>('/water/today', { ...payload, date });
}

export async function incrementWater(payload: {
  delta: number;
  goal?: number;
  date?: string;
}): Promise<WaterToday> {
  const date = payload.date || getLocalDateKey();
  return api.post<WaterToday>('/water/increment', { ...payload, date });
}

export async function getWeekWater(date = getLocalDateKey()): Promise<WaterWeekResponse> {
  return api.get<WaterWeekResponse>(`/water/week?date=${encodeURIComponent(date)}`);
}
