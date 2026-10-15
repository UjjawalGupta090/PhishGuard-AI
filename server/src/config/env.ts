import { config } from 'dotenv';
import { resolve } from 'path';
import { z } from 'zod';

// Load .env from root or server directory
config({ path: resolve(process.cwd(), '../.env') });
config({ path: resolve(process.cwd(), '.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(5001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/phishing_awareness'),
  HISTORY_TTL_DAYS: z.coerce.number().default(30),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-flash-latest'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  JWT_ACCESS_SECRET: z.string().min(16).default('dev_jwt_access_secret_change_in_production_min_32_chars'),
  JWT_REFRESH_SECRET: z.string().min(16).default('dev_jwt_refresh_secret_change_in_production_min_32_chars'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables configuration:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
