import { updateProfile } from "./auth";
import { useAuthStore } from "../stores/authStore";

type OnboardingProfileUpdates = Partial<{
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
	onboarding_completed: boolean;
	owned_devices: Array<
		| string
		| {
				key?: string;
				name?: string;
				activation_code?: string;
		  }
	>;
}>;

export function mergeOnboardingUser(updates: OnboardingProfileUpdates) {
	const { user, setUser } = useAuthStore.getState();
	if (!user) return null;

	const nextUser = { ...user, ...updates };
	setUser(nextUser);
	return nextUser;
}

export async function persistOnboardingProfile() {
	const { user, setUser } = useAuthStore.getState();
	if (!user) return null;

	const payload = {
		full_name: user.full_name || "",
		age: user.age || 0,
		occupation: user.occupation || "",
		gender: user.gender || "",
		height: user.height || "",
		weight: user.weight || "",
		target_weight: user.target_weight || "",
		primary_goal: user.primary_goal || "",
		focus_area: user.focus_area || "",
		limitations: user.limitations || "",
		diet_type: user.diet_type || "",
		pain_areas: user.pain_areas || [],
		symptoms: user.symptoms || [],
		surgery_history: user.surgery_history || "",
		preferred_time: user.preferred_time || "20:00",
		onboarding_completed: true,
		owned_devices: user.owned_devices || [],
	};

	const savedUser = await updateProfile(payload);
	setUser(savedUser);
	return savedUser;
}
