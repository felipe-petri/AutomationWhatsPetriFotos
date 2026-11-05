import crypto from 'node:crypto'
import { FastifyReply, FastifyRequest } from 'fastify'
import { env } from '../../config/env.js'
import { messageQueue } from '../../core/queue/message.queue.js'
import { EvolutionEventSchema } from './webhook.schema.js'

export function extractMessageText(messagePayload?: Record<string, unknown>): string {
  if (!messagePayload) return ''

  if (typeof messagePayload.conversation === 'string') {
    return messagePayload.conversation.trim()
  }

  const extended = messagePayload.extendedTextMessage as { text?: string } | undefined
  if (extended && typeof extended.text === 'string') {
    return extended.text.trim()
  }

  const imageMessage = messagePayload.imageMessage as { caption?: string } | undefined
  if (imageMessage && typeof imageMessage.caption === 'string') {
    return imageMessage.caption.trim()
  }

  const documentMessage = messagePayload.documentMessage as { caption?: string } | undefined
  if (documentMessage && typeof documentMessage.caption === 'string') {
    return documentMessage.caption.trim()
  }

  return ''
}

export async function evolutionWebhookHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const headerApiKey = request.headers['apikey'] || request.headers['x-webhook-secret']

  if (
    !headerApiKey ||
    typeof headerApiKey !== 'string' ||
    headerApiKey.length !== env.WEBHOOK_SECRET.length ||
    !crypto.timingSafeEqual(Buffer.from(headerApiKey), Buffer.from(env.WEBHOOK_SECRET))
  ) {
    return reply.status(401).send({ error: 'Unauthorized: Invalid apiKey / webhook secret' })
  }

  const parseResult = EvolutionEventSchema.safeParse(request.body)

  if (!parseResult.success) {
    return reply.status(200).send({ ignored: true, reason: 'schema_mismatch' })
  }

  const { event, data } = parseResult.data

  // Ignora mensagens enviadas pelo próprio bot e eventos que não sejam mensagens recebidas
  if (data.key.fromMe || event !== 'messages.upsert') {
    return reply.status(200).send({ ignored: true })
  }

  const textInput = extractMessageText(data.message)

  await messageQueue.add(
    'process-incoming-message',
    {
      messageId: data.key.id,
      remoteJid: data.key.remoteJid,
      senderName: data.pushName ?? 'Cliente',
      textInput,
      rawPayload: data.message,
      timestamp: Number(data.messageTimestamp)
    },
    {
      jobId: data.key.id,
      removeOnComplete: true,
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 }
    }
  )

  return reply.status(200).send({ received: true })
}
