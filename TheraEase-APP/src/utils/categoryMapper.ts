/**
 * Map user's pain areas (from onboarding) to exercise categories (from admin)
 * 
 * User chọn đơn giản: neck, back, both
 * Admin có chi tiết: neck, shoulder, upper_back, middle_back, lower_back, arm, leg, full_body
 */

export const mapPainAreasToCategories = (painAreas: string[]): string[] => {
  const categories = new Set<string>();

  painAreas.forEach(area => {
    switch (area) {
      case 'neck':
        categories.add('neck');
        categories.add('shoulder'); // Vai liên quan đến cổ
        break;
      
      case 'back':
        categories.add('upper_back');
        categories.add('middle_back');
        categories.add('lower_back');
        break;
      
      case 'both':
        // Cả hai = cổ + lưng
        categories.add('neck');
        categories.add('shoulder');
        categories.add('upper_back');
        categories.add('middle_back');
        categories.add('lower_back');
        break;
      
      // Nếu user có pain_areas chi tiết (từ body map)
      case 'shoulder_left':
      case 'shoulder_right':
        categories.add('shoulder');
        break;
      
      case 'upper_back':
        categories.add('upper_back');
        break;
      
      case 'middle_back':
        categories.add('middle_back');
        break;
      
      case 'lower_back':
        categories.add('lower_back');
        break;
      
      case 'arm_left':
      case 'arm_right':
      case 'hand_left':
      case 'hand_right':
        categories.add('arm');
        break;
      
      case 'thigh_left':
      case 'thigh_right':
      case 'leg_left':
      case 'leg_right':
      case 'foot_left':
      case 'foot_right':
        categories.add('leg');
        break;
    }
  });

  // Luôn thêm full_body vì bài tập toàn thân phù hợp với mọi vùng
  categories.add('full_body');

  return Array.from(categories);
};

/**
 * Build Supabase query filter for categories
 * Usage: query.or(buildCategoryFilter(categories))
 */
export const buildCategoryFilter = (categories: string[]): string => {
  return categories.map(cat => `category.eq.${cat}`).join(',');
};

/**
 * Example usage:
 * 
 * const userPainAreas = ['neck', 'back']; // From user profile
 * const categories = mapPainAreasToCategories(userPainAreas);
 * // Returns: ['neck', 'shoulder', 'upper_back', 'middle_back', 'lower_back', 'full_body']
 * 
 * const { data } = await supabase
 *   .from('exercises')
 *   .select('*')
 *   .or(buildCategoryFilter(categories));
 */
