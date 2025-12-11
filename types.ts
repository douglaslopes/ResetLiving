
export enum Gender {
  MALE = 'Masculino',
  FEMALE = 'Feminino',
  OTHER = 'Outro'
}

export enum ActivityLevel {
  SEDENTARY = 'Sedentário',
  LIGHT = 'Levemente Ativo',
  MODERATE = 'Moderado',
  ACTIVE = 'Muito Ativo'
}

export enum TaskType {
  MEAL = 'MEAL',
  WATER = 'WATER',
  EXERCISE = 'EXERCISE',
  WORKOUT_APP = 'WORKOUT_APP',
  SLEEP = 'SLEEP',
  HABIT = 'HABIT',
  WORK = 'WORK'
}

export enum Mood {
  GREAT = 'GREAT',     // 😄
  GOOD = 'GOOD',       // 🙂
  OK = 'OK',           // 😐
  TIRED = 'TIRED',     // 😫
  BAD = 'BAD'          // 😞
}

export interface WeightEntry {
  date: string; // ISO YYYY-MM-DD
  weight: number;
}

export interface MoodEntry {
  date: string; // ISO YYYY-MM-DD
  mood: Mood;
}

export interface UserProfile {
  name: string;
  age: number;
  weight: number; // Current weight in kg
  startWeight: number; // Starting weight in kg
  targetWeight: number; // Goal weight in kg (Manually set)
  weightHistory: WeightEntry[]; // History of weigh-ins
  height: number; // cm
  bmi: number;
  bmiCategory: string;
  gender: Gender;
  wakeUpTime: string; // HH:mm
  bedTime: string; // HH:mm
  workSchedule: string; // e.g., "9:00 - 18:00"
  activityLevel: ActivityLevel;
  goals: string;
}

export interface Task {
  id: string;
  time: string; // HH:mm
  title: string;
  description: string;
  type: TaskType;
  completed: boolean;
  xpReward: number;
  calories?: number; // Estimated calories for the task (if meal)
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  prepTime: string; // Display text e.g. "20 min"
  prepTimeMinutes: number; // Numeric for filtering
  calories: number;
  isMealPrepFriendly: boolean; // "Marmita" friendly
}

export interface AppState {
  hasOnboarded: boolean;
  profile: UserProfile | null;
  dailySchedule: Task[];
  recipes: Recipe[];
  userXP: number;
  userLevel: number;
  streakDays: number;
  lastLoginDate: string; // ISO Date string
  waterIntakeCurrent: number; // ml
  waterIntakeGoal: number; // ml
  moodHistory: MoodEntry[];
}

export const XP_PER_LEVEL = 1000;
