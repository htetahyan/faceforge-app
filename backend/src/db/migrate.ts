import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './client.ts';

async function runMigrations() {
  console.log('🔄 Programmatic Migration: Applying Drizzle SQL migrations...');

  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✅ Programmatic Migration: Successfully applied all migrations!');
  } catch (err) {
    console.error('❌ Programmatic Migration: Migration failed!', err);
    process.exit(1);
  } finally {
    // End pg connection pool so script closes immediately
    await pool.end();
  }
}

// Execute migration
runMigrations();
export default runMigrations;
