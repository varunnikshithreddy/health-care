import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useNotification } from '../context/NotificationContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  ScanLine,
  Upload,
  Camera,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Info,
  Edit3,
  X,
  ArrowRight,
} from 'lucide-react';

export const FoodScanner: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload & State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mealType, setMealType] = useState<string>('lunch');
  const [userDescription, setUserDescription] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  // Editable Review Form State
  const [editedFoodName, setEditedFoodName] = useState('');
  const [editedPortion, setEditedPortion] = useState('');
  const [editedGrams, setEditedGrams] = useState<number | ''>('');
  const [editedCalories, setEditedCalories] = useState<number | ''>('');
  const [editedProtein, setEditedProtein] = useState<number | ''>('');
  const [editedCarbs, setEditedCarbs] = useState<number | ''>('');
  const [editedFat, setEditedFat] = useState<number | ''>('');
  const [confirming, setConfirming] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        showToast('Please select a JPEG, PNG, or WEBP image file.', 'error');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showToast('Image size exceeds 10MB limit.', 'error');
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      setAnalysisResult(null);
    }
  };

  const handleStartAnalysis = async () => {
    if (!selectedFile) {
      showToast('Please upload or snap a photo first.', 'error');
      return;
    }

    setAnalyzing(true);
    const formData = new FormData();
    formData.append('photo', selectedFile);
    formData.append('meal_type', mealType);
    formData.append('description', userDescription);

    try {
      const res = await api.analyzeFood(formData);
      if (res.analysis) {
        setAnalysisResult(res.analysis);
        // Pre-fill editable fields
        setEditedFoodName(res.analysis.food_name || '');
        setEditedPortion(res.analysis.portion_description || '');
        setEditedGrams(res.analysis.portion_grams || '');
        setEditedCalories(res.analysis.estimated_calories_kcal || '');
        setEditedProtein(res.analysis.estimated_protein_g || '');
        setEditedCarbs(res.analysis.estimated_carbohydrates_g || '');
        setEditedFat(res.analysis.estimated_fat_g || '');
        showToast('Visual analysis complete! Review and adjust estimates below.', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Analysis failed. Please check connection.', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirmAndSave = async () => {
    if (!editedFoodName.trim()) {
      showToast('Food name cannot be empty', 'error');
      return;
    }

    setConfirming(true);
    try {
      const payload = {
        meal_type: mealType,
        food_name: editedFoodName.trim(),
        portion_description: editedPortion.trim() || undefined,
        portion_grams: editedGrams !== '' ? Number(editedGrams) : undefined,
        estimated_calories_kcal: Number(editedCalories) || 0,
        estimated_protein_g: Number(editedProtein) || 0,
        estimated_carbohydrates_g: Number(editedCarbs) || 0,
        estimated_fat_g: Number(editedFat) || 0,
        analysis_metadata: analysisResult,
        local_date: new Date().toISOString().substring(0, 10),
      };

      await api.confirmFood(payload);
      showToast('Confirmed! Saved to your nutrition journal.', 'success');
      navigate('/meals');
    } catch (err: any) {
      showToast(err.message || 'Failed to save confirmed meal', 'error');
    } finally {
      setConfirming(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setUserDescription('');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          <ScanLine className="w-3.5 h-3.5" />
          <span>AI Food Vision Analysis</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
          Food Photo Scanner
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Estimate calories and macronutrients from food photographs powered by Google Gemini Vision.
        </p>
      </div>

      {/* Upload & Analysis Journey */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Step 1: Upload Box */}
        <Card className="p-6 space-y-5">
          <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Camera className="w-4 h-4 text-brand-600" /> 1. Upload or Capture Meal
          </h2>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />

          {!imagePreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 rounded-3xl p-8 text-center cursor-pointer transition-all hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
            >
              <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-3 shadow-sm">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Click to upload photo or take picture
              </p>
              <p className="text-xs text-slate-400 mt-1">Supports JPEG, PNG, WEBP (Max 10MB)</p>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 group">
              <img
                src={imagePreview}
                alt="Meal to analyze"
                className="w-full h-64 object-cover object-center"
              />
              <button
                onClick={handleReset}
                className="absolute top-3 right-3 p-1.5 bg-slate-900/70 text-white rounded-full hover:bg-slate-900 transition-colors"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Meal Category
              </label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-500 capitalize"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Optional Ingredients or Context
              </label>
              <input
                type="text"
                value={userDescription}
                onChange={(e) => setUserDescription(e.target.value)}
                placeholder="e.g. olive oil dressing, sourdough bread, oat milk"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Adding details helps the AI account for hidden ingredients.
              </p>
            </div>
          </div>

          <Button
            onClick={handleStartAnalysis}
            disabled={!selectedFile || analyzing}
            isLoading={analyzing}
            className="w-full py-3"
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            {analyzing ? 'Analyzing Image...' : 'Run AI Nutrition Analysis'}
          </Button>
        </Card>

        {/* Step 2: Review & Edit Estimation */}
        <Card className="p-6 space-y-5">
          <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-brand-600" /> 2. Review, Correct & Confirm
          </h2>

          {!analysisResult ? (
            <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium">Estimated nutrition figures will appear here</p>
              <p className="text-xs text-slate-400 mt-1">
                Upload a photo on the left and run analysis.
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Disclaimer Banner */}
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Visual Approximation:</strong> {analysisResult.estimation_disclaimer}
                  {analysisResult.is_mock && (
                    <span className="block mt-1 font-semibold text-amber-700 dark:text-amber-400">
                      (Development Mode active. Configure GEMINI_API_KEY in server/.env for live inference)
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Detected Food Title
                </label>
                <input
                  type="text"
                  value={editedFoodName}
                  onChange={(e) => setEditedFoodName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Portion Serving
                  </label>
                  <input
                    type="text"
                    value={editedPortion}
                    onChange={(e) => setEditedPortion(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Est. Weight (g)
                  </label>
                  <input
                    type="number"
                    value={editedGrams}
                    onChange={(e) => setEditedGrams(e.target.value ? parseInt(e.target.value, 10) : '')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Nutrition Grid */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="p-2.5 rounded-xl bg-brand-50/60 dark:bg-brand-950/40 border border-brand-200/50 dark:border-brand-900/40 text-center">
                  <span className="text-[10px] font-bold text-brand-700 dark:text-brand-300 uppercase block mb-1">
                    Calories
                  </span>
                  <input
                    type="number"
                    value={editedCalories}
                    onChange={(e) => setEditedCalories(e.target.value ? parseInt(e.target.value, 10) : '')}
                    className="w-full text-center font-bold text-sm bg-transparent border-b border-brand-300 dark:border-brand-700 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">kcal</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Protein
                  </span>
                  <input
                    type="number"
                    value={editedProtein}
                    onChange={(e) => setEditedProtein(e.target.value ? parseInt(e.target.value, 10) : '')}
                    className="w-full text-center font-bold text-sm bg-transparent border-b border-slate-300 dark:border-slate-600 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">g</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Carbs
                  </span>
                  <input
                    type="number"
                    value={editedCarbs}
                    onChange={(e) => setEditedCarbs(e.target.value ? parseInt(e.target.value, 10) : '')}
                    className="w-full text-center font-bold text-sm bg-transparent border-b border-slate-300 dark:border-slate-600 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">g</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Fat
                  </span>
                  <input
                    type="number"
                    value={editedFat}
                    onChange={(e) => setEditedFat(e.target.value ? parseInt(e.target.value, 10) : '')}
                    className="w-full text-center font-bold text-sm bg-transparent border-b border-slate-300 dark:border-slate-600 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">g</span>
                </div>
              </div>

              {/* Detected Components */}
              {analysisResult.ingredients && analysisResult.ingredients.length > 0 && (
                <div className="text-xs text-slate-500">
                  <span className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                    Detected Components:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {analysisResult.ingredients.map((ing: string, i: number) => (
                      <Badge key={i} variant="slate" size="sm">
                        {ing}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handleConfirmAndSave}
                isLoading={confirming}
                className="w-full py-3"
                rightIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Confirm & Log to Journal
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
