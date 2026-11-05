import { describe, expect, it, vi, beforeEach } from 'vitest'
import { buildApp } from '../../src/app.js'
import { sessionRepository } from '../../src/modules/sessions/session.repository.js'
import { PromptEngine } from '../../src/core/prompts/prompt.engine.js'

describe('Admin API & Dashboard Integration Routes', () => {
  const app = buildApp()

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('GET /admin deve redirecionar para /admin/', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/admin'
    })
    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe('/admin/')
  })

  it('GET /admin/ deve servir o dashboard HTML estático', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/admin/'
    })
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('text/html')
    expect(res.body).toContain('Petri Fotos')
    expect(res.body).toContain('Dashboard Administrativo')
  })

  it('GET /api/admin/messages deve retornar o JSON atual de mensagens', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/messages'
    })

    expect(res.statusCode).toBe(200)
    const json = JSON.parse(res.body)
    expect(json.success).toBe(true)
    expect(json.data.main_menu).toBeDefined()
    expect(json.data.document_photos.price).toBe(30)
    expect(json.data.alboom.production_days_sla).toBe(10)
  })

  it('PUT /api/admin/messages deve atualizar com sucesso e rejeitar payload inválido', async () => {
    // 1. Rejeição de payload inválido
    const invalidRes = await app.inject({
      method: 'PUT',
      url: '/api/admin/messages',
      payload: {
        document_photos: { price: -10 }
      }
    })
    expect(invalidRes.statusCode).toBe(400)
    const invalidJson = JSON.parse(invalidRes.body)
    expect(invalidJson.success).toBe(false)
    expect(invalidJson.error).toBe('ValidationError')

    // 2. Atualização válida em tempo de execução
    const originalMessages = PromptEngine.getAll()
    const updatedPayload = {
      ...originalMessages,
      main_menu: {
        ...originalMessages.main_menu,
        welcome: 'Mensagem de teste Fastify Admin Atualizada!'
      }
    }

    vi.spyOn(PromptEngine, 'save').mockImplementation(async (msgs: any) => {
      PromptEngine.reload(msgs)
    })

    const validRes = await app.inject({
      method: 'PUT',
      url: '/api/admin/messages',
      payload: updatedPayload
    })

    expect(validRes.statusCode).toBe(200)
    const validJson = JSON.parse(validRes.body)
    expect(validJson.success).toBe(true)
    expect(PromptEngine.get('main_menu.welcome')).toBe('Mensagem de teste Fastify Admin Atualizada!')

    // Restaura
    PromptEngine.reload(originalMessages)
  })

  it('GET /api/admin/sessions deve retornar lista paginada de sessões', async () => {
    const fakeSessionsResult = {
      items: [
        {
          remoteJid: '5511999991111@s.whatsapp.net',
          senderName: 'Maria Silva',
          currentState: 'IDLE' as const,
          contextData: {},
          errorCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1
    }

    vi.spyOn(sessionRepository, 'list').mockResolvedValue(fakeSessionsResult)

    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/sessions?page=1&limit=20'
    })

    expect(res.statusCode).toBe(200)
    const json = JSON.parse(res.body)
    expect(json.success).toBe(true)
    expect(json.data.items).toHaveLength(1)
    expect(json.data.items[0].senderName).toBe('Maria Silva')
  })

  it('PATCH /api/admin/sessions/:remoteJid/toggle-human deve alternar o status', async () => {
    const updatedSession = {
      remoteJid: '5511999991111@s.whatsapp.net',
      senderName: 'Maria Silva',
      currentState: 'HUMAN_ATTENDANCE' as const,
      contextData: {},
      errorCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    vi.spyOn(sessionRepository, 'toggleHumanAttendance').mockResolvedValue(updatedSession)

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/admin/sessions/5511999991111@s.whatsapp.net/toggle-human',
      payload: { targetState: 'HUMAN_ATTENDANCE' }
    })

    expect(res.statusCode).toBe(200)
    const json = JSON.parse(res.body)
    expect(json.success).toBe(true)
    expect(json.data.currentState).toBe('HUMAN_ATTENDANCE')
    expect(json.message).toContain('transbordo humano')
  })

  it('GET /api/admin/stats deve retornar métricas operacionais', async () => {
    vi.spyOn(sessionRepository, 'getStats').mockResolvedValue({
      totalSessions: 42,
      botSessions: 38,
      humanSessions: 4,
      pendingRequests: 5
    })

    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/stats'
    })

    expect(res.statusCode).toBe(200)
    const json = JSON.parse(res.body)
    expect(json.success).toBe(true)
    expect(json.data.totalSessions).toBe(42)
    expect(json.data.humanSessions).toBe(4)
  })

  it('GET /api/admin/requests deve retornar a fila de pedidos e solicitações', async () => {
    vi.spyOn(sessionRepository, 'listRequests').mockResolvedValue({
      personalPrints: [
        {
          remoteJid: '5511999991111@s.whatsapp.net',
          senderName: 'João Santos',
          photoCount: 15,
          photoSize: '10x15',
          totalAmount: 45.0,
          pixStatus: 'PENDING_PIX',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      alboom: [
        {
          remoteJid: '5511988882222@s.whatsapp.net',
          senderName: 'Carla Dias',
          type: 'CONFIRM_SELECTION',
          clientData: 'Carla Dias - Ensaio Gestante',
          status: 'SELECTION_CONFIRMED',
          createdAt: new Date(),
          updatedAt: new Date(),
          businessDaysPassed: 3,
          businessDaysRemaining: 7,
          slaDays: 10,
          isOverdue: false
        }
      ],
      sacramental: [
        {
          remoteJid: '5511977773333@s.whatsapp.net',
          senderName: 'Lucas Lima',
          details: 'Pedro Lima, Paróquia São José, 2024',
          status: 'PENDING_RETRIEVAL',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    })

    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/requests'
    })

    expect(res.statusCode).toBe(200)
    const json = JSON.parse(res.body)
    expect(json.success).toBe(true)
    expect(json.data.personalPrints).toHaveLength(1)
    expect(json.data.alboom).toHaveLength(1)
    expect(json.data.alboom[0].businessDaysRemaining).toBe(7)
    expect(json.data.sacramental).toHaveLength(1)
  })
})
