import { api } from './api';

// Get daily health tips
export async function getHealthTips(category?: string) {
  try {
    let endpoint = '/health-tips';
    if (category) endpoint += `?category=${category}`;
    return await api.get(endpoint);
  } catch (error) {
    console.error('Get health tips error:', error);
    return [];
  }
}

// Get nutrition tips
export async function getNutritionTips(limit = 5) {
  try {
    return await api.get(`/nutrition-tips?limit=${limit}`);
  } catch (error) {
    console.error('Get nutrition tips error:', error);
    return [];
  }
}

// Get daily recommendation (personalized from AI)
export async function getDailyRecommendation(date?: string) {
  try {
    const d = date || new Date().toISOString().split('T')[0];
    const data = await api.get(`/daily-recommendations?date=${d}`);
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Get daily recommendation error:', error);
    return null;
  }
}

// Save daily recommendation
export async function saveDailyRecommendation(data: {
  date: string;
  nutrition_advice: string;
  sport_advice: string;
  device_level?: number;
  device_duration?: number;
}) {
  try {
    return await api.post('/daily-recommendations', data);
  } catch (error) {
    console.error('Save daily recommendation error:', error);
    throw error;
  }
}
