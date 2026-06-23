import path from 'path';
import { execSync } from 'child_process';
import fs from 'fs';

const dir = path.join(__dirname);
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') && f !== 'runner.ts').sort();
for (const file of files) {
  console.log(`Running seed: ${file}`);
  execSync(`ts-node ${path.join(dir, file)}`, { stdio: 'inherit' });
}
