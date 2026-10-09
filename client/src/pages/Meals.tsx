import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useNotification } from '../context/NotificationContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import {
  Utensils,
  Plus,
  Trash2,
  ScanLine,
  Clock,
  Flame,
  Calendar,
  Sparkles,
} from 'lucide-react';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'custom'] as const;

export const Meals: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [mealType, setMealType] = useState<string>('lunch');
  const [foodName, setFoodName] = useState('');
  const [portionDesc, setPortionDesc] = useState('1 plate');
  const [portionGrams, setPortionGrams] = useState<number | ''>(250);
  const [caloriesKcal, setCaloriesKcal] = useState<number | ''>(400);
  const [proteinG, setProteinG] = useState<number | ''>(20);
  const [carbsG, setCarbsG] = useState<number | ''>(50);
  const [fatG, setFatG] = useState<number | ''>(12);

  const today = new Date().toISOString().substring(0, 10);

  const loadMeals = async () => {
    try {
      const res = await api.getMeals(today);
      setMeals(res.meals || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load meals', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeals();
  }, []);

  const resetForm = () => {
    setMealType('lunch');
    setFoodName('');
    setPortionDesc('1 serving');
    setPortionGrams(250);
    setCaloriesKcal(400);
    setProteinG(20);
    setCarbsG(50);
    setFatG(12);
  };

  const handleCreateMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim()) {
      showToast('Please enter a food or dish name', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        meal_type: mealType,
        food_name: foodName.trim(),
        portion_description: portionDesc.trim() || undefined,
        portion_grams: portionGrams !== '' ? Number(portionGrams) : undefined,
        estimated_calories_kcal: caloriesKcal !== '' ? Number(caloriesKcal) : undefined,
        estimated_protein_g: proteinG !== '' ? Number(proteinG) : undefined,
        estimated_carbohydrates_g: carbsG !== '' ? Number(carbsG) : undefined,
        estimated_fat_g: fatG !== '' ? Number(fatG) : undefined,
        local_date: today,
      };

      const res = await api.createMeal(payload);
      setMeals((prev) => [...prev, res.meal]);
      setIsModalOpen(false);
      resetForm();
      showToast('Meal logged to your nutrition journal!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to log meal', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMeal = async (id: string) => {
    try {
      await api.deleteMeal(id);
      setMeals((prev) => prev.filter((m) => m.id !== id));
      showToast('Meal entry deleted', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete meal', 'error');
    }
  };

  const totalCalories = meals.reduce(
    (sum, m) => sum + (Number(m.estimated_calories_kcal) || 0),
    0
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <Utensils className="w-3.5 h-3.5" />
            <span>Nourishment & Meal Logging</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Meal Tracking
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Log meals manually or scan photos for instant AI nutrition estimates.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/food-scanner')}
            leftIcon={<ScanLine className="w-4 h-4 text-emerald-500" />}
          >
            AI Photo Scanner
          </Button>
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Log Meal Manually
          </Button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Total Logged</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">{meals.length} meals</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Approx. Calories</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">{Math.round(totalCalories)} kcal</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 sm:col-span-2">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center font-bold shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Mindful Reminder</span>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Calorie counts are approximations for tracking guidance, not rigid limits or moral scores.
            </p>
          </div>
        </Card>
      </div>

      {/* Meals List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Today's Recorded Meals
        </h2>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ) : meals.length === 0 ? (
          <EmptyState
            icon={<Utensils className="w-8 h-8 text-emerald-500" />}
            title="No meals logged today yet"
            description="Snap a picture with the AI food scanner or enter your dish manually."
            actionText="Log A Meal"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {meals.map((meal) => {
              const time = new Date(meal.logged_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <Card key={meal.id} className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="green" size="sm">
                          {meal.meal_type}
                        </Badge>
                        <span className="text-xs text-slate-400">{time}</span>
                      </div>

                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        {meal.food_name}
                      </h3>

                      {meal.portion_description && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Portion: {meal.portion_description} {meal.portion_grams ? `(~${meal.portion_grams}g)` : ''}
                        </p>
                      )}

                      {/* Nutrition Tags */}
                      <div className="flex items-center gap-3 mt-3 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
                        {meal.estimated_calories_kcal && (
                          <span className="font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 px-2.5 py-1 rounded-lg border border-brand-200/40">
                            🔥 ~{meal.estimated_calories_kcal} kcal
                          </span>
                        )}
                        {meal.estimated_protein_g !== undefined && (
                          <span>🥩 {meal.estimated_protein_g}g Protein</span>
                        )}
                        {meal.estimated_carbohydrates_g !== undefined && (
                          <span>🌾 {meal.estimated_carbohydrates_g}g Carbs</span>
                        )}
                        {meal.estimated_fat_g !== undefined && (
                          <span>🥑 {meal.estimated_fat_g}g Fat</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteMeal(meal.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 self-end sm:self-center transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Meal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Meal Manually"
        description="Enter dish information and approximate nutrition details."
      >
        <form onSubmit={handleCreateMeal} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Meal Category
              </label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-500 capitalize"
              >
                {MEAL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Food / Dish Name *
              </label>
              <input
                type="text"
                required
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                placeholder="e.g. Avocado Toast"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Portion Size
              </label>
              <input
                type="text"
                value={portionDesc}
                onChange={(e) => setPortionDesc(e.target.value)}
                placeholder="1 bowl, 2 slices"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Approx. Weight (g)
              </label>
              <input
                type="number"
                value={portionGrams}
                onChange={(e) => setPortionGrams(e.target.value ? parseInt(e.target.value, 10) : '')}
                placeholder="250"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Calories
              </label>
              <input
                type="number"
                value={caloriesKcal}
                onChange={(e) => setCaloriesKcal(e.target.value ? parseInt(e.target.value, 10) : '')}
                placeholder="kcal"
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Protein (g)
              </label>
              <input
                type="number"
                value={proteinG}
                onChange={(e) => setProteinG(e.target.value ? parseInt(e.target.value, 10) : '')}
                placeholder="g"
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Carbs (g)
              </label>
              <input
                type="number"
                value={carbsG}
                onChange={(e) => setCarbsG(e.target.value ? parseInt(e.target.value, 10) : '')}
                placeholder="g"
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Fat (g)
              </label>
              <input
                type="number"
                value={fatG}
                onChange={(e) => setFatG(e.target.value ? parseInt(e.target.value, 10) : '')}
                placeholder="g"
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Save to Journal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
