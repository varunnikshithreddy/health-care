import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Running LifeCare AI Supabase migration from root...');
try {
  execSync('npm --prefix server run migrate', { stdio: 'inherit' });
} catch (e) {
  process.exit(1);
}
