import { z } from 'zod'

export const updateMessagesSchema = z
  .object({
    main_menu: z.object({
      welcome: z.string().min(1, 'Mensagem de boas-vindas é obrigatória.')
    }),
    document_photos: z.object({
      price: z.coerce.number().positive('Preço de fotos para documento deve ser maior que zero.'),
      packages: z.record(z.coerce.number().positive('Quantidade de fotos do pacote deve ser maior que zero.')),
      text: z.string().min(1, 'Texto de fotos para documento é obrigatório.')
    }),
    catalogs: z.object({
      menu: z.string().min(1, 'Texto do menu de catálogos é obrigatório.'),
      submenu_infantil: z.string().optional(),
      submenu_natal: z.string().optional(),
      delivery_success: z.string().optional(),
      delivery_missing: z.string().optional()
    }),
    personal_prints: z.object({
      instructions: z.string().min(1, 'Instruções de fotos pessoais são obrigatórias.'),
      quote_and_pix: z.string().min(1, 'Template de orçamento e Pix é obrigatório.')
    }),
    studio_sessions: z.object({
      info: z.string().min(1, 'Informações sobre ensaios em estúdio são obrigatórias.')
    }),
    alboom: z.object({
      menu: z.string().min(1, 'Menu do Alboom é obrigatório.'),
      ask_client_info: z.string().min(1, 'Solicitação de dados do Alboom é obrigatória.'),
      wait_hours_notice: z.string().min(1, 'Aviso de SLA de upload do Alboom é obrigatório.'),
      production_days_sla: z.coerce.number().int().positive('SLA de produção do Alboom deve ser em dias positivos.'),
      ask_selection_client_name: z.string().min(1, 'Solicitação de nome para confirmação é obrigatória.'),
      confirmation_notice: z.string().min(1, 'Aviso de confirmação de produção é obrigatório.')
    }),
    sacramental: z.object({
      prepaid_notice: z.string().min(1, 'Mensagem de identificação sacramental é obrigatória.'),
      received_notice: z.string().min(1, 'Aviso de recebimento sacramental é obrigatório.')
    }),
    human_attendance: z.object({
      direct_transfer: z.string().min(1, 'Mensagem de transferência direta é obrigatória.'),
      fallback_transfer: z.string().min(1, 'Mensagem de fallback é obrigatória.')
    }),
    common: z.object({
      invalid_option: z.string().min(1, 'Mensagem de opção inválida é obrigatória.'),
      session_expired: z.string().min(1, 'Mensagem de sessão expirada é obrigatória.')
    })
  })
  .passthrough()

export type UpdateMessagesDTO = z.infer<typeof updateMessagesSchema>

export const listSessionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z.string().trim().optional()
})

export type ListSessionsQuery = z.infer<typeof listSessionsQuerySchema>

export const toggleHumanParamsSchema = z.object({
  remoteJid: z.string().min(1, 'remoteJid é obrigatório.')
})

export const toggleHumanBodySchema = z
  .object({
    targetState: z.enum(['HUMAN_ATTENDANCE', 'IDLE']).optional()
  })
  .optional()

export type ToggleHumanBody = z.infer<typeof toggleHumanBodySchema>
