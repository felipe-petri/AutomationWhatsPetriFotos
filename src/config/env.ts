import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  DB_CLIENT: z.string().default('mysql2'),
  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string().default('root'),
  DB_PASSWORD: z.string().default('root'),
  DB_NAME: z.string().default('automation_whats_petri'),

  DATABASE_URL: z.string().optional().default(''),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional().default(''),

  EVOLUTION_API_URL: z.string().default('http://localhost:8080'),
  EVOLUTION_API_KEY: z.string().default('default_evolution_key'),
  EVOLUTION_INSTANCE_NAME: z.string().default('petri_fotos'),

  WEBHOOK_SECRET: z.string().default('webhook_secret')
})

const _env = envSchema.safeParse(process.env)

if (!_env.success) {
  console.error('❌ Configuração inválida de variáveis de ambiente:', _env.error.format())
  throw new Error('Variáveis de ambiente inválidas.')
}

export const env = _env.data
