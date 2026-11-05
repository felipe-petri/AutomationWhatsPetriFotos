import { FastifyInstance } from 'fastify'
import {
  getMessagesHandler,
  updateMessagesHandler,
  listSessionsHandler,
  toggleHumanHandler,
  getStatsHandler,
  getRequestsQueueHandler,
  listWhatsAppInstancesHandler,
  createWhatsAppInstanceHandler,
  getWhatsAppInstanceHandler,
  updateWhatsAppInstanceHandler,
  deleteWhatsAppInstanceHandler,
  testWhatsAppInstanceHandler,
  getWhatsAppQRCodeHandler,
  activateWhatsAppInstanceHandler,
  getFlowchartHandler,
  updateFlowNodeHandler,
  createFlowNodeHandler,
  deleteFlowNodeHandler,
  getBaileysStatusHandler,
  getBaileysQRHandler,
  disconnectBaileysHandler,
  restartBaileysHandler,
  getServicesCatalogHandler,
  updateServicesCatalogHandler
} from './admin.controller.js'

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  // Mensagens e Preços
  app.get('/api/admin/messages', getMessagesHandler)
  app.put('/api/admin/messages', updateMessagesHandler)
  app.post('/api/admin/messages/node', createFlowNodeHandler)
  app.delete('/api/admin/messages/node/:nodeId', deleteFlowNodeHandler)

  // Sessões e Monitor
  app.get('/api/admin/sessions', listSessionsHandler)
  app.patch('/api/admin/sessions/:remoteJid/toggle-human', toggleHumanHandler)
  app.get('/api/admin/stats', getStatsHandler)
  app.get('/api/admin/requests', getRequestsQueueHandler)

  // CRUD de Inclusão da API do WhatsApp
  app.get('/api/admin/whatsapp-instances', listWhatsAppInstancesHandler)
  app.post('/api/admin/whatsapp-instances', createWhatsAppInstanceHandler)
  app.get('/api/admin/whatsapp-instances/:id', getWhatsAppInstanceHandler)
  app.put('/api/admin/whatsapp-instances/:id', updateWhatsAppInstanceHandler)
  app.delete('/api/admin/whatsapp-instances/:id', deleteWhatsAppInstanceHandler)
  app.post('/api/admin/whatsapp-instances/:id/test', testWhatsAppInstanceHandler)
  app.get('/api/admin/whatsapp-instances/:id/qrcode', getWhatsAppQRCodeHandler)
  app.post('/api/admin/whatsapp-instances/:id/activate', activateWhatsAppInstanceHandler)

  // WhatsApp Nativo (Baileys)
  app.get('/api/admin/whatsapp/status', getBaileysStatusHandler)
  app.get('/api/admin/whatsapp/qr', getBaileysQRHandler)
  app.post('/api/admin/whatsapp/disconnect', disconnectBaileysHandler)
  app.post('/api/admin/whatsapp/restart', restartBaileysHandler)

  // Fluxograma de Pergunta e Resposta (Q&A)
  app.get('/api/admin/flowchart', getFlowchartHandler)
  app.put('/api/admin/flowchart/node/:id', updateFlowNodeHandler)
  app.post('/api/admin/flowchart/node', createFlowNodeHandler)
  app.delete('/api/admin/flowchart/node/:id', deleteFlowNodeHandler)

  // Gestão de Serviços & Links de Catálogos (UC-02)
  app.get('/api/admin/services-catalog', getServicesCatalogHandler)
  app.put('/api/admin/services-catalog', updateServicesCatalogHandler)
}
