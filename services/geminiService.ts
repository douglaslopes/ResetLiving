
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, Recipe, Task, TaskType } from '../types';

// Helper seguro para recuperar a chave em diferentes ambientes de build (Vite, CRA, Vercel)
const getApiKey = () => {
    let key = '';
    try {
        // Tenta ler variáveis de ambiente padrão do Node/CRA
        if (typeof process !== 'undefined' && process.env) {
            key = process.env.API_KEY || process.env.REACT_APP_API_KEY || process.env.VITE_API_KEY || '';
        }
    } catch (e) {}

    // Tenta ler variáveis do Vite (import.meta.env)
    if (!key) {
        try {
            // @ts-ignore
            if (import.meta && import.meta.env) {
                // @ts-ignore
                key = import.meta.env.VITE_API_KEY || '';
            }
        } catch (e) {}
    }
    return key;
};

export const generateInitialPlan = async (profile: UserProfile): Promise<{ tasks: Task[], recipes: Recipe[], waterGoal: number }> => {
  try {
    const apiKey = getApiKey();
    
    // Se não tiver chave, lança erro para cair no catch e usar o fallback
    if (!apiKey) {
        console.warn("API Key não encontrada. Usando plano offline.");
        throw new Error("Missing API Key");
    }

    const ai = new GoogleGenAI({ apiKey });
  
    const prompt = `
      Atue como um nutricionista e personal trainer de elite. Crie um plano diário para:
      Nome: ${profile.name}
      Dados: ${profile.age} anos, ${profile.weight}kg, ${profile.height}cm, Gênero: ${profile.gender}.
      IMC Atual: ${profile.bmi} (${profile.bmiCategory}).
      META DE PESO DO USUÁRIO: ${profile.targetWeight}kg. 
      RESTRIÇÕES ALIMENTARES: ${profile.dietaryRestrictions || "Nenhuma"} (LEVE ISSO MUITO A SÉRIO).
      
      Rotina: Acorda às ${profile.wakeUpTime}, Dorme às ${profile.bedTime}, Trab: ${profile.workSchedule}
      Nível: ${profile.activityLevel}
      Objetivo Descritivo: ${profile.goals}

      REQUISITOS OBRIGATÓRIOS:
      1. Rotina (tasks): Cronológica.
         - IMPORTANTE: Para TODAS as tarefas do tipo "MEAL", o campo 'description' DEVE conter sugestões específicas do que comer, respeitando as restrições alimentares.
         - OBRIGATÓRIO: Incluir uma tarefa diária para tomar "1 scoop de Creatina" (este é o único suplemento do usuário).
         - OBRIGATÓRIO: Se o usuário definiu horário de trabalho (${profile.workSchedule}), crie uma tarefa "Iniciar Foco no Trabalho" no início e "Encerrar Expediente" no final.
         - Inclua horários de água.
         - Inclua caminhadas leves se sedentário.
         - Inclua um lembrete: "Abrir App de Treino" em horário estratégico.
         - Para refeições ("MEAL"), estime as calorias no campo 'calories'.
      
      2. Receitas (Marmitas):
         - Gere entre 5 a 7 receitas de refeições saudáveis (almoço/jantar) que possam ser congeladas (meal prep).
         - DEVEM RESPEITAR: ${profile.dietaryRestrictions || "Nenhuma restrição"}.

      3. Meta de água em ml.

      Retorne JSON puro.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            waterGoal: { type: Type.NUMBER, description: "Meta diária de água em ML" },
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING, description: "Horário formato HH:mm" },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING, description: "O que fazer ou O QUE COMER especificamente" },
                  type: { type: Type.STRING, enum: ["MEAL", "WATER", "EXERCISE", "WORKOUT_APP", "SLEEP", "HABIT", "WORK"] },
                  xpReward: { type: Type.NUMBER, description: "XP ganho (10-50)" },
                  calories: { type: Type.NUMBER, description: "Estimativa calórica se for refeição" }
                },
                required: ["time", "title", "description", "type", "xpReward"]
              }
            },
            recipes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                  prepTime: { type: Type.STRING },
                  prepTimeMinutes: { type: Type.NUMBER, description: "Tempo em minutos (apenas numero)" },
                  calories: { type: Type.NUMBER },
                  isMealPrepFriendly: { type: Type.BOOLEAN }
                },
                required: ["name", "description", "ingredients", "prepTime", "prepTimeMinutes", "calories", "isMealPrepFriendly"]
              }
            }
          },
          required: ["waterGoal", "tasks", "recipes"]
        }
      }
    });

    if (response.text) {
        let cleanText = response.text.trim();
        // Limpeza extra de blocos de código Markdown que a IA as vezes envia
        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '').trim();
        } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/^```/, '').replace(/```$/, '').trim();
        }

        const data = JSON.parse(cleanText);
        
        const tasksWithIds = (data.tasks || []).map((t: any, index: number) => ({
            ...t,
            id: `task-${Date.now()}-${index}`,
            completed: false
        }));

        const recipesWithIds = (data.recipes || []).map((r: any, index: number) => ({
            ...r,
            id: `recipe-${Date.now()}-${index}`
        }));

        return {
            tasks: tasksWithIds,
            recipes: recipesWithIds,
            waterGoal: data.waterGoal || 2500
        };
    }
    throw new Error("No data returned from AI");

  } catch (error) {
    console.error("Gemini API Error or Timeout:", error);
    // PLANO DE BACKUP (FALLBACK)
    return {
        waterGoal: 2500,
        tasks: [
            { id: '1', time: '07:00', title: 'Café da Manhã', description: 'Ovos mexidos com espinafre e 1 fatia de pão integral.', type: TaskType.MEAL, completed: false, xpReward: 30, calories: 350 },
            { id: '2', time: '07:15', title: 'Suplementação', description: 'Tomar 1 scoop de Creatina com água.', type: TaskType.HABIT, completed: false, xpReward: 10 },
            { id: '3', time: '09:00', title: 'Iniciar Foco no Trabalho', description: 'Organize suas tarefas e inicie o dia produtivo.', type: TaskType.WORK, completed: false, xpReward: 20 },
            { id: '4', time: '10:30', title: 'Hidratação', description: 'Beber 2 copos de água.', type: TaskType.WATER, completed: false, xpReward: 10 },
            { id: '5', time: '13:00', title: 'Almoço', description: 'Frango grelhado (150g), arroz integral (3 colheres) e salada verde.', type: TaskType.MEAL, completed: false, xpReward: 40, calories: 500 },
            { id: '6', time: '18:00', title: 'Encerrar Expediente', description: 'Desconecte-se do trabalho. Hora de cuidar de você.', type: TaskType.WORK, completed: false, xpReward: 20 },
            { id: '7', time: '19:00', title: 'Treino', description: 'Abrir App de Treino e fazer exercícios do dia.', type: TaskType.WORKOUT_APP, completed: false, xpReward: 50 },
        ],
        recipes: [
            { id: 'r1', name: 'Escondidinho de Batata Doce', description: 'Camadas de purê de batata doce e carne moída magra.', ingredients: ['Batata doce', 'Patinho moído', 'Cebola', 'Alho'], prepTime: '40 min', prepTimeMinutes: 40, calories: 400, isMealPrepFriendly: true },
            { id: 'r2', name: 'Frango com Legumes Assados', description: 'Cubos de peito de frango assados com brócolis e cenoura.', ingredients: ['Peito de frango', 'Brócolis', 'Cenoura', 'Azeite'], prepTime: '25 min', prepTimeMinutes: 25, calories: 350, isMealPrepFriendly: true }
        ]
    };
  }
};

export const generateRecipesOnly = async (profile: UserProfile, availableIngredients?: string): Promise<Recipe[]> => {
    try {
      const apiKey = getApiKey();
      if (!apiKey) throw new Error("Missing API Key");

      const ai = new GoogleGenAI({ apiKey });
      
      let ingredientText = "";
      if (availableIngredients && availableIngredients.trim().length > 0) {
          ingredientText = `O usuário tem estes ingredientes em casa: "${availableIngredients}". PRIORIZE receitas que usem esses itens para evitar desperdício e economizar, mas pode adicionar itens básicos de despensa.`;
      }

      const prompt = `
        Crie 6 NOVAS sugestões de receitas de marmitas saudáveis para:
        Perfil: ${profile.name}, objetivo: ${profile.goals}.
        Restrições Alimentares: ${profile.dietaryRestrictions || "Nenhuma"}.
        ${ingredientText}
        Foco: Praticidade, baixo custo e congelamento (Meal Prep).
      `;
    
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recipes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                    prepTime: { type: Type.STRING },
                    prepTimeMinutes: { type: Type.NUMBER },
                    calories: { type: Type.NUMBER },
                    isMealPrepFriendly: { type: Type.BOOLEAN }
                  },
                  required: ["name", "description", "ingredients", "prepTime", "prepTimeMinutes", "calories", "isMealPrepFriendly"]
                }
              }
            }
          }
        }
      });
  
      if (response.text) {
          let cleanText = response.text.trim();
          if (cleanText.startsWith('```json')) {
              cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '').trim();
          } else if (cleanText.startsWith('```')) {
              cleanText = cleanText.replace(/^```/, '').replace(/```$/, '').trim();
          }
  
          const data = JSON.parse(cleanText);
          return (data.recipes || []).map((r: any, index: number) => ({
              ...r,
              id: `new-recipe-${Date.now()}-${index}`
          }));
      }
      return [];
    } catch (e) {
      console.error("Error generating recipes", e);
      return []; 
    }
  };
