import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
describe('LifeCare AI Backend API Test Suite', () => {
    const authHeader = { Authorization: 'Bearer mock-test-token-123' };
    it('1. Should return healthy status from /api/health', async () => {
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
        expect(res.body.service).toBe('LifeCare AI API Engine');
    });
    it('2. Should reject unauthenticated requests with 401', async () => {
        const res = await request(app).get('/api/profile');
        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Unauthorized');
    });
    it('3. Should fetch and update user profile', async () => {
        const getRes = await request(app)
            .get('/api/profile')
            .set(authHeader);
        expect(getRes.status).toBe(200);
        expect(getRes.body.profile).toBeDefined();
        const patchRes = await request(app)
            .patch('/api/profile')
            .set(authHeader)
            .send({
            display_name: 'Antigravity Tester',
            preferred_motivational_style: 'energetic',
        });
        expect(patchRes.status).toBe(200);
        expect(patchRes.body.profile.display_name).toBe('Antigravity Tester');
        expect(patchRes.body.profile.preferred_motivational_style).toBe('energetic');
    });
    it('4. Should create a custom scheduled task and verify recurrence', async () => {
        const newTask = {
            title: 'Hydration & Mindful Breath',
            category: 'Drink water',
            local_time: '10:30',
            recurrence_type: 'daily',
            recurrence_days: [0, 1, 2, 3, 4, 5, 6],
            notification_message: 'Time for your refreshing water break!',
            completion_message: 'Great job! Staying hydrated powers your day.',
            duration_minutes: 5,
            reminder_enabled: true,
            priority: 'medium',
        };
        const res = await request(app)
            .post('/api/tasks')
            .set(authHeader)
            .send(newTask);
        expect(res.status).toBe(201);
        expect(res.body.task.title).toBe(newTask.title);
        expect(res.body.task.local_time).toBe('10:30');
        expect(res.body.task.id).toBeDefined();
        const taskId = res.body.task.id;
        // Fetch tasks list
        const listRes = await request(app)
            .get('/api/tasks')
            .set(authHeader);
        expect(listRes.status).toBe(200);
        const found = listRes.body.tasks.find((t) => t.id === taskId);
        expect(found).toBeDefined();
    });
    it('5. Should complete a task and return user-configured encouragement message', async () => {
        // Create a task with a distinct custom encouragement message
        const customMessage = 'Consistency is key! Proud of you for staying on track.';
        const createRes = await request(app)
            .post('/api/tasks')
            .set(authHeader)
            .send({
            title: 'Afternoon Stretch',
            category: 'Exercise',
            local_time: '15:00',
            completion_message: customMessage,
        });
        const taskId = createRes.body.task.id;
        const today = new Date().toISOString().substring(0, 10);
        const completeRes = await request(app)
            .post(`/api/tasks/${taskId}/completions`)
            .set(authHeader)
            .send({
            occurrence_date: today,
            status: 'completed',
            notes: 'Felt relaxed and refreshed',
        });
        expect(completeRes.status).toBe(200);
        expect(completeRes.body.success).toBe(true);
        expect(completeRes.body.encouragement_message).toBe(customMessage);
        expect(completeRes.body.completion.status).toBe('completed');
    });
    it('6. Should record water intake and calculate progress towards daily goal', async () => {
        // Set daily goal to 2000 mL
        await request(app)
            .put('/api/water/goal')
            .set(authHeader)
            .send({ daily_goal_ml: 2000, preferred_serving_ml: 250 });
        const today = new Date().toISOString().substring(0, 10);
        // Add 250 mL
        const entryRes = await request(app)
            .post('/api/water/entries')
            .set(authHeader)
            .send({
            quantity_ml: 250,
            local_date: today,
            note: 'Morning water',
        });
        expect(entryRes.status).toBe(201);
        expect(entryRes.body.entry.quantity_ml).toBe(250);
        // Get today's total
        const getRes = await request(app)
            .get(`/api/water/entries?date=${today}`)
            .set(authHeader);
        expect(getRes.status).toBe(200);
        expect(getRes.body.total_ml).toBeGreaterThanOrEqual(250);
    });
    it('7. Should confirm and log meals with nutrition estimates', async () => {
        const today = new Date().toISOString().substring(0, 10);
        const mealPayload = {
            meal_type: 'lunch',
            food_name: 'Grilled Salmon with Quinoa & Steamed Asparagus',
            portion_description: '1 standard bowl',
            portion_grams: 350,
            estimated_calories_kcal: 480,
            estimated_protein_g: 38,
            estimated_carbohydrates_g: 42,
            estimated_fat_g: 16,
            local_date: today,
        };
        const confirmRes = await request(app)
            .post('/api/food/confirm')
            .set(authHeader)
            .send(mealPayload);
        expect(confirmRes.status).toBe(201);
        expect(confirmRes.body.meal.food_name).toBe(mealPayload.food_name);
        expect(confirmRes.body.meal.estimated_calories_kcal).toBe(480);
        // Fetch meals
        const mealsRes = await request(app)
            .get(`/api/meals?date=${today}`)
            .set(authHeader);
        expect(mealsRes.status).toBe(200);
        expect(mealsRes.body.meals.length).toBeGreaterThan(0);
    });
    it('8. Should return historical analytics data', async () => {
        const res = await request(app)
            .get('/api/history?days=7')
            .set(authHeader);
        expect(res.status).toBe(200);
        expect(res.body.analytics).toBeDefined();
        expect(res.body.analytics.length).toBe(7);
        expect(res.body.summary).toBeDefined();
    });
});
