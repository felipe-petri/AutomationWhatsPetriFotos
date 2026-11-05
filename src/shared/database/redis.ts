import { Redis } from 'ioredis'
import { env } from '../../config/env.js'

export const redisClient = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  lazyConnect: true,
  retryStrategy(times) {
    // Retry up to 3 times, then back off without flooding
    if (times > 3) return null
    return Math.min(times * 200, 1000)
  }
})

redisClient.on('error', (err) => {
  // Log silencioso para evitar crash quando Redis não estiver rodando localmente
  if (process.env.NODE_ENV !== 'test') {
    // Apenas log de nível debug/aviso
  }
})
