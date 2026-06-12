import { api } from './api';

// Submit workout feedback
export async function submitFeedback(data: {
  workout_log_id: string;
  feeling?: string;
  skip_reason?: string;
  comment?: string;
}) {
  try {
    return await api.post('/workout-feedback', data);
  } catch (error) {
    console.error('Submit feedback error:', error);
    throw error;
  }
}

// Get feedback history
export async function getFeedbackHistory(limit = 50) {
  try {
    return await api.get(`/workout-feedback?limit=${limit}`);
  } catch (error) {
    console.error('Get feedback error:', error);
    return [];
  }
}
