import { describe, it, expect, afterAll } from 'vitest'
import { sessionRepository } from '../../src/modules/sessions/session.repository.js'
import { ordersRepository } from '../../src/modules/orders/orders.repository.js'
import { dbPool } from '../../src/shared/database/connection.js'

describe('MariaDB Repositories Integration', () => {
  const testJid = '5511999998888@s.whatsapp.net'
  let createdOrderId: string

  afterAll(async () => {
    try {
      await dbPool.query('DELETE FROM sessions WHERE remote_jid = ?', [testJid])
      if (createdOrderId) {
        await dbPool.query('DELETE FROM photo_orders WHERE id = ?', [createdOrderId])
      }
    } catch {
      // Ignora falhas de cleanup
    }
  })

  it('deve criar e buscar uma sessão no MariaDB com context_data JSON', async () => {
    const session = await sessionRepository.create(testJid, 'Cliente MariaDB Teste')
    expect(session).toBeDefined()
    expect(session.remoteJid).toBe(testJid)
    expect(session.senderName).toBe('Cliente MariaDB Teste')
    expect(session.currentState).toBe('IDLE')
    expect(session.contextData).toEqual({})

    const found = await sessionRepository.findByRemoteJid(testJid)
    expect(found).not.toBeNull()
    expect(found?.remoteJid).toBe(testJid)
  })

  it('deve atualizar o estado e dados de contexto no MariaDB', async () => {
    const updated = await sessionRepository.update(testJid, {
      currentState: 'MAIN_MENU',
      contextData: {
        selectedMenu: 'PERSONAL_PRINTS',
        photoCount: 15,
        photoSize: '10x15',
        totalAmount: 45.00
      }
    })

    expect(updated).not.toBeNull()
    expect(updated?.currentState).toBe('MAIN_MENU')
    expect(updated?.contextData.selectedMenu).toBe('PERSONAL_PRINTS')
    expect(updated?.contextData.photoCount).toBe(15)
  })

  it('deve listar sessões com paginação e cálculo de estatísticas', async () => {
    const list = await sessionRepository.list({ page: 1, limit: 10 })
    expect(list.items.length).toBeGreaterThan(0)
    expect(list.total).toBeGreaterThan(0)

    const stats = await sessionRepository.getStats()
    expect(stats.totalSessions).toBeGreaterThan(0)
    expect(typeof stats.botSessions).toBe('number')
    expect(typeof stats.humanSessions).toBe('number')
  })

  it('deve listar solicitações pendentes (requests queue)', async () => {
    const requests = await sessionRepository.listRequests()
    expect(requests.personalPrints.length).toBeGreaterThan(0)
    const printItem = requests.personalPrints.find(p => p.remoteJid === testJid)
    expect(printItem).toBeDefined()
    expect(printItem?.photoCount).toBe(15)
  })

  it('deve alternar para atendimento humano e voltar', async () => {
    const toHuman = await sessionRepository.toggleHumanAttendance(testJid)
    expect(toHuman.currentState).toBe('HUMAN_ATTENDANCE')

    const toBot = await sessionRepository.toggleHumanAttendance(testJid)
    expect(toBot.currentState).toBe('IDLE')
  })

  it('deve criar e atualizar um pedido em photo_orders com UUID gerado', async () => {
    const order = await ordersRepository.create({
      remoteJid: testJid,
      orderType: 'PRINTS_10x15',
      totalAmount: 45.00,
      pixCode: '00020126580014BR.GOV.BCB.PIX...',
      paymentStatus: 'PENDING',
      orderMetadata: {
        photos: ['foto1.jpg', 'foto2.jpg'],
        notes: 'Papel fosco'
      }
    })

    expect(order).toBeDefined()
    expect(order.id).toBeDefined()
    expect(order.id.length).toBe(36) // UUID length
    createdOrderId = order.id

    const found = await ordersRepository.findById(order.id)
    expect(found).not.toBeNull()
    expect(found?.totalAmount).toBe(45.00)
    expect(found?.orderMetadata.notes).toBe('Papel fosco')

    const updated = await ordersRepository.updatePaymentStatus(order.id, 'PAID')
    expect(updated?.paymentStatus).toBe('PAID')
  })
})
