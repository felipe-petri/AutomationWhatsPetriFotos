import { describe, expect, it } from 'vitest'
import { buildApp } from '../../src/app.js'
import { baileysService } from '../../src/shared/clients/baileys.service.js'

describe('Embedded Baileys WhatsApp Routes', () => {
  const app = buildApp()

  it('GET /api/admin/whatsapp/status deve retornar status da conexão', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/whatsapp/status'
    })

    expect(res.statusCode).toBe(200)
    const json = JSON.parse(res.body)
    expect(json.success).toBe(true)
    expect(['CONNECTED', 'CONNECTING', 'DISCONNECTED']).toContain(json.status)
  })

  it('GET /api/admin/whatsapp/qr deve retornar estrutura de QR code', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/whatsapp/qr'
    })

    expect(res.statusCode).toBe(200)
    const json = JSON.parse(res.body)
    expect(json.success).toBe(true)
    expect(['CONNECTED', 'CONNECTING', 'DISCONNECTED']).toContain(json.status)
  })

  it('POST /api/admin/whatsapp/restart deve reiniciar serviço do Baileys', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/whatsapp/restart'
    })

    expect(res.statusCode).toBe(200)
    const json = JSON.parse(res.body)
    expect(json.success).toBe(true)
  })

  it('POST /api/admin/whatsapp/disconnect deve desconectar sessão', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/whatsapp/disconnect'
    })

    expect(res.statusCode).toBe(200)
    const json = JSON.parse(res.body)
    expect(json.success).toBe(true)
    expect(baileysService.getStatus()).toBe('DISCONNECTED')
  })
})
