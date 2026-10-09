import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { config } from '../config/env.js';
// Structured Output Schema
export const FoodAnalysisResultSchema = z.object({
    food_name: z.string().min(1),
    ingredients: z.array(z.string()).default([]),
    portion_description: z.string().default('1 serving'),
    portion_grams: z.number().positive().default(250),
    estimated_calories_kcal: z.number().nonnegative(),
    estimated_protein_g: z.number().nonnegative().default(0),
    estimated_carbohydrates_g: z.number().nonnegative().default(0),
    estimated_fat_g: z.number().nonnegative().default(0),
    confidence: z.enum(['high', 'moderate', 'low']).default('moderate'),
    estimation_disclaimer: z.string().default('Nutritional figures are visual estimates. Actual calories and macros vary based on cooking methods, oils, and hidden ingredients.'),
    is_mock: z.boolean().default(false),
    ai_model: z.string().default('gemini-2.5-flash'),
});
export class GeminiVisionService {
    client = null;
    constructor() {
        if (config.gemini.apiKey && !config.gemini.apiKey.includes('placeholder')) {
            this.client = new GoogleGenAI({ apiKey: config.gemini.apiKey });
        }
    }
    async analyzeFoodImage(imageBuffer, mimeType, userContext) {
        // If no API key configured, return explicit mock data
        if (!this.client || !config.gemini.apiKey) {
            return this.generateMockAnalysis(userContext);
        }
        try {
            const base64Data = imageBuffer.toString('base64');
            const systemPrompt = `You are LifeCare AI's nutrition specialist. 
Analyze this food photograph and provide a realistic, healthy estimation of the food items, portion size, calories, and macronutrients.
Remember the following safety and ethics principles:
1. Always present numbers as reasonable approximations (visual estimates cannot account for hidden oils or exact salt/sugar).
2. Never shame the user or prescribe extreme calorie deficits.
3. Be culturally diverse and recognize global cuisines.
4. Output strict JSON matching this exact structure:
{
  "food_name": "Name of primary dish or foods",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "portion_description": "e.g., 1 medium bowl or 1 plate",
  "portion_grams": 250,
  "estimated_calories_kcal": 380,
  "estimated_protein_g": 18,
  "estimated_carbohydrates_g": 45,
  "estimated_fat_g": 12,
  "confidence": "high" | "moderate" | "low",
  "estimation_disclaimer": "Nutritional figures are visual estimates. Actual calories and macros vary based on preparation."
}`;
            const userNote = userContext?.userDescription
                ? `\nAdditional user notes about ingredients/portion: "${userContext.userDescription}"`
                : '';
            const mealTypeNote = userContext?.mealType ? `\nMeal category: ${userContext.mealType}` : '';
            const response = await this.client.models.generateContent({
                model: config.gemini.model,
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: systemPrompt + userNote + mealTypeNote },
                            {
                                inlineData: {
                                    data: base64Data,
                                    mimeType: mimeType || 'image/jpeg',
                                },
                            },
                        ],
                    },
                ],
            });
            const responseText = response.text || '';
            // Clean possible Markdown JSON code fences
            const cleanJson = responseText
                .replace(/^```json\s*/i, '')
                .replace(/^```\s*/i, '')
                .replace(/\s*```$/, '')
                .trim();
            const parsed = JSON.parse(cleanJson);
            return FoodAnalysisResultSchema.parse({
                ...parsed,
                is_mock: false,
                ai_model: config.gemini.model,
            });
        }
        catch (error) {
            console.warn('⚠️ Gemini Vision API call encountered an error, falling back to safe estimate:', error.message);
            // In case of quota or model timeout, fallback gracefully to mock with clear notation
            const fallback = this.generateMockAnalysis(userContext);
            fallback.estimation_disclaimer = `Visual analysis fallback (Error: ${error.message?.slice(0, 80)}...). All values are estimates.`;
            return fallback;
        }
    }
    generateMockAnalysis(userContext) {
        const desc = userContext?.userDescription?.toLowerCase() || '';
        const meal = userContext?.mealType || 'Meal';
        let foodName = 'Nourishing Balanced Plate';
        let calories = 420;
        let protein = 22;
        let carbs = 48;
        let fat = 14;
        let ingredients = ['Whole grains', 'Lean protein', 'Mixed garden vegetables', 'Olive oil dressing'];
        if (desc.includes('salad') || desc.includes('veggie')) {
            foodName = 'Fresh Mediterranean Salad Bowl';
            calories = 310;
            protein = 12;
            carbs = 28;
            fat = 16;
            ingredients = ['Mixed greens', 'Cherry tomatoes', 'Cucumbers', 'Feta cheese', 'Extra virgin olive oil'];
        }
        else if (desc.includes('rice') || desc.includes('chicken') || desc.includes('curry')) {
            foodName = 'Steamed Jasmine Rice with Protein & Veggies';
            calories = 490;
            protein = 32;
            carbs = 58;
            fat = 12;
            ingredients = ['Jasmine rice', 'Grilled breast/tofu', 'Steamed broccoli', 'Light seasoning'];
        }
        else if (desc.includes('egg') || desc.includes('toast') || meal === 'breakfast') {
            foodName = 'Avocado Toast with Poached Eggs';
            calories = 380;
            protein = 16;
            carbs = 34;
            fat = 18;
            ingredients = ['Artisan sourdough', 'Fresh ripe avocado', 'Poached organic eggs', 'Microgreens'];
        }
        return {
            food_name: foodName,
            ingredients,
            portion_description: 'Standard 1 serving (~300g)',
            portion_grams: 300,
            estimated_calories_kcal: calories,
            estimated_protein_g: protein,
            estimated_carbohydrates_g: carbs,
            estimated_fat_g: fat,
            confidence: 'moderate',
            estimation_disclaimer: 'Development Simulation: Values are illustrative estimates. Set GEMINI_API_KEY in server/.env for live Google Gemini Vision analysis.',
            is_mock: true,
            ai_model: 'gemini-mock-development',
        };
    }
}
export const geminiVisionService = new GeminiVisionService();
