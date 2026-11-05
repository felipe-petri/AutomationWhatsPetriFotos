import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { AppError } from '../../core/errors/index.js'
import { adminService } from './admin.service.js'
import { whatsappInstanceService } from './whatsapp-instance.service.js'
import { flowchartService } from './flowchart.service.js'
import { baileysService } from '../../shared/clients/baileys.service.js'
import {
  servicesCatalogService,
  updateServicesSchema
} from '../catalogs/services-catalog.service.js'
import {
  updateMessagesSchema,
  listSessionsQuerySchema,
  toggleHumanParamsSchema,
  toggleHumanBodySchema
} from './admin.schema.js'
import {
  createWhatsAppInstanceSchema,
  updateWhatsAppInstanceSchema,
  instanceIdParamSchema
} from './whatsapp-instance.schema.js'

export async function getMessagesHandler(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const messages = adminService.getMessages()
  return reply.status(200).send({
    success: true,
    data: messages
  })
}

export async function updateMessagesHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const parseResult = updateMessagesSchema.safeParse(request.body)

  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: 'ValidationError',
      message: 'Dados inválidos para atualização de mensagens.',
      issues: parseResult.error.issues
    })
  }

  const updatedMessages = await adminService.updateMessages(parseResult.data)
  return reply.status(200).send({
    success: true,
    message: 'Mensagens e configurações atualizadas com sucesso.',
    data: updatedMessages
  })
}

export async function listSessionsHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const parseResult = listSessionsQuerySchema.safeParse(request.query)

  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: 'ValidationError',
      message: 'Parâmetros de consulta inválidos.',
      issues: parseResult.error.issues
    })
  }

  const result = await adminService.listSessions(parseResult.data)
  return reply.status(200).send({
    success: true,
    data: result
  })
}

export async function toggleHumanHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const paramsResult = toggleHumanParamsSchema.safeParse(request.params)

  if (!paramsResult.success) {
    return reply.status(400).send({
      success: false,
      error: 'ValidationError',
      message: 'Parâmetro remoteJid inválido.',
      issues: paramsResult.error.issues
    })
  }

  const bodyResult = toggleHumanBodySchema.safeParse(request.body || {})
  const targetState = bodyResult.success ? bodyResult.data?.targetState : undefined

  const updatedSession = await adminService.toggleHuman(paramsResult.data.remoteJid, targetState)
  return reply.status(200).send({
    success: true,
    message: `Atendimento ${updatedSession.currentState === 'HUMAN_ATTENDANCE' ? 'transferido para transbordo humano' : 'retomado pela automação'}.`,
    data: updatedSession
  })
}

export async function getStatsHandler(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const stats = await adminService.getStats()
  return reply.status(200).send({
    success: true,
    data: stats
  })
}

export async function getRequestsQueueHandler(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const queue = await adminService.getRequestsQueue()
  return reply.status(200).send({
    success: true,
    data: queue
  })
}

// ==========================================
// CRUD DA API DO WHATSAPP
// ==========================================

export async function listWhatsAppInstancesHandler(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const instances = await whatsappInstanceService.list()
  return reply.status(200).send({
    success: true,
    data: instances
  })
}

export async function createWhatsAppInstanceHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const parseResult = createWhatsAppInstanceSchema.safeParse(request.body)
  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: 'ValidationError',
      message: 'Dados inválidos para criação da conexão WhatsApp.',
      issues: parseResult.error.issues
    })
  }

  const instance = await whatsappInstanceService.create(parseResult.data)
  return reply.status(201).send({
    success: true,
    message: 'Conexão com WhatsApp API configurada com sucesso.',
    data: instance
  })
}

export async function getWhatsAppInstanceHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const paramResult = instanceIdParamSchema.safeParse(request.params)
  if (!paramResult.success) {
    return reply.status(400).send({
      success: false,
      error: 'ValidationError',
      message: 'ID de instância inválido.'
    })
  }

  const instance = await whatsappInstanceService.getById(paramResult.data.id)
  return reply.status(200).send({
    success: true,
    data: instance
  })
}

export async function updateWhatsAppInstanceHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const paramResult = instanceIdParamSchema.safeParse(request.params)
  if (!paramResult.success) {
    return reply.status(400).send({
      success: false,
      error: 'ValidationError',
      message: 'ID de instância inválido.'
    })
  }

  const bodyResult = updateWhatsAppInstanceSchema.safeParse(request.body)
  if (!bodyResult.success) {
    return reply.status(400).send({
      success: false,
      error: 'ValidationError',
      message: 'Dados inválidos para atualização da conexão.',
      issues: bodyResult.error.issues
    })
  }

  const updated = await whatsappInstanceService.update(paramResult.data.id, bodyResult.data)
  return reply.status(200).send({
    success: true,
    message: 'Conexão atualizada com sucesso.',
    data: updated
  })
}

export async function deleteWhatsAppInstanceHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const paramResult = instanceIdParamSchema.safeParse(request.params)
  if (!paramResult.success) {
    return reply.status(400).send({
      success: false,
      error: 'ValidationError',
      message: 'ID de instância inválido.'
    })
  }

  await whatsappInstanceService.delete(paramResult.data.id)
  return reply.status(200).send({
    success: true,
    message: 'Conexão removida com sucesso.'
  })
}

export async function testWhatsAppInstanceHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const paramResult = instanceIdParamSchema.safeParse(request.params)
  if (!paramResult.success) {
    return reply.status(400).send({
      success: false,
      error: 'ValidationError',
      message: 'ID de instância inválido.'
    })
  }

  const result = await whatsappInstanceService.testConnection(paramResult.data.id)
  return reply.status(200).send({
    success: true,
    data: result
  })
}

export async function getWhatsAppQRCodeHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const paramResult = instanceIdParamSchema.safeParse(request.params)
  if (!paramResult.success) {
    return reply.status(400).send({
      success: false,
      error: 'ValidationError',
      message: 'ID de instância inválido.'
    })
  }

  const qrResult = await whatsappInstanceService.getQRCode(paramResult.data.id)
  return reply.status(200).send({
    success: true,
    data: qrResult
  })
}

export async function activateWhatsAppInstanceHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const paramResult = instanceIdParamSchema.safeParse(request.params)
  if (!paramResult.success) {
    return reply.status(400).send({
      success: false,
      error: 'ValidationError',
      message: 'ID de instância inválido.'
    })
  }

  const active = await whatsappInstanceService.setDefault(paramResult.data.id)
  return reply.status(200).send({
    success: true,
    message: `Instância '${active.name}' definida como ativa.`,
    data: active
  })
}

// ==========================================
// BAILEYS NATIVO (WHATSAPP EMBARCADO)
// ==========================================

export async function getBaileysStatusHandler(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const status = baileysService.getStatus()
  return reply.status(200).send({
    success: true,
    status
  })
}

export async function getBaileysQRHandler(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (baileysService.getStatus() === 'DISCONNECTED') {
    // Inicia geração do socket e QR Code sob demanda
    await baileysService.init()
  }

  const qrData = baileysService.getQRCode()
  return reply.status(200).send({
    success: true,
    status: qrData.status,
    qrcode: qrData.qrcodeBase64,
    pairingCode: qrData.pairingCode,
    message: qrData.message
  })
}

export async function disconnectBaileysHandler(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await baileysService.disconnect()
  return reply.status(200).send({
    success: true,
    message: 'WhatsApp desconectado e credenciais de sessão limpas com sucesso.'
  })
}

export async function restartBaileysHandler(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await baileysService.restart()
  return reply.status(200).send({
    success: true,
    message: 'Serviço WhatsApp reiniciado com sucesso.'
  })
}

// ==========================================
// FLUXOGRAMA DE PERGUNTA E RESPOSTA (Q&A)
// ==========================================

export async function getFlowchartHandler(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const flow = flowchartService.getFlowchart()
  return reply.status(200).send({
    success: true,
    data: flow
  })
}

const updateNodeSchema = z.object({
  title: z.string().optional(),
  messageText: z.string().optional(),
  triggerDescription: z.string().optional(),
  options: z
    .array(
      z.object({
        id: z.string(),
        trigger: z.string(),
        label: z.string(),
        targetNodeId: z.string(),
        description: z.string().optional()
      })
    )
    .optional()
})

export async function updateFlowNodeHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const paramsResult = z.object({ id: z.string().min(1) }).safeParse(request.params)
  if (!paramsResult.success) {
    return reply.status(400).send({
      success: false,
      error: 'ValidationError',
      message: 'ID do nó é obrigatório.'
    })
  }

  const bodyResult = updateNodeSchema.safeParse(request.body)
  if (!bodyResult.success) {
    return reply.status(400).send({
      success: false,
      error: 'ValidationError',
      message: 'Dados inválidos para o nó.',
      issues: bodyResult.error.issues
    })
  }

  const updatedNode = await flowchartService.updateNode(paramsResult.data.id, bodyResult.data)
  return reply.status(200).send({
    success: true,
    message: 'Nó do fluxograma atualizado com sucesso.',
    data: updatedNode
  })
}

const createNodeSchema = z.object({
  id: z.string().optional(),
  parentId: z.string().optional(),
  title: z.string().min(2, 'Título do nó deve ter no mínimo 2 caracteres.'),
  category: z.string().min(1, 'Categoria é obrigatória.'),
  triggerDescription: z.string().min(1, 'Gatilho / pergunta do cliente é obrigatório.'),
  messageText: z.string().min(1, 'Texto de resposta do bot é obrigatório.'),
  options: z
    .array(
      z.object({
        id: z.string(),
        trigger: z.string(),
        label: z.string(),
        targetNodeId: z.string(),
        description: z.string().optional()
      })
    )
    .optional()
})

export async function createFlowNodeHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const bodyResult = createNodeSchema.safeParse(request.body)
  if (!bodyResult.success) {
    return reply.status(400).send({
      success: false,
      error: 'ValidationError',
      message: 'Dados inválidos para criar nó.',
      issues: bodyResult.error.issues
    })
  }

  const newNode = await flowchartService.createCustomNode(bodyResult.data)
  return reply.status(201).send({
    success: true,
    message: 'Nó adicionado ao fluxograma com sucesso.',
    data: newNode
  })
}

export async function deleteFlowNodeHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const params = request.params as any
  const targetId = params?.id || params?.nodeId

  if (!targetId || typeof targetId !== 'string' || targetId.trim().length === 0) {
    return reply.status(400).send({
      success: false,
      error: 'ValidationError',
      message: 'ID do nó é obrigatório.'
    })
  }

  await flowchartService.deleteCustomNode(targetId.trim())
  return reply.status(200).send({
    success: true,
    message: 'Nó removido do fluxograma com sucesso.'
  })
}

// ==========================================
// Gestão de Serviços & Links de Catálogos (UC-02)
// ==========================================

export async function getServicesCatalogHandler(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const services = servicesCatalogService.getAll()
  const sectors = servicesCatalogService.getSectors()
  return reply.status(200).send({
    success: true,
    data: {
      services,
      sectors
    }
  })
}

export async function updateServicesCatalogHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const bodyResult = updateServicesSchema.safeParse(request.body)
  if (!bodyResult.success) {
    return reply.status(400).send({
      success: false,
      error: 'ValidationError',
      message: 'Dados inválidos para o catálogo de serviços.',
      issues: bodyResult.error.issues
    })
  }

  const updated = await servicesCatalogService.updateAll(bodyResult.data)
  return reply.status(200).send({
    success: true,
    message: 'Catálogo de serviços e links atualizado com sucesso!',
    data: updated
  })
}
