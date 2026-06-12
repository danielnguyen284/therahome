import { api } from './api';

// Get all exercises (optionally filtered)
export async function getExercises(painAreas?: string[]) {
  try {
    let endpoint = '/exercises';
    if (painAreas && painAreas.length > 0) {
      endpoint += `?pain_areas=${painAreas.join(',')}`;
    }
    return await api.get(endpoint);
  } catch (error) {
    console.error('Get exercises error:', error);
    return [];
  }
}

// Get exercises by category
export async function getExercisesByCategory(category: string) {
  try {
    return await api.get(`/exercises?category=${category}`);
  } catch (error) {
    console.error('Get exercises by category error:', error);
    return [];
  }
}

// Get exercise by ID
export async function getExerciseById(id: string) {
  try {
    return await api.get(`/exercises/${id}`);
  } catch (error) {
    console.error('Get exercise error:', error);
    return null;
  }
}

// Log a workout
export async function logWorkout(data: {
  exercise_id: string;
  plan_id?: string;
  day_number?: number;
  started_at?: string;
  completed_at?: string;
  is_completed?: boolean;
  skipped?: boolean;
  feedback?: string;
  duration_seconds?: number;
}) {
  try {
    return await api.post('/exercises/workout-log', data);
  } catch (error) {
    console.error('Log workout error:', error);
    throw error;
  }
}

// Update workout log
export async function updateWorkoutLog(logId: string, data: any) {
  try {
    return await api.put(`/exercises/workout-log/${logId}`, data);
  } catch (error) {
    console.error('Update workout log error:', error);
    throw error;
  }
}

// Get workout history
export async function getWorkoutHistory(userId: string, limit = 30) {
  try {
    return await api.get(`/exercises/workout-history/${userId}?limit=${limit}`);
  } catch (error) {
    console.error('Get workout history error:', error);
    return [];
  }
}

// Get user behavior
export async function getUserBehavior(userId: string) {
  try {
    return await api.get(`/exercises/user-behavior/${userId}`);
  } catch (error) {
    console.error('Get user behavior error:', error);
    return null;
  }
}
