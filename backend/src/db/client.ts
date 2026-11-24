import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.ts';

let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is missing from .env!');
}

// Automatically resolve Docker container db host to localhost when running CLI scripts on host machine
if (connectionString.includes('@db:5432') && !process.env.IS_DOCKER) {
  connectionString = connectionString.replace('@db:5432', '@127.0.0.1:5435');
} else if (connectionString.includes('@db:') && !process.env.IS_DOCKER) {
  connectionString = connectionString.replace('@db:', '@127.0.0.1:5435');
}

// Create a connection pool with retry mechanism
export const pool = new pg.Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize Drizzle ORM
export const db = drizzle(pool, { schema });
