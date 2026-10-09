import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { reminderScheduler } from './services/scheduler.js';

import profileRouter from './routes/profile.js';
import tasksRouter from './routes/tasks.js';
import completionsRouter from './routes/completions.js';
import waterRouter from './routes/water.js';
import mealsRouter from './routes/meals.js';
import foodAnalysisRouter from './routes/foodAnalysis.js';
import notificationsRouter from './routes/notifications.js';
import historyRouter from './routes/history.js';

export const app = express();

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost and specified frontend
      if (!origin || origin.includes('localhost') || origin === config.allowedOrigin) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for local dev & testing
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'LifeCare AI API Engine',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    aiModel: config.gemini.model,
  });
});

// Mount Routes
app.use('/api/profile', profileRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api', completionsRouter); // handles /api/tasks/:id/completions and /api/completions
app.use('/api/water', waterRouter);
app.use('/api/meals', mealsRouter);
app.use('/api/food', foodAnalysisRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/history', historyRouter);

// Global Error Handler
app.use(errorHandler);

// Start Server if directly executed
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`\n======================================================`);
    console.log(`🌿 LifeCare AI Server running on http://localhost:${config.port}`);
    console.log(`📊 Mode: ${config.nodeEnv}`);
    console.log(`🤖 AI Vision Model: ${config.gemini.model}`);
    console.log(`======================================================\n`);

    // Start background reminder scheduler
    reminderScheduler.start();
  });
}
