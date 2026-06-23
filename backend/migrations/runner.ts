import fs from 'fs';
import path from 'path';
import { db } from '../src/config/database';

async function run() {
  await db.query(`CREATE TABLE IF NOT EXISTS migrations (id SERIAL PRIMARY KEY, name VARCHAR(255) UNIQUE NOT NULL, run_at TIMESTAMPTZ DEFAULT NOW())`);
  const dir = path.join(__dirname);
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    const { rows } = await db.query('SELECT 1 FROM migrations WHERE name = $1', [file]);
    if (rows.length > 0) { console.log(`[skip] ${file}`); continue; }
    const sql = fs.readFileSync(path.join(dir, file), 'utf-8');
    await db.query(sql);
    await db.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
    console.log(`[done] ${file}`);
  }
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
