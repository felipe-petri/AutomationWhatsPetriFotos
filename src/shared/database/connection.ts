import mysql, { Pool, PoolOptions } from 'mysql2/promise'
import { env } from '../../config/env.js'

export const poolOptions: PoolOptions = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  typeCast: (field: any, next: any) => {
    if (
      field.type === 'JSON' ||
      field.name === 'context_data' ||
      field.name === 'order_metadata' ||
      field.name === 'items'
    ) {
      const val = field.string()
      if (val === null || val === undefined) return null
      try {
        return JSON.parse(val)
      } catch {
        return val
      }
    }
    return next()
  }
}

export const dbPool: Pool = mysql.createPool(poolOptions)

export function parseJsonField<T = Record<string, unknown>>(val: any, fallback: T = {} as T): T {
  if (val === null || val === undefined) return fallback
  if (typeof val === 'object') return val as T
  if (typeof val === 'string') {
    try {
      return JSON.parse(val) as T
    } catch {
      return fallback
    }
  }
  return fallback
}

export function stringifyJsonField(val: any): string {
  if (val === null || val === undefined) return '{}'
  if (typeof val === 'string') return val
  return JSON.stringify(val)
}
