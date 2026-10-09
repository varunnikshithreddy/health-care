import { supabase, isConfiguredSupabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function getAuthToken(): Promise<string> {
  if (isConfiguredSupabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return session.access_token;
    }
  }
  // Check localStorage for demo token or active guest session
  const storedToken = localStorage.getItem('lifecare_auth_token');
  return storedToken || 'mock-user-token';
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Authorization') && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Set Content-Type only if not sending FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMsg = isJson && data.message ? data.message : `Request failed with status ${response.status}`;
    throw new ApiError(errorMsg, response.status, data);
  }

  return data as T;
}

export const api = {
  // Profile
  getProfile: () => apiRequest('/profile'),
  updateProfile: (data: any) =>
    apiRequest('/profile', { method: 'PATCH', body: JSON.stringify(data) }),

  // Tasks
  getTasks: () => apiRequest('/tasks'),
  createTask: (data: any) =>
    apiRequest('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: string, data: any) =>
    apiRequest(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTask: (id: string) =>
    apiRequest(`/tasks/${id}`, { method: 'DELETE' }),
  seedDefaultRoutine: (timezone?: string) =>
    apiRequest('/tasks/seed-defaults', { method: 'POST', body: JSON.stringify({ timezone }) }),

  // Completions
  getCompletions: (date?: string) =>
    apiRequest(`/completions${date ? `?date=${date}` : ''}`),
  completeTask: (id: string, data: { occurrence_date: string; status?: string; notes?: string }) =>
    apiRequest(`/tasks/${id}/completions`, { method: 'POST', body: JSON.stringify(data) }),
  revertCompletion: (id: string, date?: string) =>
    apiRequest(`/tasks/${id}/completions${date ? `?date=${date}` : ''}`, { method: 'DELETE' }),

  // Water
  getWaterGoal: () => apiRequest('/water/goal'),
  updateWaterGoal: (data: { daily_goal_ml: number; preferred_serving_ml: number }) =>
    apiRequest('/water/goal', { method: 'PUT', body: JSON.stringify(data) }),
  getWaterEntries: (date?: string) =>
    apiRequest(`/water/entries${date ? `?date=${date}` : ''}`),
  addWaterEntry: (data: { quantity_ml: number; local_date?: string; note?: string }) =>
    apiRequest('/water/entries', { method: 'POST', body: JSON.stringify(data) }),
  deleteWaterEntry: (id: string) =>
    apiRequest(`/water/entries/${id}`, { method: 'DELETE' }),

  // Meals
  getMeals: (date?: string) =>
    apiRequest(`/meals${date ? `?date=${date}` : ''}`),
  createMeal: (data: any) =>
    apiRequest('/meals', { method: 'POST', body: JSON.stringify(data) }),
  deleteMeal: (id: string) =>
    apiRequest(`/meals/${id}`, { method: 'DELETE' }),

  // Food Scanner
  analyzeFood: (formData: FormData) =>
    apiRequest('/food/analyze', { method: 'POST', body: formData }),
  confirmFood: (data: any) =>
    apiRequest('/food/confirm', { method: 'POST', body: JSON.stringify(data) }),

  // Notifications
  getNotificationSettings: () => apiRequest('/notifications/settings'),
  subscribePush: (data: { subscription: any; user_agent?: string }) =>
    apiRequest('/notifications/subscribe', { method: 'POST', body: JSON.stringify(data) }),
  unsubscribePush: (endpoint: string) =>
    apiRequest(`/notifications/subscribe?endpoint=${encodeURIComponent(endpoint)}`, {
      method: 'DELETE',
    }),
  sendTestPush: () =>
    apiRequest('/notifications/test', { method: 'POST' }),

  // History & Analytics
  getHistory: (days: number = 7) =>
    apiRequest(`/history?days=${days}`),
};
