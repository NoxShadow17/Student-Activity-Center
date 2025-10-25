import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'student_activity_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  console.log('📊 PostgreSQL connected');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err.message);
});

// Create tables if they don't exist
const initializeDatabase = async () => {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'student',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Activities table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        date DATE NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        proof TEXT,
        verified_by INTEGER REFERENCES users(id),
        verified_at TIMESTAMP,
        qr_code_url TEXT,
        qr_generated_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add QR code columns to existing table if they don't exist
    try {
      await pool.query(`
        ALTER TABLE activities ADD COLUMN IF NOT EXISTS qr_code_url TEXT
      `);
      await pool.query(`
        ALTER TABLE activities ADD COLUMN IF NOT EXISTS qr_generated_at TIMESTAMP
      `);
    } catch (alterError: any) {
      console.log('QR columns may already exist:', alterError.message);
    }

    console.log('📋 Database tables initialized');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
};

initializeDatabase();

export { pool, initializeDatabase };
