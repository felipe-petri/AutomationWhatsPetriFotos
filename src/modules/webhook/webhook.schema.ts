import { z } from 'zod'

export const EvolutionEventSchema = z.object({
  event: z.string(),
  instance: z.string(),
  data: z.object({
    key: z.object({
      remoteJid: z.string(),
      fromMe: z.boolean(),
      id: z.string()
    }),
    pushName: z.string().optional(),
    message: z.record(z.unknown()).optional(),
    messageTimestamp: z.union([z.number(), z.string()])
  })
})

export type EvolutionEventType = z.infer<typeof EvolutionEventSchema>
