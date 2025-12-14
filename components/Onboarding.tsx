
import React, { useState, useEffect } from 'react';
import { UserProfile, Gender, ActivityLevel, WorkMode } from '../types';
import { Loader2, ArrowRight, Check, Info, Building2, Home, Car } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  isLoading: boolean;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, isLoading }) => {
  const [step, setStep] = useState(1);
  
  // Initialize with some default values to avoid controlled/uncontrolled issues
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    gender: Gender.OTHER,
    activityLevel: ActivityLevel.SEDENTARY,
    wakeUpTime: '06:30',
    bedTime: '22:30',
    workStartTime: '09:00',
    workEndTime: '18:00',
    workMode: WorkMode.ONSITE,
    workDays: [1, 2, 3, 4, 5], // Mon-Fri default
    commuteTime: 30, // 30 min default
    goals: 'Emagrecer com saúde e sair do sedentarismo',
    dietaryRestrictions: ''
  });

  // Calculate reference range based on height
  const [referenceWeightRange, setReferenceWeightRange] = useState<string>("");

  useEffect(() => {
    if (formData.height) {
      const h = formData.height / 100;
      const min = (18.5 * h * h).toFixed(1);
      const max = (24.9 * h * h).toFixed(1);
      setReferenceWeightRange(`${min}kg - ${max}kg`);
    }
  }, [formData.height]);

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const handleSubmit = () => {
    if (formData.name && formData.age && formData.weight && formData.height && formData.targetWeight) {
      onComplete(formData as UserProfile);
    }
  };

  const updateField = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleWorkDay = (dayIndex: number) => {
    const currentDays = formData.workDays || [];
    if (currentDays.includes(dayIndex)) {
        updateField('workDays', currentDays.filter(d => d !== dayIndex));
    } else {
        updateField('workDays', [...currentDays, dayIndex].sort());
    }
  };

  const weekDays = [
      { id: 0, label: 'D', name: 'Domingo' },
      { id: 1, label: 'S', name: 'Segunda' },
      { id: 2, label: 'T', name: 'Terça' },
      { id: 3, label: 'Q', name: 'Quarta' },
      { id: 4, label: 'Q', name: 'Quinta' },
      { id: 5, label: 'S', name: 'Sexta' },
      { id: 6, label: 'S', name: 'Sábado' },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white p-6 text-center">
        <div className="relative mb-8">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
            <img 
                src="/logo.png" 
                alt="ResetLiving Logo" 
                className="w-32 h-32 relative z-10 rounded-2xl shadow-lg object-cover" 
                onError={(e) => {
                    e.currentTarget.style.display = 'none';
                }}
            />
        </div>
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Criando seu ResetLiving...</h2>
        <p className="text-slate-500 opacity-90 max-w-xs">Isso pode levar alguns segundos. Nossa IA está calculando sua logística e nutrição.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      {/* Fixed Header */}
      <div className="w-full bg-white shadow-sm border-b border-slate-100 p-4 flex items-center justify-center sticky top-0 z-20">
          <div className="flex items-center gap-2">
             <img src="/logo.png" className="w-8 h-8 rounded-lg" alt="Logo" onError={(e) => e.currentTarget.style.display='none'} />
             <div>
                 <h1 className="text-lg font-bold text-slate-900 leading-tight">ResetLiving</h1>
                 <p className="text-[10px] text-primary font-medium leading-none">Redefina sua rotina.</p>
             </div>
          </div>
      </div>

      <div className="w-full max-w-md p-6 mt-4 pb-20">
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-2 rounded-full mb-8">
          <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }}></div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-xl font-semibold mb-4">Sobre Você</h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                <input
                  type="text"
                  className="w-full p-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none placeholder:text-slate-400"
                  placeholder="Seu nome"
                  value={formData.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Idade</label>
                  <input
                    type="number"
                    className="w-full p-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none placeholder:text-slate-400"
                    value={formData.age || ''}
                    onChange={(e) => updateField('age', Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Identidade de Gênero</label>
                  <select
                    className="w-full p-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={formData.gender}
                    onChange={(e) => updateField('gender', e.target.value)}
                  >
                    {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Restrições Alimentares / Alergias</label>
                <textarea
                  className="w-full p-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none placeholder:text-slate-400 text-sm"
                  rows={2}
                  placeholder="Ex: Intolerância a lactose, alergia a amendoim, vegano..."
                  value={formData.dietaryRestrictions || ''}
                  onChange={(e) => updateField('dietaryRestrictions', e.target.value)}
                />
                <p className="text-[10px] text-slate-500 mt-1">Deixe em branco se não tiver restrições.</p>
              </div>

              <button
                disabled={!formData.name || !formData.age}
                onClick={handleNext}
                className="w-full mt-6 bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Próximo <ArrowRight size={20} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-xl font-semibold mb-4">Suas Medidas</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Peso Atual (kg)</label>
                  <input
                    type="number"
                    className="w-full p-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none placeholder:text-slate-400"
                    placeholder="ex: 95"
                    value={formData.weight || ''}
                    onChange={(e) => updateField('weight', Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Altura (cm)</label>
                  <input
                    type="number"
                    className="w-full p-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none placeholder:text-slate-400"
                    placeholder="ex: 180"
                    value={formData.height || ''}
                    onChange={(e) => updateField('height', Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Qual sua Meta de Peso? (kg)</label>
                <input
                  type="number"
                  className="w-full p-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none placeholder:text-slate-400"
                  placeholder="ex: 85"
                  value={formData.targetWeight || ''}
                  onChange={(e) => updateField('targetWeight', Number(e.target.value))}
                />
                {referenceWeightRange && (
                   <div className="mt-2 text-xs text-slate-500 flex items-start gap-1 bg-slate-50 p-2 rounded">
                     <Info size={14} className="mt-0.5 flex-shrink-0" />
                     <span>
                       Nota: Pelo IMC padrão, a faixa seria {referenceWeightRange}. 
                       Mas ignore isso se você tem estrutura óssea larga ou mais massa muscular. Defina a meta que você se sente bem.
                     </span>
                   </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nível de Atividade</label>
                <div className="space-y-2">
                  {Object.values(ActivityLevel).map((level) => (
                    <button
                      key={level}
                      onClick={() => updateField('activityLevel', level)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        formData.activityLevel === level
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button onClick={handlePrev} className="flex-1 py-3 text-slate-600 font-medium">Voltar</button>
                <button
                  disabled={!formData.weight || !formData.height || !formData.targetWeight}
                  onClick={handleNext}
                  className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Próximo
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-xl font-semibold mb-4">Logística & Trabalho</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Acorda às</label>
                  <input
                    type="time"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={formData.wakeUpTime}
                    onChange={(e) => updateField('wakeUpTime', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dorme às</label>
                  <input
                    type="time"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={formData.bedTime}
                    onChange={(e) => updateField('bedTime', e.target.value)}
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                 <label className="block text-sm font-medium text-slate-700 mb-2">Dias de Trabalho</label>
                 <div className="flex justify-between gap-1">
                    {weekDays.map(day => {
                        const isSelected = (formData.workDays || []).includes(day.id);
                        return (
                            <button
                                key={day.id}
                                onClick={() => toggleWorkDay(day.id)}
                                className={`w-9 h-9 rounded-full text-xs font-bold transition-all ${isSelected ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-400'}`}
                            >
                                {day.label}
                            </button>
                        )
                    })}
                 </div>
                 <p className="text-[10px] text-slate-400 mt-1 text-center">Selecione os dias que você trabalha</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Início Trabalho</label>
                  <input
                    type="time"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={formData.workStartTime}
                    onChange={(e) => updateField('workStartTime', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fim Trabalho</label>
                  <input
                    type="time"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={formData.workEndTime}
                    onChange={(e) => updateField('workEndTime', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Modalidade</label>
                <div className="flex gap-2">
                    <button 
                        onClick={() => updateField('workMode', WorkMode.ONSITE)}
                        className={`flex-1 p-2 rounded-lg border text-xs font-medium flex flex-col items-center gap-1 ${formData.workMode === WorkMode.ONSITE ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-slate-500'}`}
                    >
                        <Building2 size={16} />
                        Presencial
                    </button>
                    <button 
                         onClick={() => updateField('workMode', WorkMode.HYBRID)}
                         className={`flex-1 p-2 rounded-lg border text-xs font-medium flex flex-col items-center gap-1 ${formData.workMode === WorkMode.HYBRID ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-slate-500'}`}
                    >
                        <Car size={16} />
                        Híbrido
                    </button>
                    <button 
                         onClick={() => updateField('workMode', WorkMode.REMOTE)}
                         className={`flex-1 p-2 rounded-lg border text-xs font-medium flex flex-col items-center gap-1 ${formData.workMode === WorkMode.REMOTE ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-slate-500'}`}
                    >
                        <Home size={16} />
                        Home Office
                    </button>
                </div>
              </div>

              {formData.workMode !== WorkMode.REMOTE && (
                  <div className="animate-fade-in">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tempo de Deslocamento (apenas ida)</label>
                    <div className="flex items-center gap-2">
                        <Car size={18} className="text-slate-400" />
                        <input
                            type="number"
                            className="flex-1 p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            placeholder="Minutos"
                            value={formData.commuteTime || ''}
                            onChange={(e) => updateField('commuteTime', Number(e.target.value))}
                        />
                        <span className="text-sm text-slate-500">min</span>
                    </div>
                  </div>
              )}

              <div className="flex gap-4 mt-6">
                <button onClick={handlePrev} className="flex-1 py-3 text-slate-600 font-medium">Voltar</button>
                <button
                  onClick={handleNext}
                  className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors"
                >
                  Próximo
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
             <div className="space-y-4 animate-fade-in">
             <h2 className="text-xl font-semibold mb-4">Objetivos</h2>
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Qual seu principal foco?</label>
               <textarea
                 className="w-full p-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none h-32 resize-none placeholder:text-slate-400"
                 placeholder="Descreva seu objetivo (ex: perder barriga, ter mais disposição, parar de comer doce...)"
                 value={formData.goals}
                 onChange={(e) => updateField('goals', e.target.value)}
               />
             </div>
             
             <div className="flex gap-4 mt-6">
               <button onClick={handlePrev} className="flex-1 py-3 text-slate-600 font-medium">Voltar</button>
               <button
                 onClick={handleSubmit}
                 className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-emerald-600 transition-colors shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
               >
                 Gerar ResetLiving <Check size={20} />
               </button>
             </div>
           </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

