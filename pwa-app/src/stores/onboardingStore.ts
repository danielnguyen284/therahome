import { create } from 'zustand';
import { storage } from '../lib/storage';

export interface GuestProfile {
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
  pain_level?: string;
  pain_time?: string;
  medical_history?: string;
  complications?: string[];
  previous_methods?: string[];
  method_effectiveness?: string | string[];
  notifications_enabled: boolean;
  onboarding_completed: boolean;
}

export function createDefaultDraft(): GuestProfile {
  return {
    full_name: '',
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
  };
}

export interface Product {
  id: string;
  key: string;
  name: string;
  image_url: string;
  purchase_link: string;
}

interface OnboardingState {
  draft: GuestProfile;
  pendingActivationCode: string | null;
  currentStep: string;
  products: Product[];
  setProducts: (products: Product[]) => void;
  setDraftField: <K extends keyof GuestProfile>(field: K, value: GuestProfile[K]) => void;
  updateDraft: (updates: Partial<GuestProfile>) => void;
  setPendingActivationCode: (code: string | null) => void;
  setCurrentStep: (step: string) => void;
  loadDraft: () => void;
  clearDraft: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  draft: createDefaultDraft(),
  pendingActivationCode: null,
  currentStep: 'welcome',
  products: [],

  setProducts: (products) => set({ products }),

  setDraftField: (field, value) => {
    const updatedDraft = { ...get().draft, [field]: value };
    set({ draft: updatedDraft });
    storage.set('therahome_onboarding_draft', updatedDraft);
  },

  updateDraft: (updates) => {
    const updatedDraft = { ...get().draft, ...updates };
    set({ draft: updatedDraft });
    storage.set('therahome_onboarding_draft', updatedDraft);
  },

  setPendingActivationCode: (code) => {
    set({ pendingActivationCode: code });
  },

  setCurrentStep: (step) => {
    set({ currentStep: step });
    storage.set('therahome_onboarding_step', step);
  },

  loadDraft: () => {
    if (typeof window === 'undefined') return;
    const storedDraft = storage.get<GuestProfile>('therahome_onboarding_draft');
    if (storedDraft) {
      set({ draft: storedDraft });
    }
    const storedStep = storage.get<string>('therahome_onboarding_step');
    if (storedStep) {
      set({ currentStep: storedStep });
    }
  },

  clearDraft: () => {
    set({ draft: createDefaultDraft(), pendingActivationCode: null, currentStep: 'welcome' });
    storage.remove('therahome_onboarding_draft');
    storage.remove('therahome_onboarding_step');
  },
}));
