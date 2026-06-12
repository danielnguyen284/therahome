import { create } from 'zustand';
import type { Exercise, WorkoutLog } from '@/types';

interface ExerciseState {
  exercises: Exercise[];
  currentExercise: Exercise | null;
  workoutHistory: WorkoutLog[];
  recommendedExercises: Exercise[];
  setExercises: (exercises: Exercise[]) => void;
  setCurrentExercise: (exercise: Exercise | null) => void;
  setWorkoutHistory: (history: WorkoutLog[]) => void;
  setRecommendedExercises: (exercises: Exercise[]) => void;
}

export const useExerciseStore = create<ExerciseState>((set) => ({
  exercises: [],
  currentExercise: null,
  workoutHistory: [],
  recommendedExercises: [],

  setExercises: (exercises) => set({ exercises }),
  
  setCurrentExercise: (exercise) => set({ currentExercise: exercise }),
  
  setWorkoutHistory: (history) => set({ workoutHistory: history }),
  
  setRecommendedExercises: (exercises) => set({ recommendedExercises: exercises }),
}));
