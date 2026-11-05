import { describe, expect, it } from 'vitest'
import {
  updateMessagesSchema,
  listSessionsQuerySchema,
  toggleHumanParamsSchema,
  toggleHumanBodySchema
} from '../../src/modules/admin/admin.schema.js'

describe('Admin Zod Schemas', () => {
  const validMessagesPayload = {
    main_menu: {
      welcome: 'Olá, bem-vindo!'
    },
    document_photos: {
      price: 30,
      packages: {
        '3x4': 6,
        '3.5x4.5': 6,
        '5x5': 2,
        '5x7': 2
      },
      text: 'Fotos para documento na hora.'
    },
    catalogs: {
      menu: 'Escolha seu catálogo.'
    },
    personal_prints: {
      instructions: 'Envie suas fotos.',
      quote_and_pix: 'Pedido de {TOTAL_PHOTOS} fotos.'
    },
    studio_sessions: {
      info: 'Informações sobre ensaio.'
    },
    alboom: {
      menu: 'Menu alboom.',
      ask_client_info: 'Informe seu nome.',
      wait_hours_notice: 'Aguarde algumas horas para upload.',
      production_days_sla: 10,
      ask_selection_client_name: 'Nome do titular.',
      confirmation_notice: 'Prazo de até 10 dias úteis.'
    },
    sacramental: {
      prepaid_notice: 'Fotos de Crisma já quitadas.',
      received_notice: 'Dados recebidos.'
    },
    human_attendance: {
      direct_transfer: 'Transferindo...',
      fallback_transfer: 'Transferindo por fallback...'
    },
    common: {
      invalid_option: 'Opção inválida.',
      session_expired: 'Sessão expirada.'
    }
  }

  it('deve validar com sucesso um payload completo de mensagens', () => {
    const result = updateMessagesSchema.safeParse(validMessagesPayload)
    expect(result.success).toBe(true)
  })

  it('deve rejeitar quando o preço de documento for menor ou igual a zero', () => {
    const invalid = {
      ...validMessagesPayload,
      document_photos: {
        ...validMessagesPayload.document_photos,
        price: -5
      }
    }
    const result = updateMessagesSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('deve rejeitar quando faltar mensagem obrigatória de boas-vindas', () => {
    const invalid = {
      ...validMessagesPayload,
      main_menu: {
        welcome: ''
      }
    }
    const result = updateMessagesSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('deve validar query params de sessões com valores default', () => {
    const result = listSessionsQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.limit).toBe(20)
    }
  })

  it('deve validar parâmetros de toggle-human', () => {
    const validParams = toggleHumanParamsSchema.safeParse({
      remoteJid: '5511999998888@s.whatsapp.net'
    })
    expect(validParams.success).toBe(true)

    const invalidParams = toggleHumanParamsSchema.safeParse({ remoteJid: '' })
    expect(invalidParams.success).toBe(false)

    const validBody = toggleHumanBodySchema.safeParse({ targetState: 'HUMAN_ATTENDANCE' })
    expect(validBody.success).toBe(true)
  })
})
