export interface OwnedDevice {
	key?: string;
	name?: string;
	activation_code?: string;
}

export interface User {
	id: string;
	full_name: string;
	age: number;
	occupation: string;
	gender: string;
	height: string;
	weight: string;
	target_weight: string;
	primary_goal: string;
	focus_area: string;
	limitations: string;
	diet_type: string;
	pain_areas: string[];
	symptoms: string[];
	surgery_history: string;
	preferred_time: string;
	notifications_enabled: boolean;
	personalized_plan_started_at?: string | null;
	personalized_plan_completed_at?: string | null;
	personalized_plan_unlock_at?: string | null;
	onboarding_completed: boolean;
	owned_devices: Array<string | OwnedDevice>;
	is_pro: boolean;
	created_at: string;
}

export interface PainLog {
	id: string;
	user_id: string;
	date: string;
	pain_areas: Record<string, number>;
	pain_level: number;
	notes?: string;
	created_at: string;
}

export interface Exercise {
	id: string;
	title: string;
	description?: string;
	video_url: string;
	video_urls_by_pain?: {
		no_pain?: string;
		mild?: string;
		moderate?: string;
		severe?: string;
	};
	thumbnail_url: string;
	difficulty: "easy" | "medium" | "hard";
	target_areas: string[];
	category:
		| "neck"
		| "shoulder"
		| "upper_back"
		| "middle_back"
		| "lower_back"
		| "arm"
		| "leg"
		| "full_body";
	is_pro: boolean;
	order_index: number;
	tags?: string[];
	instructions?: Array<{ step: number; text: string }>;
	benefits?: string[];
	variations?: { description?: string };
}

export interface WorkoutLog {
	id: string;
	user_id: string;
	exercise_id: string;
	started_at: string;
	completed_at?: string;
	is_completed: boolean;
	feedback?: "better" | "same" | "worse";
	duration_seconds?: number;
	skipped: boolean;
}

export interface UserBehavior {
	id: string;
	user_id: string;
	total_workouts: number;
	streak_days: number;
	favorite_exercises: string[];
	avoided_exercises: string[];
	avg_session_duration: number;
	last_workout_at?: string;
	updated_at: string;
}

export interface WorkoutPlan {
	id: string;
	title: string;
	description: string;
	duration_days: number;
	target_area: string;
	is_pro: boolean;
}

export interface PlanExercise {
	id: string;
	plan_id: string;
	exercise_id: string;
	day_number: number;
	order_in_day: number;
}

export interface ChatMessage {
	id: string;
	user_id: string;
	message: string;
	role: "user" | "assistant";
	created_at: string;
}

export interface AIRecommendation {
	exercise_id: string;
	reason: string;
	priority: number;
	estimated_duration?: number;
}

export interface NotificationInboxItem {
	id: string;
	key: string;
	title: string;
	body: string;
	sent_at?: string | null;
	created_at: string;
	is_read: boolean;
	read_at?: string | null;
}
