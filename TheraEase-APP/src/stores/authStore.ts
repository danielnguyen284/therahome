import { create } from "zustand";
import { api } from "../services/api";
import { initAuth, signOut as authSignOut, getProfile } from "../services/auth";

export interface OwnedDevice {
	key?: string;
	name?: string;
	activation_code?: string;
}

interface User {
	id: string;
	email: string;
	full_name: string;
	avatar_url: string;
	role: string;
	is_pro: boolean;
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
	created_at: string;
}

export function createGuestUser(): User {
  const now = new Date().toISOString();

  return {
    id: 'guest',
    email: '',
    full_name: '',
    avatar_url: '',
    role: 'user',
    is_pro: false,
    age: 0,
    occupation: '',
    gender: '',
    height: '',
    weight: '',
    target_weight: '',
    primary_goal: '',
    focus_area: '',
    limitations: '',
    diet_type: '',
    pain_areas: [],
    symptoms: [],
    surgery_history: '',
    preferred_time: '20:00',
    notifications_enabled: true,
    onboarding_completed: false,
    owned_devices: [],
    created_at: now,
  };
}

interface AuthState {
	user: User | null;
	token: string | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	initialize: () => Promise<void>;
	setUser: (user: User | null) => void;
	signOut: () => Promise<void>;
	refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
	user: null,
	token: null,
	isLoading: true,
	isAuthenticated: false,

	initialize: async () => {
		try {
			set({ isLoading: true });
			const user = await initAuth();

			if (user) {
				const token = await api.getToken();
				set({
					user,
					token,
					isAuthenticated: true,
					isLoading: false,
				});
			} else {
				set({
					user: null,
					token: null,
					isAuthenticated: false,
					isLoading: false,
				});
			}
		} catch (error) {
			console.error("Auth init error:", error);
			set({
				user: null,
				token: null,
				isAuthenticated: false,
				isLoading: false,
			});
		}
	},

	setUser: (user) => {
		void api.setUser(user);
		set({
			user,
			isAuthenticated: !!user,
		});
	},

	signOut: async () => {
		await authSignOut();
		set({
			user: null,
			token: null,
			isAuthenticated: false,
		});
	},

	refreshProfile: async () => {
		try {
			const user = await getProfile();
			if (user) {
				await api.setUser(user);
				set({ user });
			}
		} catch (error) {
			console.error("Refresh profile error:", error);
		}
	},
}));
