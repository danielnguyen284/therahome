import { create } from 'zustand';
import type { PainLog } from '@/types';

interface PainState {
  todayPainLog: PainLog | null;
  painHistory: PainLog[];
  selectedPainAreas: Record<string, number>;
  setTodayPainLog: (log: PainLog | null) => void;
  setPainHistory: (history: PainLog[]) => void;
  setSelectedPainAreas: (areas: Record<string, number>) => void;
  updatePainArea: (area: string, level: number) => void;
  clearSelectedAreas: () => void;
}

export const usePainStore = create<PainState>((set) => ({
  todayPainLog: null,
  painHistory: [],
  selectedPainAreas: {},

  setTodayPainLog: (log) => set({ todayPainLog: log }),
  
  setPainHistory: (history) => set({ painHistory: history }),
  
  setSelectedPainAreas: (areas) => set({ selectedPainAreas: areas }),
  
  updatePainArea: (area, level) => set((state) => ({
    selectedPainAreas: {
      ...state.selectedPainAreas,
      [area]: level,
    },
  })),
  
  clearSelectedAreas: () => set({ selectedPainAreas: {} }),
}));
