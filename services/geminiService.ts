
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, Recipe, Task, TaskType, WorkMode } from '../types';

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
  
    // Prepara texto de logística
    let logisticsText = `Trabalho: ${profile.workStartTime} às ${profile.workEndTime}. Modalidade: ${profile.workMode}.`;
    if (profile.workMode !== WorkMode.REMOTE && profile.commuteTime > 0) {
        logisticsText += ` ATENÇÃO: O usuário leva ${profile.commuteTime} minutos para chegar ao trabalho. Crie tarefas de 'Deslocamento' (type: COMMUTE) antes do trabalho e depois do trabalho, ajustando os horários para garantir que ele chegue a tempo.`;
    }

    const prompt = `
      Atue como um nutricionista e personal trainer de elite. Crie um plano diário PADRÃO para um DIA DE TRABALHO do usuário.
      Nome: ${profile.name}
      Dados: ${profile.age} anos, ${profile.weight}kg, ${profile.height}cm, Gênero: ${profile.gender}.
      IMC Atual: ${profile.bmi} (${profile.bmiCategory}).
      META DE PESO: ${profile.targetWeight}kg. 
      RESTRIÇÕES ALIMENTARES: ${profile.dietaryRestrictions || "Nenhuma"} (Respeite rigorosamente).
      
      Rotina Base: Acorda às ${profile.wakeUpTime}, Dorme às ${profile.bedTime}.
      ${logisticsText}
      Nível: ${profile.activityLevel}
      Objetivo: ${profile.goals}

      REQUISITOS OBRIGATÓRIOS:
      1. Rotina (tasks): Cronológica.
         - IMPORTANTE: Para TODAS as tarefas do tipo "MEAL", o campo 'description' DEVE conter sugestões específicas do que comer, respeitando as restrições alimentares.
         - OBRIGATÓRIO: Incluir "1 scoop de Creatina" como suplemento.
         - OBRIGATÓRIO: Use type 'WORK' para o período de trabalho e 'COMMUTE' para o deslocamento (se houver).
         - OBRIGATÓRIO: Se for Home Office, sugira pausas ativas.
         - Inclua horários de água.
         - Inclua treino em horário viável (considerando deslocamento se houver).
      
      2. Receitas (Marmitas):
         - Gere 6 receitas saudáveis para almoço/jantar, foco em praticidade e congelamento.
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
                  type: { type: Type.STRING, enum: ["MEAL", "WATER", "EXERCISE", "WORKOUT_APP", "SLEEP", "HABIT", "WORK", "COMMUTE"] },
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
                  prepTimeMinutes: { type: Type.NUMBER },
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
            { id: '1', time: profile.wakeUpTime, title: 'Acordar e Hidratar', description: 'Beba 500ml de água.', type: TaskType.HABIT, completed: false, xpReward: 10 },
            { id: '2', time: '07:00', title: 'Café da Manhã', description: 'Ovos mexidos com espinafre e pão integral.', type: TaskType.MEAL, completed: false, xpReward: 30, calories: 350 },
            { id: '3', time: '07:30', title: 'Deslocamento', description: 'Ida para o trabalho (ouça um podcast).', type: TaskType.COMMUTE, completed: false, xpReward: 20 },
            { id: '4', time: profile.workStartTime, title: 'Início do Trabalho', description: 'Organize as prioridades do dia.', type: TaskType.WORK, completed: false, xpReward: 20 },
            { id: '5', time: '13:00', title: 'Almoço', description: 'Frango grelhado, arroz integral e vegetais.', type: TaskType.MEAL, completed: false, xpReward: 40, calories: 500 },
            { id: '6', time: profile.workEndTime, title: 'Fim do Expediente', description: 'Desconecte-se.', type: TaskType.WORK, completed: false, xpReward: 20 },
            { id: '7', time: '19:00', title: 'Treino', description: 'Exercícios em casa ou academia.', type: TaskType.WORKOUT_APP, completed: false, xpReward: 50 },
        ],
        recipes: [
            { id: 'r1', name: 'Escondidinho Fit', description: 'Batata doce e frango desfiado.', ingredients: ['Batata doce', 'Frango'], prepTime: '40 min', prepTimeMinutes: 40, calories: 400, isMealPrepFriendly: true },
            { id: 'r2', name: 'Omelete de Forno', description: 'Ovos com vegetais variados.', ingredients: ['Ovos', 'Tomate', 'Espinafre'], prepTime: '20 min', prepTimeMinutes: 20, calories: 300, isMealPrepFriendly: true }
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
          ingredientText = `O usuário tem estes ingredientes: "${availableIngredients}". Priorize usá-los.`;
      }

      const prompt = `
        Crie 6 NOVAS sugestões de receitas de marmitas saudáveis para:
        Objetivo: ${profile.goals}.
        Restrições: ${profile.dietaryRestrictions || "Nenhuma"}.
        ${ingredientText}
        Foco: Praticidade e congelamento.
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

