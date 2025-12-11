
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, Recipe, Task, TaskType } from '../types';

const getAiClient = () => {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateInitialPlan = async (profile: UserProfile): Promise<{ tasks: Task[], recipes: Recipe[], waterGoal: number }> => {
  const ai = getAiClient();
  
  const prompt = `
    Atue como um nutricionista e personal trainer de elite. Crie um plano diário para:
    Nome: ${profile.name}
    Dados: ${profile.age} anos, ${profile.weight}kg, ${profile.height}cm.
    IMC Atual: ${profile.bmi} (${profile.bmiCategory}).
    META DE PESO DO USUÁRIO: ${profile.targetWeight}kg. (Nota: O usuário pode ter biotipo largo ou musculoso, respeite essa meta mesmo que o IMC padrão sugira menos).
    
    Rotina: Acorda às ${profile.wakeUpTime}, Dorme às ${profile.bedTime}, Trab: ${profile.workSchedule}
    Nível: ${profile.activityLevel}
    Objetivo Descritivo: ${profile.goals}

    REQUISITOS OBRIGATÓRIOS:
    1. Rotina (tasks): Cronológica.
       - IMPORTANTE: Para TODAS as tarefas do tipo "MEAL", o campo 'description' DEVE conter sugestões específicas do que comer (ex: "Omelete com espinafre e aveia", não apenas "Café da manhã"). A dieta deve ser compatível com a meta de peso (${profile.targetWeight}kg).
       - OBRIGATÓRIO: Incluir uma tarefa diária para tomar "1 scoop de Creatina" (este é o único suplemento do usuário).
       - OBRIGATÓRIO: Se o usuário definiu horário de trabalho (${profile.workSchedule}), crie uma tarefa "Iniciar Foco no Trabalho" no início e "Encerrar Expediente" no final.
       - Inclua horários de água.
       - Inclua caminhadas leves se sedentário.
       - Inclua um lembrete: "Abrir App de Treino" em horário estratégico.
       - Para refeições ("MEAL"), estime as calorias no campo 'calories'.
    
    2. Receitas (Marmitas):
       - Gere entre 5 a 7 receitas de refeições saudáveis (almoço/jantar) que possam ser congeladas (meal prep).
       - Devem ser práticas, baratas e focadas em reeducação alimentar sem pânico.

    3. Meta de água em ml.

    Retorne JSON puro.
  `;

  try {
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
    console.error("Gemini API Error:", error);
    // Fallback básico para evitar tela branca
    return {
        waterGoal: 2500,
        tasks: [
            { id: '1', time: '07:00', title: 'Café da Manhã', description: 'Ovos mexidos, 1 fatia de pão integral e mamão.', type: TaskType.MEAL, completed: false, xpReward: 30, calories: 350 },
            { id: '2', time: '07:15', title: 'Suplementação', description: 'Tomar 1 scoop de Creatina com água.', type: TaskType.HABIT, completed: false, xpReward: 10 },
            { id: '3', time: '09:00', title: 'Iniciar Foco no Trabalho', description: 'Organize suas tarefas e inicie o dia produtivo.', type: TaskType.WORK, completed: false, xpReward: 20 },
            { id: '4', time: '13:00', title: 'Almoço', description: 'Frango grelhado (150g), arroz integral (3 colheres) e salada verde à vontade.', type: TaskType.MEAL, completed: false, xpReward: 40, calories: 500 },
        ],
        recipes: []
    };
  }
};

export const generateRecipesOnly = async (profile: UserProfile): Promise<Recipe[]> => {
    const ai = getAiClient();
    
    const prompt = `
      Crie 6 NOVAS sugestões de receitas de marmitas saudáveis para:
      Perfil: ${profile.name}, objetivo: ${profile.goals}, Meta Peso: ${profile.targetWeight}kg.
      Foco: Praticidade, baixo custo e congelamento (Meal Prep).
      Evite receitas repetitivas.
    `;
  
    try {
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
