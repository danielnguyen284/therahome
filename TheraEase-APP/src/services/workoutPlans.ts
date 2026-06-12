import { api } from './api';

export interface WorkoutPlan {
  id: string;
  title: string;
  description: string;
  target_area: string;
  difficulty: string;
  duration_days: number;
  is_pro: boolean;
}

export interface PlanExercise {
  id: string;
  day_number: number;
  exercise_id: string;
  exercise: any; // populated exercise data
}

type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

// Get all workout plans
export async function getWorkoutPlans(): Promise<ServiceResult<WorkoutPlan[]>> {
  try {
    const data = await api.get<WorkoutPlan[]>('/workout-plans');
    return { data, error: null };
  } catch (error) {
    console.error('Get workout plans error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Không thể tải danh sách lộ trình',
    };
  }
}

// Get plan by ID
export async function getWorkoutPlanById(planId: string): Promise<ServiceResult<WorkoutPlan>> {
  try {
    const data = await api.get<WorkoutPlan>(`/workout-plans/${planId}`);
    return { data, error: null };
  } catch (error) {
    console.error('Get workout plan error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Không thể tải chi tiết lộ trình',
    };
  }
}

// Get exercises for a plan (with details)
export async function getPlanExercises(planId: string): Promise<ServiceResult<PlanExercise[]>> {
  try {
    const data = await api.get<any[]>(`/workout-plans/${planId}/exercises`);
    // Transform to match expected format
    const transformed = (data || []).map((item: any) => ({
      ...item,
      exercise: item.exercise_id || item.exercise,
    }));
    return { data: transformed, error: null };
  } catch (error) {
    console.error('Get plan exercises error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Không thể tải bài tập của lộ trình',
    };
  }
}

// Get user progress on a plan
export async function getPlanProgress(planId: string, userId: string): Promise<ServiceResult<any[]>> {
  try {
    const data = await api.get<any[]>(`/workout-plans/${planId}/progress/${userId}`);
    return { data, error: null };
  } catch (error) {
    console.error('Get plan progress error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Không thể tải tiến độ lộ trình',
    };
  }
}
