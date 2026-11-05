import { baileysService } from './baileys.service.js'

export interface SendTextMessageParams {
  remoteJid: string
  text: string
}

export interface SendMediaMessageParams {
  remoteJid: string
  mediaUrl: string
  caption?: string
  fileName?: string
  mimetype?: string
}

export class EvolutionClient {
  /**
   * Envia mensagem de texto utilizando o Baileys embutido
   */
  public async sendTextMessage({ remoteJid, text }: SendTextMessageParams): Promise<unknown> {
    return await baileysService.sendTextMessage({ remoteJid, text })
  }

  /**
   * Envia arquivo de mídia ou documento PDF utilizando o Baileys embutido
   */
  public async sendMediaMessage({
    remoteJid,
    mediaUrl,
    caption,
    fileName,
    mimetype
  }: SendMediaMessageParams): Promise<unknown> {
    return await baileysService.sendMediaMessage({
      remoteJid,
      mediaUrl,
      caption,
      fileName,
      mimetype
    })
  }
}

export const evolutionClient = new EvolutionClient()
