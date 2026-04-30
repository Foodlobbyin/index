import { Pool, PoolConfig } from 'pg';

// Detect if SSL should be used. Required for managed Postgres (Neon, Supabase, etc).
// Enabled when PGSSLMODE=require, NODE_ENV=production, or DB_SSL=true is set.
const sslEnabled =
  process.env.PGSSLMODE === 'require' ||
  process.env.DB_SSL === 'true' ||
  process.env.NODE_ENV === 'production';

const poolConfig: PoolConfig = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'foodlobbyin',
};

if (sslEnabled) {
  // rejectUnauthorized=false works with Neon's standard cert chain.
  poolConfig.ssl = { rejectUnauthorized: false };
}

// Create PostgreSQL connection pool
export const pool = new Pool(poolConfig);

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;
