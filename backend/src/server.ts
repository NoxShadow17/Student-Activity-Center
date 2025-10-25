import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Client } from 'pg';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Database connections
const pgClient = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'student_activity_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

const mongoURL = process.env.MongoDB_URL || 'mongodb://localhost:27017/student_portal';

// Connect to PostgreSQL
pgClient.connect()
  .then(() => console.log('📊 PostgreSQL connected'))
  .catch(err => console.error('❌ PostgreSQL connection error:', err));

// Connect to MongoDB
mongoose.connect(mongoURL)
  .then(() => console.log('🗄️  MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));
app.use(cors());
app.use(morgan('combined'));

// Middleware for parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads (10MB limit for Excel files)
import multer from 'multer';
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  dest: './uploads/' // Temporary storage for file uploads
});
// Note: Individual routes handle their own file filtering if needed

// Routes
const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter.default);

const activityRouter = require('./routes/activity');
app.use('/api/activities', activityRouter.default);

const portfolioRouter = require('./routes/portfolio');
app.use('/api/portfolio', portfolioRouter.default);

const analyticsRouter = require('./routes/analytics');
app.use('/api/analytics', analyticsRouter.default);

const profileRouter = require('./routes/profile');
app.use('/api/profile', profileRouter.default);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    databases: {
      postgresql: pgClient ? 'connected' : 'disconnected',
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
