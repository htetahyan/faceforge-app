import 'dotenv/config';
import { db } from './client.ts';
import { templates, templateCategories } from './schema.ts';

async function seed() {
  console.log('🌱 Database Seed: Purging templates and categories...');
  try {
    await db.delete(templates);
    await db.delete(templateCategories);
    console.log('✅ Database Seed: Purged all templates and categories!');
  } catch (err) {
    console.error('[Seed] Database seeding failed:', err);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seed().then(() => process.exit(0));
}

export default seed;
