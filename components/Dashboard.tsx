
import React from 'react';
import { Task, TaskType, AppState, XP_PER_LEVEL, Mood } from '../types';
import { CheckCircle, Circle, Droplets, Flame, Trophy, Utensils, Moon, Briefcase, Dumbbell, Smartphone, RefreshCw, Car, CalendarOff } from 'lucide-react';

interface DashboardProps {
  state: AppState;
  onToggleTask: (taskId: string) => void;
  onAddWater: () => void;
  onRegeneratePlan: () => void;
  onSetMood: (mood: Mood) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state, onToggleTask, onAddWater, onRegeneratePlan, onSetMood }) => {
  const { dailySchedule, userXP, userLevel, waterIntakeCurrent, waterIntakeGoal, streakDays, moodHistory, profile } = state;

  const progressToNextLevel = (userXP % XP_PER_LEVEL) / XP_PER_LEVEL * 100;
  const todayDate = new Date().toISOString().split('T')[0];
  const currentDayOfWeek = new Date().getDay(); // 0 = Sunday
  const todaysMoodEntry = moodHistory.find(m => m.date === todayDate);

  // LOGIC: Filter tasks based on Work Days
  // If today is NOT in profile.workDays, hide WORK and COMMUTE tasks.
  const isWorkDay = profile?.workDays?.includes(currentDayOfWeek) ?? true; // Default to true if undefined

  const sortedTasks = [...dailySchedule]
    .filter(task => {
        if (!isWorkDay && (task.type === TaskType.WORK || task.type === TaskType.COMMUTE)) {
            return false;
        }
        return true;
    })
    .sort((a, b) => a.time.localeCompare(b.time));

  const getIcon = (type: TaskType) => {
    switch (type) {
      case TaskType.MEAL: return <Utensils className="text-orange-500" size={20} />;
      case TaskType.WATER: return <Droplets className="text-blue-500" size={20} />;
      case TaskType.EXERCISE: return <Flame className="text-red-500" size={20} />;
      case TaskType.WORKOUT_APP: return <Smartphone className="text-purple-600" size={20} />;
      case TaskType.SLEEP: return <Moon className="text-indigo-400" size={20} />;
      case TaskType.WORK: return <Briefcase className="text-slate-700" size={20} />;
      case TaskType.COMMUTE: return <Car className="text-cyan-600" size={20} />;
      case TaskType.HABIT: return <CheckCircle className="text-slate-500" size={20} />;
      default: return <Circle size={20} />;
    }
  };

  const getBgColor = (type: TaskType, completed: boolean) => {
    if (completed) return 'bg-slate-50 border-slate-200 opacity-75';
    switch(type) {
      case TaskType.WORKOUT_APP: return 'bg-purple-50 border-purple-200';
      case TaskType.EXERCISE: return 'bg-red-50 border-red-200';
      case TaskType.WORK: return 'bg-slate-100 border-slate-200';
      case TaskType.COMMUTE: return 'bg-cyan-50 border-cyan-200';
      default: return 'bg-white border-slate-100';
    }
  };

  return (
    <div className="pb-24">
      {/* Mood Tracker */}
      {!todaysMoodEntry && (
        <div className="bg-white p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-700 mb-2 text-center">Como você está se sentindo hoje?</h3>
            <div className="flex justify-center gap-4">
                <button onClick={() => onSetMood(Mood.GREAT)} className="text-2xl hover:scale-110 transition-transform p-2 bg-green-50 rounded-full">😄</button>
                <button onClick={() => onSetMood(Mood.GOOD)} className="text-2xl hover:scale-110 transition-transform p-2 bg-lime-50 rounded-full">🙂</button>
                <button onClick={() => onSetMood(Mood.OK)} className="text-2xl hover:scale-110 transition-transform p-2 bg-yellow-50 rounded-full">😐</button>
                <button onClick={() => onSetMood(Mood.TIRED)} className="text-2xl hover:scale-110 transition-transform p-2 bg-orange-50 rounded-full">😫</button>
                <button onClick={() => onSetMood(Mood.BAD)} className="text-2xl hover:scale-110 transition-transform p-2 bg-red-50 rounded-full">😞</button>
            </div>
        </div>
      )}
      {todaysMoodEntry && (
          <div className="bg-slate-50 p-2 text-center text-xs text-slate-500 border-b border-slate-100">
              Humor de hoje: {todaysMoodEntry.mood === Mood.GREAT ? '😄' : todaysMoodEntry.mood === Mood.GOOD ? '🙂' : todaysMoodEntry.mood === Mood.OK ? '😐' : todaysMoodEntry.mood === Mood.TIRED ? '😫' : '😞'}
          </div>
      )}

      {/* Header Gamification */}
      <div className="bg-white p-6 rounded-b-3xl shadow-sm border-b border-slate-100 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Nível {userLevel}</h2>
            <p className="text-xs text-slate-500">{userXP} XP Total</p>
          </div>
          <div className="flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
            <Trophy size={16} />
            <span>{streakDays} dias seguidos</span>
          </div>
        </div>
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-primary to-emerald-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressToNextLevel}%` }}
          ></div>
        </div>
        <p className="text-right text-xs text-slate-400 mt-1">
          {XP_PER_LEVEL - (userXP % XP_PER_LEVEL)} XP para o próximo nível
        </p>
      </div>

      {/* Water Tracker */}
      <div className="px-6 mb-8">
        <div className="bg-blue-500 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg mb-1">Hidratação</h3>
            <p className="text-blue-100 text-sm mb-4">Meta: {waterIntakeGoal}ml</p>
            <div className="text-3xl font-bold">{waterIntakeCurrent}<span className="text-lg font-normal opacity-80">ml</span></div>
          </div>
          <button 
            onClick={onAddWater}
            className="bg-white text-blue-600 w-14 h-14 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            <Droplets size={24} fill="currentColor" />
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-6">
        <div className="flex justify-between items-end mb-4">
            <h3 className="font-bold text-slate-900 text-xl">Rotina de Hoje</h3>
            {!isWorkDay && (
                <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                    <CalendarOff size={14} />
                    <span>Dia de Folga</span>
                </div>
            )}
        </div>
        
        <div className="space-y-4">
          {sortedTasks.length === 0 ? (
            <p className="text-center text-slate-500 py-10">Nenhuma tarefa agendada.</p>
          ) : (
            sortedTasks.map((task, index) => (
              <div 
                key={task.id} 
                className={`relative flex gap-4 ${index !== sortedTasks.length - 1 ? 'pb-8' : ''}`}
              >
                {/* Connector Line */}
                {index !== sortedTasks.length - 1 && (
                  <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-slate-200 -z-10"></div>
                )}

                {/* Time Column */}
                <div className="flex-shrink-0 w-10 text-xs font-semibold text-slate-400 pt-1 text-center">
                  {task.time}
                </div>

                {/* Card */}
                <div 
                  className={`flex-1 p-4 rounded-xl border transition-all ${getBgColor(task.type, task.completed)}`}
                  onClick={() => onToggleTask(task.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className={`p-1.5 rounded-lg ${task.completed ? 'bg-slate-200' : 'bg-white shadow-sm'}`}>
                        {getIcon(task.type)}
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${task.type === TaskType.WORKOUT_APP ? 'bg-purple-100 text-purple-700' : task.type === TaskType.WORK ? 'bg-slate-200 text-slate-800' : task.type === TaskType.COMMUTE ? 'bg-cyan-100 text-cyan-800' : 'bg-slate-100 text-slate-600'}`}>
                         {task.type === TaskType.WORKOUT_APP ? 'APP EXTERNO' : task.type === TaskType.WORK ? 'TRABALHO' : task.type === TaskType.COMMUTE ? 'TRAJETO' : '+' + task.xpReward + ' XP'}
                      </span>
                      {task.calories && task.type === TaskType.MEAL && !task.completed && (
                        <span className="text-xs text-orange-500 font-medium flex items-center gap-1">
                            <Flame size={12} fill="currentColor" />
                            {task.calories} kcal
                        </span>
                      )}
                    </div>
                    {task.completed ? (
                      <CheckCircle className="text-primary" size={24} />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-slate-300"></div>
                    )}
                  </div>
                  
                  <h4 className={`font-bold text-slate-800 ${task.completed ? 'line-through opacity-50' : ''}`}>
                    {task.title}
                  </h4>
                  <p className={`text-sm text-slate-500 mt-1 ${task.completed ? 'line-through opacity-50' : ''}`}>
                    {task.description}
                  </p>
                  
                  {task.type === TaskType.WORKOUT_APP && !task.completed && (
                    <div className="mt-3 text-xs bg-purple-600 text-white py-1 px-3 rounded-full inline-block font-semibold">
                      Abrir App de Treino
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Regenerate Button */}
        <div className="mt-8 mb-4">
           <button 
             onClick={onRegeneratePlan}
             className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition-colors"
           >
              <RefreshCw size={18} />
              Gerar Nova Rotina (Ajustar Horários)
           </button>
           <p className="text-xs text-center text-slate-400 mt-2">Isso manterá seu XP e Histórico, mas mudará os horários e receitas.</p>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;

