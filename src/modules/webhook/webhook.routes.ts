import { FastifyInstance } from 'fastify'
import { evolutionWebhookHandler } from './webhook.controller.js'

export async function webhookRoutes(app: FastifyInstance): Promise<void> {
  app.post('/webhook/evolution', evolutionWebhookHandler)
}
