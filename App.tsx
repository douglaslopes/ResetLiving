
import React, { useState, useEffect, useRef } from 'react';
import { AppState, UserProfile, Mood } from './types';
import { loadState, saveState, calculateLevel, calculateBMI, getBMICategory } from './services/storage';
import { generateInitialPlan, generateRecipesOnly } from './services/geminiService';
import { sendNotification } from './services/notificationService';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Recipes from './components/Recipes';
import Profile from './components/Profile';
import { LayoutDashboard, ChefHat, UserCircle, Loader2 } from 'lucide-react';

enum View {
  DASHBOARD = 'DASHBOARD',
  RECIPES = 'RECIPES',
  PROFILE = 'PROFILE'
}

function App() {
  const [state, setState] = useState<AppState>(loadState());
  const [isLoading, setIsLoading] = useState(false);
  const [isRegeneratingRecipes, setIsRegeneratingRecipes] = useState(false);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const lastNotificationTimeRef = useRef<string | null>(null);

  // Persistence effect
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Daily reset check
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (state.lastLoginDate !== today) {
        // New day logic
        setState(prev => ({
            ...prev,
            lastLoginDate: today,
            waterIntakeCurrent: 0,
            dailySchedule: prev.dailySchedule.map(t => ({...t, completed: false})),
            streakDays: prev.streakDays + 1 // Simple streak increment logic
        }));
    }
  }, [state.lastLoginDate]);

  // Notification Loop (Runs every minute)
  useEffect(() => {
    if (!state.hasOnboarded) return;

    const intervalId = setInterval(() => {
        const now = new Date();
        const currentHour = now.getHours().toString().padStart(2, '0');
        const currentMinute = now.getMinutes().toString().padStart(2, '0');
        const currentTimeString = `${currentHour}:${currentMinute}`;

        // Avoid double sending in same minute
        if (lastNotificationTimeRef.current === currentTimeString) return;

        // Check if any task matches current time
        const taskDue = state.dailySchedule.find(t => t.time === currentTimeString && !t.completed);

        if (taskDue) {
            sendNotification(`ResetLiving: ${taskDue.title}`, taskDue.description || "Hora da sua atividade!");
            lastNotificationTimeRef.current = currentTimeString;
        }

    }, 10000); // Check every 10 seconds to catch the minute change accurately

    return () => clearInterval(intervalId);
  }, [state.dailySchedule, state.hasOnboarded]);

  const handleOnboardingComplete = async (rawProfile: UserProfile) => {
    setIsLoading(true);
    try {
      // Calculate derived metrics before saving and generating plan
      const bmi = calculateBMI(rawProfile.weight, rawProfile.height);
      const bmiCategory = getBMICategory(bmi);
      const today = new Date().toISOString().split('T')[0];
      
      const completeProfile: UserProfile = {
        ...rawProfile,
        startWeight: rawProfile.weight,
        targetWeight: rawProfile.targetWeight || rawProfile.weight, // Fallback if undefined
        weightHistory: [{ date: today, weight: rawProfile.weight }],
        bmi: bmi,
        bmiCategory: bmiCategory
      };

      // Se falhar (ex: sem API key), o service retorna o plano de fallback, não lança erro.
      const plan = await generateInitialPlan(completeProfile);
      
      setState(prev => ({
        ...prev,
        hasOnboarded: true,
        profile: completeProfile,
        dailySchedule: plan.tasks,
        recipes: plan.recipes,
        waterIntakeGoal: plan.waterGoal,
        userXP: 0,
        userLevel: 1,
        streakDays: 1,
        lastLoginDate: today,
        moodHistory: []
      }));
    } catch (error) {
      console.error("Erro fatal no onboarding:", error);
      // Se algo muito grave acontecer, apenas destravamos o loading.
      // O estado anterior (Onboarding) será mantido, permitindo tentar de novo.
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegeneratePlan = async () => {
    if (!state.profile) return;
    
    if (!confirm("Isso criará uma nova rotina e sugestões de marmitas baseadas no seu perfil atual. Seu progresso (XP, Histórico de Peso) será mantido. Deseja continuar?")) {
        return;
    }

    setIsLoading(true);
    try {
        const plan = await generateInitialPlan(state.profile);
        
        setState(prev => ({
            ...prev,
            dailySchedule: plan.tasks,
            recipes: plan.recipes,
            waterIntakeGoal: plan.waterGoal
        }));
        
        alert("Rotina atualizada com sucesso!");
    } catch (error) {
        // Fallback silencioso ou alerta suave
        console.error(error);
        alert("Não foi possível conectar com a IA. Tente novamente mais tarde.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleRegenerateRecipes = async (ingredients?: string) => {
      if (!state.profile) return;
      setIsRegeneratingRecipes(true);
      try {
          const newRecipes = await generateRecipesOnly(state.profile, ingredients);
          if (newRecipes.length > 0) {
              setState(prev => ({
                  ...prev,
                  recipes: newRecipes
              }));
              alert("Novas opções de marmitas geradas!");
          } else {
              alert("Modo Offline: Não foi possível gerar novas receitas agora. Verifique a chave de API.");
          }
      } catch(e) {
          console.error(e);
      } finally {
          setIsRegeneratingRecipes(false);
      }
  };

  const handleSetMood = (mood: Mood) => {
      const today = new Date().toISOString().split('T')[0];
      setState(prev => {
          // Remove existing entry for today if any
          const history = (prev.moodHistory || []).filter(m => m.date !== today);
          return {
              ...prev,
              moodHistory: [...history, { date: today, mood }]
          };
      });
  };

  const handleUpdateWeight = (newWeight: number) => {
    setState(prev => {
        if (!prev.profile) return prev;

        const bmi = calculateBMI(newWeight, prev.profile.height);
        const bmiCategory = getBMICategory(bmi);
        const today = new Date().toISOString().split('T')[0];

        // Check if we already have an entry for today to update it instead of duplicating
        const existingHistory = prev.profile.weightHistory || [];
        let newHistory = [...existingHistory];
        
        const todayIndex = newHistory.findIndex(entry => entry.date === today);
        if (todayIndex >= 0) {
            newHistory[todayIndex].weight = newWeight;
        } else {
            newHistory.push({ date: today, weight: newWeight });
        }

        return {
            ...prev,
            profile: {
                ...prev.profile,
                weight: newWeight,
                bmi: bmi,
                bmiCategory: bmiCategory,
                weightHistory: newHistory
            }
        };
    });
  };

  const toggleTask = (taskId: string) => {
    setState(prev => {
        const tasks = prev.dailySchedule.map(t => {
            if (t.id === taskId) {
                // Cannot un-complete for XP simplicity in this MVP
                if (t.completed) return t; 
                
                return { ...t, completed: true };
            }
            return t;
        });
        
        // Calculate new XP
        const task = prev.dailySchedule.find(t => t.id === taskId);
        const xpGain = (task && !task.completed) ? task.xpReward : 0;
        const newXP = prev.userXP + xpGain;
        const newLevel = calculateLevel(newXP);
        
        if (newLevel > prev.userLevel) {
            alert(`Parabéns! Você alcançou o nível ${newLevel}!`);
        }

        return {
            ...prev,
            dailySchedule: tasks,
            userXP: newXP,
            userLevel: newLevel
        };
    });
  };

  const addWater = () => {
    setState(prev => {
        const amount = 250; // 250ml glass
        const newAmount = prev.waterIntakeCurrent + amount;
        
        // Bonus XP for hitting goal
        let xpAdd = 10;
        if (prev.waterIntakeCurrent < prev.waterIntakeGoal && newAmount >= prev.waterIntakeGoal) {
            xpAdd += 50;
            alert("Meta de água atingida! +50 XP");
        }

        return {
            ...prev,
            waterIntakeCurrent: newAmount,
            userXP: prev.userXP + xpAdd,
            userLevel: calculateLevel(prev.userXP + xpAdd)
        }
    });
  };

  const handleReset = () => {
    if(confirm("Tem certeza que deseja apagar todos os dados e começar do zero?")) {
        localStorage.clear();
        window.location.reload();
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white p-6 text-center">
        <div className="relative mb-8">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
            <img 
                src="/logo.png" 
                alt="ResetLiving Logo" 
                className="w-32 h-32 relative z-10 rounded-2xl shadow-lg object-cover" 
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
        </div>
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Atualizando Plano...</h2>
        <p className="text-slate-500 opacity-90 max-w-xs">Isso pode levar alguns segundos enquanto a IA prepara tudo...</p>
      </div>
    );
  }

  if (!state.hasOnboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} isLoading={isLoading} />;
  }

  return (
    <div className="max-w-md mx-auto bg-slate-50 h-screen flex flex-col relative shadow-2xl overflow-hidden">
      
      {/* Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {currentView === View.DASHBOARD && (
            <Dashboard 
                state={state} 
                onToggleTask={toggleTask} 
                onAddWater={addWater}
                onRegeneratePlan={handleRegeneratePlan}
                onSetMood={handleSetMood}
            />
        )}
        {currentView === View.RECIPES && (
            <Recipes 
              recipes={state.recipes} 
              onRegenerateRecipes={handleRegenerateRecipes}
              isRegenerating={isRegeneratingRecipes}
            />
        )}
        {currentView === View.PROFILE && (
             <Profile 
                profile={state.profile!} 
                dailySchedule={state.dailySchedule}
                onReset={handleReset} 
                onUpdateWeight={handleUpdateWeight} 
             />
        )}
      </div>

      {/* Bottom Navigation - Fixed (flex-none ensures it doesn't shrink) */}
      <div className="flex-none bg-white border-t border-slate-200 px-6 py-4 flex justify-between items-center z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button 
            onClick={() => setCurrentView(View.DASHBOARD)}
            className={`flex flex-col items-center gap-1 transition-colors ${currentView === View.DASHBOARD ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
        >
            <LayoutDashboard size={24} />
            <span className="text-[10px] font-bold">Hoje</span>
        </button>

        <div className="w-px h-8 bg-slate-100"></div>

        <button 
            onClick={() => setCurrentView(View.RECIPES)}
            className={`flex flex-col items-center gap-1 transition-colors ${currentView === View.RECIPES ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
        >
            <ChefHat size={24} />
            <span className="text-[10px] font-bold">Marmitas</span>
        </button>

        <div className="w-px h-8 bg-slate-100"></div>

        <button 
             onClick={() => setCurrentView(View.PROFILE)}
            className={`flex flex-col items-center gap-1 transition-colors ${currentView === View.PROFILE ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
        >
            <UserCircle size={24} />
            <span className="text-[10px] font-bold">Perfil</span>
        </button>
      </div>
    </div>
  );
}

export default App;
