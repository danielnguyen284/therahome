import { api } from './api';

export interface PlanDayVideo {
  id: string;
  workout_plan_id: string;
  order: number;
  link: string;
}

export interface PersonalizedPlanDayVideo {
  id: string;
  video_group?: 'regular' | 'device_supported';
  title?: string;
  description?: string;
  link: string;
  is_active?: boolean;
}

export interface PersonalizedPlanRandomResponse {
  regular_count: number;
  device_count: number;
  total: number;
  items: PersonalizedPlanDayVideo[];
}

type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

export async function getVideoByPlanDay(
  planId: string,
  order: number
): Promise<ServiceResult<PlanDayVideo | null>> {
  try {
    const data = await api.get<PlanDayVideo | null>(
      `/videos/resolve?planId=${encodeURIComponent(planId)}&order=${encodeURIComponent(String(order))}`
    );
    return { data, error: null };
  } catch (error) {
    console.error('Get video by day error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Không thể tải video theo ngày',
    };
  }
}

export async function getRandomizedPersonalizedPlanVideos(params?: {
  regularCount?: number;
  deviceCount?: number;
}): Promise<ServiceResult<PersonalizedPlanRandomResponse | null>> {
  try {
    const search = new URLSearchParams();
    search.set('regularCount', String(params?.regularCount ?? 6));
    search.set('deviceCount', String(params?.deviceCount ?? 1));

    const data = await api.get<PersonalizedPlanRandomResponse | null>(
      `/personalized-plan-videos/random?${search.toString()}`
    );
    return { data, error: null };
  } catch (error) {
    console.error('Get randomized personalized plan videos error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Không thể random video lộ trình cá nhân hoá',
    };
  }
}
