import { Job, Worker } from 'bullmq'
import { sessionRepository } from '../../modules/sessions/session.repository.js'
import { evolutionClient } from '../../shared/clients/evolution.client.js'
import { redisClient } from '../../shared/database/redis.js'
import { dbPool } from '../../shared/database/connection.js'
import { IncomingMessageJobData } from '../queue/message.queue.js'
import { fsmRouter } from './fsm.router.js'

export async function processConversationMessage(data: IncomingMessageJobData): Promise<void> {
  const { messageId, remoteJid, senderName, textInput, rawPayload } = data

  // 1. Guard de Idempotência: MariaDB (persistente)
  try {
    const [result]: any = await dbPool.query(
      'INSERT IGNORE INTO idempotent_messages (message_id, remote_jid) VALUES (?, ?)',
      [messageId, remoteJid]
    )
    if (result && result.affectedRows === 0) {
      // Mensagem já processada anteriormente
      return
    }
  } catch (err: any) {
    console.warn(`⚠️ [FSM] Aviso ao verificar idempotência no MariaDB: ${err.message}`)
  }

  // 2. Trava opcional no Redis (se disponível)
  let userLockKey = `lock:user:${remoteJid}`
  let redisLockAcquired = false
  try {
    const userLock = await redisClient.set(userLockKey, 'locked', 'EX', 15, 'NX')
    if (userLock) {
      redisLockAcquired = true
    }
  } catch {
    // Redis offline: prossegue com a garantia de sessão do MariaDB
  }

  try {
    // 3. Recuperação ou criação de Sessão no MariaDB
    let session = await sessionRepository.findByRemoteJid(remoteJid)
    if (!session) {
      session = await sessionRepository.create(remoteJid, senderName)
    }

    // 4. Verificação de Transbordo Humano
    if (session.currentState === 'HUMAN_ATTENDANCE') {
      return
    }

    // 5. Execução de Transição na Máquina de Estados (FSM)
    const transitionResult = await fsmRouter.execute({
      remoteJid,
      senderName,
      currentState: session.currentState,
      contextData: session.contextData,
      textInput,
      rawPayload
    })

    // 6. Atualiza Estado e Contexto no MariaDB
    await sessionRepository.update(remoteJid, {
      currentState: transitionResult.nextState,
      contextData: transitionResult.updatedContext,
      updatedAt: new Date()
    })

    // 7. Disparo da Resposta via Baileys / WhatsApp
    if (transitionResult.mediaAttachment) {
      await evolutionClient.sendMediaMessage({
        remoteJid,
        mediaUrl: transitionResult.mediaAttachment.url,
        caption: transitionResult.replyMessage,
        fileName: transitionResult.mediaAttachment.fileName
      })
    } else {
      await evolutionClient.sendTextMessage({
        remoteJid,
        text: transitionResult.replyMessage
      })
    }
  } finally {
    if (redisLockAcquired) {
      try {
        await redisClient.del(userLockKey)
      } catch {
        // Ignora erro de liberação de lock no Redis
      }
    }
  }
}

export async function processConversationJob(job: Job<IncomingMessageJobData>): Promise<void> {
  await processConversationMessage(job.data)
}

export function startConversationWorker(): Worker<IncomingMessageJobData> | null {
  try {
    const worker = new Worker<IncomingMessageJobData>('incoming-messages', processConversationJob, {
      connection: redisClient,
      concurrency: 5
    })

    worker.on('failed', (job, err) => {
      console.error(`❌ Job ${job?.id} falhou com erro:`, err)
    })

    worker.on('error', (err) => {
      // Não quebra a aplicação caso o Redis não esteja ativo
      if (process.env.NODE_ENV !== 'test') {
        console.warn('⚠️ [BullMQ Worker] Aviso de conexão com Redis:', err.message)
      }
    })

    return worker
  } catch (err: any) {
    console.warn('⚠️ [BullMQ Worker] Redis offline, processamento direto ativo:', err.message)
    return null
  }
}
