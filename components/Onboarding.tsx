
import React, { useState, useEffect } from 'react';
import { UserProfile, Gender, ActivityLevel } from '../types';
import { Loader2, ArrowRight, Check, Info } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  isLoading: boolean;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, isLoading }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    gender: Gender.OTHER,
    activityLevel: ActivityLevel.SEDENTARY,
    wakeUpTime: '07:00',
    bedTime: '23:00',
    workSchedule: '09:00 - 18:00',
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
        <p className="text-slate-500 opacity-90 max-w-xs">Isso pode levar alguns segundos. Nossa IA está redefinindo sua rotina para sua melhor versão.</p>
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
              <h2 className="text-xl font-semibold mb-4">Sua Rotina</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Acorda às</label>
                  <input
                    type="time"
                    className="w-full p-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={formData.wakeUpTime}
                    onChange={(e) => updateField('wakeUpTime', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dorme às</label>
                  <input
                    type="time"
                    className="w-full p-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={formData.bedTime}
                    onChange={(e) => updateField('bedTime', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Horário de Trabalho/Estudo</label>
                <input
                  type="text"
                  className="w-full p-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none placeholder:text-slate-400"
                  placeholder="ex: 09:00 - 18:00"
                  value={formData.workSchedule}
                  onChange={(e) => updateField('workSchedule', e.target.value)}
                />
              </div>
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
