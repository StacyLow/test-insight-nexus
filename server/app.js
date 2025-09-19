import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import testResultsRouter from './routes/test-results.js';
import { databaseService } from './config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5010',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/test-results', testResultsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// DB health check
app.get('/api/health/db', async (req, res) => {
  try {
    if (!databaseService.isConnected) {
      await databaseService.connect();
    }
    const db = databaseService.getDb();
    await db.command({ ping: 1 });
    res.json({ status: 'OK', mongo: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', mongo: 'disconnected', error: error.message });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});