import 'dotenv/config';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { db } from '../src/config/database';

async function runMigrations() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      run_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const migrationsDir = join(__dirname);
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const { rows } = await db.query('SELECT id FROM migrations WHERE filename = $1', [file]);
    if (rows.length > 0) { console.log(`⏭️  Skipping: ${file}`); continue; }
    const sql = readFileSync(join(migrationsDir, file), 'utf8');
    console.log(`▶️  Running: ${file}`);
    await db.transaction(async (client) => {
      await client.query(sql);
      await client.query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
    });
    console.log(`✅ Done: ${file}`);
  }
  console.log('🎉 All migrations complete');
  process.exit(0);
}

runMigrations().catch((err) => { console.error('❌ Migration failed:', err); process.exit(1); });
