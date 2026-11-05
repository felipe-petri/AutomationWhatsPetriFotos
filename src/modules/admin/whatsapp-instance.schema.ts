import { z } from 'zod'

export const whatsappInstanceStatusEnum = z.enum(['CONNECTED', 'CONNECTING', 'DISCONNECTED', 'QR_CODE'])
export type WhatsAppInstanceStatus = z.infer<typeof whatsappInstanceStatusEnum>

export const createWhatsAppInstanceSchema = z.object({
  name: z.string().min(2, 'O nome da conexão deve ter pelo menos 2 caracteres.'),
  instanceName: z
    .string()
    .min(2, 'O nome da instância deve ter pelo menos 2 caracteres.')
    .regex(/^[a-zA-Z0-9_-]+$/, 'O nome da instância deve conter apenas letras, números, hífen ou underline.'),
  apiUrl: z.string().url('A URL da API Evolution deve ser uma URL válida (ex: http://localhost:8080).'),
  apiKey: z.string().min(1, 'A chave da API (apiKey) é obrigatória.'),
  webhookUrl: z.string().url('A URL do webhook deve ser válida.').optional().or(z.literal('')),
  webhookSecret: z.string().optional().default(''),
  isDefault: z.boolean().optional().default(false)
})

export type CreateWhatsAppInstanceDTO = z.infer<typeof createWhatsAppInstanceSchema>

export const updateWhatsAppInstanceSchema = createWhatsAppInstanceSchema.partial()
export type UpdateWhatsAppInstanceDTO = z.infer<typeof updateWhatsAppInstanceSchema>

export const instanceIdParamSchema = z.object({
  id: z.string().min(1, 'ID da instância é obrigatório.')
})
export type InstanceIdParam = z.infer<typeof instanceIdParamSchema>
