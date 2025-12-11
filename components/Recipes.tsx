
import React, { useState } from 'react';
import { Recipe } from '../types';
import { ChefHat, Clock, Flame, Calculator, RefreshCw, Filter } from 'lucide-react';

interface RecipesProps {
  recipes: Recipe[];
  onRegenerateRecipes: () => void;
  isRegenerating: boolean;
}

const Recipes: React.FC<RecipesProps> = ({ recipes, onRegenerateRecipes, isRegenerating }) => {
  const [filter, setFilter] = useState<'ALL' | 'FAST' | 'COMPLEX'>('ALL');

  const filteredRecipes = recipes.filter(r => {
    if (filter === 'ALL') return true;
    if (filter === 'FAST') return (r.prepTimeMinutes || 0) <= 30;
    if (filter === 'COMPLEX') return (r.prepTimeMinutes || 0) > 30;
    return true;
  });

  const totalCalories = recipes.reduce((acc, curr) => acc + (curr.calories || 0), 0);
  const avgCalories = recipes.length > 0 ? Math.round(totalCalories / recipes.length) : 0;

  return (
    <div className="px-6 pt-6 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Marmitas Saudáveis</h1>
        <p className="text-slate-500">Sugestões práticas para sua semana.</p>
      </div>

      {/* Calorie Summary Card */}
      {recipes.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-2xl border border-orange-200 mb-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-full text-orange-500 shadow-sm">
               <Calculator size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-orange-800 uppercase tracking-wide">Média por Refeição</p>
              <p className="text-lg font-bold text-orange-900 leading-none mt-1">~{avgCalories} kcal</p>
            </div>
          </div>
           <div className="text-right">
              <p className="text-xs text-orange-600 font-medium">Total de Opções</p>
              <p className="text-sm font-bold text-orange-800">{recipes.length} receitas</p>
            </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-1">
         <button 
           onClick={() => setFilter('ALL')}
           className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${filter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
         >
           Todas
         </button>
         <button 
           onClick={() => setFilter('FAST')}
           className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${filter === 'FAST' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
         >
           Rápidas (&lt; 30min)
         </button>
         <button 
           onClick={() => setFilter('COMPLEX')}
           className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${filter === 'COMPLEX' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
         >
           Elaboradas (&gt; 30min)
         </button>
      </div>

      <div className="space-y-6">
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-slate-200 p-8">
            <ChefHat className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">
                {recipes.length === 0 ? "Nenhuma receita gerada." : "Nenhuma receita encontrada neste filtro."}
            </p>
          </div>
        ) : (
          filteredRecipes.map((recipe) => (
            <div key={recipe.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 overflow-hidden">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-lg text-slate-800">{recipe.name}</h3>
                {recipe.isMealPrepFriendly && (
                  <span className="bg-green-100 text-green-700 text-[10px] uppercase font-bold px-2 py-1 rounded">
                    Marmita
                  </span>
                )}
              </div>
              
              <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                {recipe.description}
              </p>

              <div className="flex gap-4 mb-4 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  {recipe.prepTime}
                </div>
                <div className="flex items-center gap-1">
                  <Flame size={14} />
                  {recipe.calories} kcal
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ingredientes</h4>
                <ul className="grid grid-cols-1 gap-1">
                  {recipe.ingredients.map((ing, idx) => (
                    <li key={idx} className="text-sm text-slate-700 flex items-center gap-2">
                      <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))
        )}
      </div>

      <button 
        onClick={onRegenerateRecipes}
        disabled={isRegenerating}
        className="w-full mt-6 flex items-center justify-center gap-2 py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-70"
      >
         <RefreshCw size={18} className={isRegenerating ? "animate-spin" : ""} />
         {isRegenerating ? "Criando sugestões..." : "Novas Sugestões de Marmitas"}
      </button>
    </div>
  );
};

export default Recipes;
