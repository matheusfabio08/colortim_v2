import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { db } from '../src/config/database';

async function runMigrations() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id       SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      run_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const migrationsDir = join(__dirname);
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const { rows } = await db.query('SELECT id FROM migrations WHERE filename = $1', [file]);
    if (rows.length > 0) {
      console.log(`\u23ed\ufe0f  Skipping (already run): ${file}`);
      continue;
    }
    const sql = readFileSync(join(migrationsDir, file), 'utf8');
    console.log(`\u25b6\ufe0f  Running migration: ${file}`);
    await db.transaction(async (client) => {
      await client.query(sql);
      await client.query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
    });
    console.log(`\u2705 Migration complete: ${file}`);
  }

  console.log('\uD83C\uDF89 All migrations complete');
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error('\u274c Migration failed:', err);
  process.exit(1);
});
