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
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      return session.access_token;
    }
  }
  const storedToken = localStorage.getItem('lifecare_auth_token');
  return storedToken || 'mock-user-token';
}

// ============================================================================
// RESILIENT LOCAL FALLBACK STORE (Pre-loaded wellness starter routines)
// Prevents 404 errors when running on static hosts or offline
// ============================================================================
const STORAGE_KEYS = {
  TASKS: 'lifecare_tasks_v2',
  COMPLETIONS: 'lifecare_completions_v2',
  WATER_GOAL: 'lifecare_water_goal_v2',
  WATER_ENTRIES: 'lifecare_water_entries_v2',
  MEALS: 'lifecare_meals_v2',
  PROFILE: 'lifecare_profile_v2',
};

const STARTER_ROUTINES = [
  {
    id: 't-1',
    title: 'Morning Awakening & Breathing',
    description: 'Wake up gently, stretch, and take 5 deep breaths',
    category: 'Wake up',
    local_time: '07:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    recurrence_type: 'daily',
    recurrence_days: [0, 1, 2, 3, 4, 5, 6],
    duration_minutes: 15,
    reminder_enabled: true,
    notification_message: 'Good morning! Time to wake up and start your day.',
    completion_message: 'Wonderful start! You greeted the day with calm and clarity.',
    priority: 'high',
    enabled: true,
  },
  {
    id: 't-2',
    title: 'Morning Hydration',
    description: 'Drink a glass of warm water to hydrate',
    category: 'Drink water',
    local_time: '07:15',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    recurrence_type: 'daily',
    recurrence_days: [0, 1, 2, 3, 4, 5, 6],
    duration_minutes: 5,
    reminder_enabled: true,
    notification_message: 'LifeCare AI — Time for your morning hydration glass.',
    completion_message: 'Well done! Hydrating early powers your focus and energy.',
    priority: 'medium',
    enabled: true,
  },
  {
    id: 't-3',
    title: 'Nourishing Breakfast',
    description: 'Fuel your day with balanced nutrition',
    category: 'Breakfast',
    local_time: '08:30',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    recurrence_type: 'daily',
    recurrence_days: [0, 1, 2, 3, 4, 5, 6],
    duration_minutes: 30,
    reminder_enabled: true,
    notification_message: 'Breakfast reminder: Fuel your body for the day ahead.',
    completion_message: 'Great job fueling your morning with balanced nourishment!',
    priority: 'medium',
    enabled: true,
  },
  {
    id: 't-4',
    title: 'Midday Water Break',
    description: 'Pause and drink 250ml water',
    category: 'Drink water',
    local_time: '11:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    recurrence_type: 'daily',
    recurrence_days: [0, 1, 2, 3, 4, 5, 6],
    duration_minutes: 5,
    reminder_enabled: true,
    notification_message: 'Time for your midday hydration check-in!',
    completion_message: 'Excellent consistency! Your body thanks you.',
    priority: 'low',
    enabled: true,
  },
  {
    id: 't-5',
    title: 'Mindful Lunch',
    description: 'Take a step back from screens and enjoy lunch',
    category: 'Lunch',
    local_time: '13:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    recurrence_type: 'daily',
    recurrence_days: [0, 1, 2, 3, 4, 5, 6],
    duration_minutes: 45,
    reminder_enabled: true,
    notification_message: 'Lunch reminder: Take a restful pause and savor your meal.',
    completion_message: 'Delightful! You gave yourself a mindful lunch break.',
    priority: 'medium',
    enabled: true,
  },
  {
    id: 't-6',
    title: 'Afternoon Movement',
    description: 'Light stretching, walk, or workout session',
    category: 'Exercise',
    local_time: '16:30',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    recurrence_type: 'daily',
    recurrence_days: [0, 1, 2, 3, 4, 5, 6],
    duration_minutes: 30,
    reminder_enabled: true,
    notification_message: 'Time for a brief movement break. Release tension!',
    completion_message: 'Fantastic job moving your body! Every small movement counts.',
    priority: 'high',
    enabled: true,
  },
  {
    id: 't-7',
    title: 'Wholesome Dinner',
    description: 'Relax and savor dinner',
    category: 'Dinner',
    local_time: '19:30',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    recurrence_type: 'daily',
    recurrence_days: [0, 1, 2, 3, 4, 5, 6],
    duration_minutes: 40,
    reminder_enabled: true,
    notification_message: 'Dinner time! Savor your meal and wind down.',
    completion_message: 'Great job winding down your day with a satisfying meal.',
    priority: 'medium',
    enabled: true,
  },
  {
    id: 't-8',
    title: 'Evening Wind-Down & Sleep',
    description: 'Dim lights, disconnect from screens, and rest',
    category: 'Sleep',
    local_time: '22:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    recurrence_type: 'daily',
    recurrence_days: [0, 1, 2, 3, 4, 5, 6],
    duration_minutes: 30,
    reminder_enabled: true,
    notification_message: 'Time to prepare for restful sleep. Dim lights and relax.',
    completion_message: 'Peaceful rest ahead. You took great care of yourself today.',
    priority: 'high',
    enabled: true,
  },
];

function getStoredTasks(): any[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(STARTER_ROUTINES));
      return STARTER_ROUTINES;
    }
    return JSON.parse(raw);
  } catch {
    return STARTER_ROUTINES;
  }
}

function saveStoredTasks(tasks: any[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

function handleLocalFallback(endpoint: string, options: RequestInit = {}): any {
  const method = (options.method || 'GET').toUpperCase();
  const cleanEndpoint = endpoint.split('?')[0];
  const storedTasks = getStoredTasks();

  // /tasks
  if (cleanEndpoint === '/tasks') {
    if (method === 'GET') {
      return { tasks: storedTasks.sort((a, b) => a.local_time.localeCompare(b.local_time)) };
    }
    if (method === 'POST') {
      const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
      const newTask = {
        id: 'task-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        ...body,
        enabled: body.enabled !== false,
        created_at: new Date().toISOString(),
      };
      const updated = [...storedTasks, newTask].sort((a, b) =>
        a.local_time.localeCompare(b.local_time)
      );
      saveStoredTasks(updated);
      return { success: true, task: newTask };
    }
  }

  // /tasks/seed-defaults
  if (cleanEndpoint === '/tasks/seed-defaults' && method === 'POST') {
    saveStoredTasks(STARTER_ROUTINES);
    return { success: true, count: STARTER_ROUTINES.length };
  }

  // /tasks/:id
  const taskMatch = cleanEndpoint.match(/^\/tasks\/([^\/]+)$/);
  if (taskMatch) {
    const id = taskMatch[1];
    if (method === 'PATCH') {
      const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
      const updated = storedTasks.map((t) => (t.id === id ? { ...t, ...body } : t));
      saveStoredTasks(updated);
      const task = updated.find((t) => t.id === id);
      return { success: true, task };
    }
    if (method === 'DELETE') {
      const updated = storedTasks.filter((t) => t.id !== id);
      saveStoredTasks(updated);
      return { success: true };
    }
  }

  // /completions
  if (cleanEndpoint === '/completions' && method === 'GET') {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.COMPLETIONS);
      return { completions: raw ? JSON.parse(raw) : [] };
    } catch {
      return { completions: [] };
    }
  }

  // /tasks/:id/completions
  const compMatch = cleanEndpoint.match(/^\/tasks\/([^\/]+)\/completions$/);
  if (compMatch) {
    const taskId = compMatch[1];
    const task = storedTasks.find((t) => t.id === taskId);
    if (method === 'POST') {
      const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
      const newComp = {
        id: 'comp-' + Date.now(),
        task_id: taskId,
        occurrence_date: body.occurrence_date || new Date().toISOString().substring(0, 10),
        status: body.status || 'completed',
        completed_at: new Date().toISOString(),
        notes: body.notes || null,
      };
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.COMPLETIONS);
        const list = raw ? JSON.parse(raw) : [];
        const filtered = list.filter((c: any) => c.task_id !== taskId);
        filtered.push(newComp);
        localStorage.setItem(STORAGE_KEYS.COMPLETIONS, JSON.stringify(filtered));
      } catch {}
      return {
        success: true,
        completion: newComp,
        encouragement_message: task?.completion_message || 'Great job! Keep going.',
        task_title: task?.title || 'Activity',
      };
    }
    if (method === 'DELETE') {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.COMPLETIONS);
        const list = raw ? JSON.parse(raw) : [];
        const filtered = list.filter((c: any) => c.task_id !== taskId);
        localStorage.setItem(STORAGE_KEYS.COMPLETIONS, JSON.stringify(filtered));
      } catch {}
      return { success: true };
    }
  }

  // Default empty fallback for other endpoints
  return { success: true };
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

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If endpoint is not found (404) on static hosting like Vercel, seamlessly fallback to local store
    if (response.status === 404) {
      console.info(`API endpoint ${endpoint} returned 404. Falling back to local offline store.`);
      return handleLocalFallback(endpoint, options) as T;
    }

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMsg =
        isJson && data.message ? data.message : `Request failed with status ${response.status}`;
      throw new ApiError(errorMsg, response.status, data);
    }

    return data as T;
  } catch (err: any) {
    // If it's a network error or fetch failure, use local fallback
    if (err instanceof TypeError || (err.message && err.message.includes('fetch'))) {
      console.info(`Network unreachable for ${endpoint}. Using local offline store.`);
      return handleLocalFallback(endpoint, options) as T;
    }
    throw err;
  }
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
