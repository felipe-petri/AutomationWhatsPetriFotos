import { buildApp } from './app.js'
import { env } from './config/env.js'
import { startConversationWorker } from './core/fsm/conversation-worker.js'
import { dbPool } from './shared/database/connection.js'
import { redisClient } from './shared/database/redis.js'
import { baileysService } from './shared/clients/baileys.service.js'

async function bootstrap() {
  const app = buildApp()

  // Inicia worker da fila de mensagens em background
  let worker: ReturnType<typeof startConversationWorker> | null = null
  try {
    worker = startConversationWorker()
    app.log.info('🚀 Conversation Worker iniciado com sucesso')
  } catch (err) {
    app.log.warn({ err }, 'Worker não pôde conectar ao Redis imediatamente')
  }

  // Inicia transporte WhatsApp nativo Baileys
  try {
    await baileysService.init()
    app.log.info('📱 [Baileys] Transporte WhatsApp nativo inicializado')
  } catch (err: any) {
    app.log.warn({ err: err.message }, '📱 [Baileys] Aguardando leitura do QR Code')
  }

  try {
    await app.listen({ port: env.PORT, host: env.HOST })
    app.log.info(`Servidor rodando em http://${env.HOST}:${env.PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }

  const gracefulShutdown = async (signal: string) => {
    app.log.info(`Recebido ${signal}. Encerrando aplicação graciosamente...`)
    try {
      await app.close()
      if (worker) {
        await worker.close()
      }
      await redisClient.quit()
      await dbPool.end()
      process.exit(0)
    } catch (err) {
      app.log.error({ err }, 'Erro ao encerrar recursos')
      process.exit(1)
    }
  }

  process.on('SIGINT', () => gracefulShutdown('SIGINT'))
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
}

bootstrap()
