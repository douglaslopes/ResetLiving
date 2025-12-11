
import { AppState, UserProfile, Task, Recipe } from '../types';

const STORAGE_KEY = 'vitaflow_data_v1';

const INITIAL_STATE: AppState = {
  hasOnboarded: false,
  profile: null,
  dailySchedule: [],
  recipes: [],
  userXP: 0,
  userLevel: 1,
  streakDays: 0,
  lastLoginDate: new Date().toISOString().split('T')[0],
  waterIntakeCurrent: 0,
  waterIntakeGoal: 2500,
  moodHistory: [],
};

export const loadState = (): AppState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return INITIAL_STATE;
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to load state", e);
    return INITIAL_STATE;
  }
};

export const saveState = (state: AppState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state", e);
  }
};

export const calculateLevel = (xp: number): number => {
  return Math.floor(xp / 1000) + 1;
};

export const calculateBMI = (weightKg: number, heightCm: number): number => {
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
};

export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return 'Abaixo do Peso';
  if (bmi < 24.9) return 'Peso Normal';
  if (bmi < 29.9) return 'Sobrepeso';
  return 'Obesidade';
};
