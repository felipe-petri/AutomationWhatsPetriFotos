import { describe, it, expect, vi, beforeEach } from 'vitest'
import { processConversationMessage } from '../../src/core/fsm/conversation-worker.js'
import { fsmRouter } from '../../src/core/fsm/fsm.router.js'
import { evolutionClient } from '../../src/shared/clients/evolution.client.js'
import { sessionRepository } from '../../src/modules/sessions/session.repository.js'
import { dbPool } from '../../src/shared/database/connection.js'

describe('Conversation Worker Services Link Dispatch (UC-02)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(dbPool, 'query').mockResolvedValue([{ affectedRows: 1 }] as any)
    vi.spyOn(sessionRepository, 'findByRemoteJid').mockResolvedValue({
      remoteJid: '5511999990001@s.whatsapp.net',
      senderName: 'Cliente Teste',
      currentState: 'CATALOGS_MENU',
      contextData: {},
      errorCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    vi.spyOn(sessionRepository, 'update').mockResolvedValue({} as any)
  })

  it('deve disparar mensagem de texto humanizada contendo o link do site da Petri Fotos', async () => {
    vi.spyOn(fsmRouter, 'execute').mockResolvedValue({
      nextState: 'IDLE',
      updatedContext: {
        lastServiceId: 'gestante',
        lastServiceTitle: 'Ensaio Gestante',
        lastServiceUrl: 'https://petrifotos.com.br/gestante'
      },
      replyMessage:
        'Que notícia maravilhosa! 💛 Dá uma olhadinha em tudo o que preparamos para o Ensaio Gestante:\n🔗 https://petrifotos.com.br/gestante'
    })

    const sendTextSpy = vi
      .spyOn(evolutionClient, 'sendTextMessage')
      .mockResolvedValue({ status: 'sent' })

    await processConversationMessage({
      messageId: 'msg-service-link-123',
      remoteJid: '5511999990001@s.whatsapp.net',
      senderName: 'Cliente Teste',
      textInput: '1',
      timestamp: Date.now()
    })

    expect(sendTextSpy).toHaveBeenCalledTimes(1)
    expect(sendTextSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        remoteJid: '5511999990001@s.whatsapp.net',
        text: expect.stringContaining('https://petrifotos.com.br/gestante')
      })
    )
  })
})
