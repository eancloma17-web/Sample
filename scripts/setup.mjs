// Creates local configuration without replacing existing project settings.
import { copyFileSync, existsSync } from 'node:fs';
if (!existsSync('.env.local')) {
  copyFileSync('.env.example', '.env.local');
  console.log('Created .env.local. Add your new Supabase URL and publishable key.');
} else {
  console.log('Kept existing .env.local.');
}
console.log('Next: npm run check, then npm run dev.');
