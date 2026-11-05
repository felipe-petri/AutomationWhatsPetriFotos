import { describe, expect, it } from 'vitest'
import { buildApp } from '../../src/app.js'

describe('Admin API Real MariaDB Live Endpoints', () => {
  const app = buildApp()

  it('GET /api/admin/sessions deve responder 200 sem erro 500 no MariaDB', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/sessions'
    })

    expect(res.statusCode).toBe(200)
    const json = JSON.parse(res.body)
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data.items)).toBe(true)
    expect(typeof json.data.total).toBe('number')
  })

  it('GET /api/admin/stats deve responder 200 com métricas reais', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/stats'
    })

    expect(res.statusCode).toBe(200)
    const json = JSON.parse(res.body)
    expect(json.success).toBe(true)
    expect(typeof json.data.totalSessions).toBe('number')
    expect(typeof json.data.humanSessions).toBe('number')
    expect(typeof json.data.botSessions).toBe('number')
    expect(typeof json.data.pendingRequests).toBe('number')
  })

  it('GET /api/admin/requests deve responder 200 com as filas de solicitações', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/requests'
    })

    expect(res.statusCode).toBe(200)
    const json = JSON.parse(res.body)
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data.personalPrints)).toBe(true)
    expect(Array.isArray(json.data.alboom)).toBe(true)
    expect(Array.isArray(json.data.sacramental)).toBe(true)
  })
})
