import { Queue } from 'bullmq'
import { redisClient } from '../../shared/database/redis.js'

export interface IncomingMessageJobData {
  messageId: string
  remoteJid: string
  senderName: string
  textInput: string
  rawPayload?: Record<string, unknown>
  timestamp: number
}

export const messageQueue = new Queue<IncomingMessageJobData>('incoming-messages', {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
})

messageQueue.on('error', (err) => {
  if (process.env.NODE_ENV !== 'test') {
    // Log silencioso quando Redis estiver inativo
  }
})
