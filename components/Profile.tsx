import React, { useState } from 'react';
import { UserProfile, ActivityLevel, Task } from '../types';
import { User, Scale, Sun, Moon, Briefcase, Activity, Target, Plus, Bell, Calendar, Mic } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { requestNotificationPermission } from '../services/notificationService';
import { downloadICSFile } from '../services/calendarService';

interface ProfileProps {
  profile: UserProfile;
  dailySchedule: Task[];
  onReset: () => void;
  onUpdateWeight: (weight: number) => void;
}

const Profile: React.FC<ProfileProps> = ({ profile, dailySchedule, onReset, onUpdateWeight }) => {
  const [newWeight, setNewWeight] = useState<string>('');
  const [notifStatus, setNotifStatus] = useState<string>('Ativar Notificações');
  
  // Use the user's manual target weight if available, otherwise fallback to BMI logic (legacy support)
  const targetWeightDisplay = profile.targetWeight || Math.round((18.5 * ((profile.height/100) ** 2) + 24.9 * ((profile.height/100) ** 2)) / 2);

  const handleWeightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const weight = parseFloat(newWeight);
    if (weight && weight > 30 && weight < 300) {
        onUpdateWeight(weight);
        setNewWeight('');
        alert("Peso registrado com sucesso!");
    }
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotifStatus('Notificações Ativas');
      alert("Sucesso! Você receberá alertas no horário das suas tarefas se o app estiver aberto no computador ou celular.");
    } else {
      setNotifStatus('Bloqueado pelo Navegador');
      alert("Você precisa permitir notificações nas configurações do seu navegador para receber alertas.");
    }
  };

  const handleSyncAlexa = () => {
    if (dailySchedule.length === 0) {
        alert("Gere uma rotina primeiro!");
        return;
    }
    if (confirm("Isso baixará um arquivo de calendário (.ics). Importe este arquivo na agenda (Google/Apple) que está vinculada à sua Alexa para que ela anuncie seus horários.")) {
        downloadICSFile(dailySchedule);
    }
  };

  const chartData = (profile.weightHistory && profile.weightHistory.length > 0) 
    ? profile.weightHistory.map(entry => ({
        date: entry.date.split('-').slice(1).reverse().join('/'),
        fullDate: entry.date,
        weight: entry.weight
      }))
    : [{ date: 'Início', weight: profile.startWeight }, { date: 'Hoje', weight: profile.weight }];

  return (
    <div className="px-6 pt-6 pb-24">
      <h1 className="text-2xl font-bold text-slate-900">Seu Perfil</h1>
      <p className="text-sm text-primary font-medium mb-6">Redefina sua rotina. Viva sua melhor versão.</p>

      {/* User Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
            <User size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
            <p className="text-sm text-slate-500">{profile.age} anos • {profile.gender}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-50 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-1 text-slate-500">
                <Scale size={16} />
                <span className="text-xs">Peso Atual</span>
            </div>
            <p className="font-bold text-2xl text-slate-800">{profile.weight} <span className="text-sm font-normal">kg</span></p>
            <p className="text-[10px] text-slate-400">Início: {profile.startWeight}kg</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl">
             <div className="flex items-center gap-2 mb-1 text-slate-500">
                <Activity size={16} />
                <span className="text-xs">IMC Atual</span>
            </div>
            <p className="font-bold text-2xl text-slate-800">{profile.bmi}</p>
            <p className={`text-[10px] font-bold ${profile.bmiCategory === 'Peso Normal' ? 'text-green-500' : 'text-orange-500'}`}>
                {profile.bmiCategory}
            </p>
          </div>
        </div>
      </div>

      {/* Settings / Integrations */}
      <div className="grid grid-cols-2 gap-4 mb-6">
         <button 
           onClick={handleEnableNotifications}
           className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
         >
            <Bell className="text-blue-500" size={24} />
            <span className="text-xs font-bold text-slate-700 text-center">{notifStatus}</span>
         </button>

         <button 
           onClick={handleSyncAlexa}
           className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors group"
         >
            <div className="flex gap-1">
                <Mic className="text-cyan-500 group-hover:text-cyan-600" size={20} />
                <Calendar className="text-cyan-500 group-hover:text-cyan-600" size={20} />
            </div>
            <span className="text-xs font-bold text-slate-700 text-center">Sincronizar Alexa</span>
         </button>
      </div>

      {/* Evolution Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-900">Evolução do Peso</h3>
            <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                <Target size={12} />
                <span>Meta: {targetWeightDisplay}kg</span>
            </div>
        </div>
        
        <div className="h-64 w-full -ml-4">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                        dataKey="date" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{fill: '#94a3b8'}}
                    />
                    <YAxis 
                        domain={['auto', 'auto']} 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                        tick={{fill: '#94a3b8'}} 
                    />
                    <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ color: '#64748b' }}
                    />
                    <ReferenceLine y={targetWeightDisplay} stroke="#10b981" strokeDasharray="3 3" />
                    <Line 
                        type="monotone" 
                        dataKey="weight" 
                        stroke="#3b82f6" 
                        strokeWidth={3} 
                        dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
        
        {/* Update Weight Form */}
        <form onSubmit={handleWeightSubmit} className="mt-6 pt-6 border-t border-slate-100">
             <label className="block text-sm font-medium text-slate-700 mb-2">Registrar Pesagem Semanal</label>
             <div className="flex gap-2">
                 <input 
                    type="number" 
                    step="0.1"
                    placeholder="Novo peso (kg)"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                 />
                 <button 
                    type="submit"
                    disabled={!newWeight}
                    className="bg-slate-900 text-white px-4 rounded-lg font-medium disabled:opacity-50 hover:bg-slate-800 transition-colors"
                 >
                    <Plus size={20} />
                 </button>
             </div>
             <p className="text-xs text-slate-400 mt-2">Recomendamos se pesar sempre no mesmo horário (ex: ao acordar).</p>
        </form>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8">
        <h3 className="font-bold text-slate-900 mb-4">Rotina Configurada</h3>
        <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-slate-700">
                <Sun size={18} className="text-orange-400" />
                <span>Acorda às <strong>{profile.wakeUpTime}</strong></span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-700">
                <Moon size={18} className="text-indigo-400" />
                <span>Dorme às <strong>{profile.bedTime}</strong></span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-700">
                <Briefcase size={18} className="text-slate-400" />
                <span>Trabalho: {profile.workSchedule}</span>
            </div>
        </div>
      </div>

      <button 
        onClick={onReset}
        className="w-full py-4 text-red-500 font-medium bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
      >
        Resetar Todos os Dados
      </button>
      <p className="text-xs text-center text-slate-400 mt-4">ResetLiving v1.4</p>
    </div>
  );
};

export default Profile;