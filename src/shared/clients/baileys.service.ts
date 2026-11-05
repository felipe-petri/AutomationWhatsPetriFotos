import baileysPackage, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  proto,
  WAMessage
} from '@whiskeysockets/baileys'
import QRCode from 'qrcode'
import pino from 'pino'
import fs from 'fs'
import path from 'path'
import { messageQueue } from '../../core/queue/message.queue.js'
import { extractMessageText } from '../../modules/webhook/webhook.controller.js'
import { processConversationMessage } from '../../core/fsm/conversation-worker.js'

// Compatibilidade de importação default em ESM
const makeWASocket = (baileysPackage as any).default || baileysPackage

export type BaileysConnectionStatus = 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED'

export interface SendBaileysTextMessageParams {
  remoteJid: string
  text: string
}

export interface SendBaileysMediaMessageParams {
  remoteJid: string
  mediaUrl: string
  caption?: string
  fileName?: string
  mimetype?: string
}

export class BaileysService {
  private static instance: BaileysService
  private socket: WASocket | null = null
  private status: BaileysConnectionStatus = 'DISCONNECTED'
  private qrCodeBase64: string | null = null
  private pairingCode: string | null = null
  private isInitializing = false
  private authDir: string

  private constructor() {
    this.authDir = path.resolve(process.cwd(), 'data/auth_info_baileys')
  }

  public static getInstance(): BaileysService {
    if (!BaileysService.instance) {
      BaileysService.instance = new BaileysService()
    }
    return BaileysService.instance
  }

  public getStatus(): BaileysConnectionStatus {
    return this.status
  }

  public getQRCode(): {
    status: BaileysConnectionStatus
    qrcodeBase64: string | null
    pairingCode: string | null
    message: string
  } {
    if (this.status === 'CONNECTED') {
      return {
        status: 'CONNECTED',
        qrcodeBase64: null,
        pairingCode: null,
        message: 'WhatsApp já conectado e operacional.'
      }
    }

    return {
      status: this.status,
      qrcodeBase64: this.qrCodeBase64,
      pairingCode: this.pairingCode,
      message: this.qrCodeBase64
        ? 'QR Code gerado com sucesso. Escaneie no WhatsApp.'
        : 'Gerando QR Code... Aguarde alguns instantes.'
    }
  }

  public async init(): Promise<void> {
    // Não inicializa socket real de rede durante testes unitários isolados
    if (process.env.NODE_ENV === 'test') {
      this.status = 'DISCONNECTED'
      return
    }

    if (this.isInitializing || this.status === 'CONNECTED') {
      return
    }

    this.isInitializing = true
    this.status = 'CONNECTING'

    try {
      if (!fs.existsSync(this.authDir)) {
        fs.mkdirSync(this.authDir, { recursive: true })
      }

      const { state, saveCreds } = await useMultiFileAuthState(this.authDir)

      const logger = pino({ level: 'silent' })

      const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger,
        browser: ['Petri Fotos Bot', 'Chrome', '1.0.0']
      })

      this.socket = sock

      // Salva credenciais atualizadas
      sock.ev.on('creds.update', saveCreds)

      // Monitoramento da Conexão
      sock.ev.on('connection.update', async (update: any) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) {
          try {
            this.qrCodeBase64 = await QRCode.toDataURL(qr, {
              margin: 2,
              scale: 8,
              color: {
                dark: '#0f172a',
                light: '#ffffff'
              }
            })
            this.status = 'CONNECTING'
            console.log('📸 [Baileys] Novo QR Code gerado para leitura no Dashboard.')
          } catch (qrErr) {
            console.error('❌ [Baileys] Erro ao converter QR Code para Base64:', qrErr)
          }
        }

        if (connection === 'connecting') {
          this.status = 'CONNECTING'
        }

        if (connection === 'open') {
          this.status = 'CONNECTED'
          this.qrCodeBase64 = null
          this.pairingCode = null
          console.log('✅ [Baileys] Conexão com o WhatsApp estabelecida com sucesso!')
        }

        if (connection === 'close') {
          this.status = 'DISCONNECTED'
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut

          console.log(
            `⚠️ [Baileys] Conexão fechada. Motivo: ${statusCode}. Reconectar? ${shouldReconnect}`
          )

          if (shouldReconnect) {
            this.socket = null
            this.isInitializing = false
            setTimeout(() => {
              this.init()
            }, 3000)
          } else {
            console.log('🔒 [Baileys] Sessão desconectada intencionalmente (Logout).')
            await this.clearAuthDirectory()
            this.socket = null
            this.isInitializing = false
          }
        }
      })

      // Ingestão de mensagens recebidas (Equivalente ao webhook da Evolution)
      sock.ev.on('messages.upsert', async (upsert: { type: string; messages: WAMessage[] }) => {
        if (upsert.type !== 'notify') return

        for (const message of upsert.messages) {
          const key = message.key
          if (!key || key.fromMe) continue

          const remoteJid = key.remoteJid
          if (!remoteJid || remoteJid.endsWith('@g.us') || remoteJid === 'status@broadcast') {
            continue
          }

          const senderName = message.pushName || 'Cliente'
          const messageId = key.id || crypto.randomUUID()
          const rawPayload = (message.message as Record<string, unknown>) || {}
          const textInput = extractMessageText(rawPayload)
          const timestamp = Number(message.messageTimestamp || Math.floor(Date.now() / 1000))

          const jobData = {
            messageId,
            remoteJid,
            senderName,
            textInput,
            rawPayload,
            timestamp
          }

          try {
            await messageQueue.add('process-incoming-message', jobData, {
              jobId: messageId,
              removeOnComplete: true,
              attempts: 3,
              backoff: { type: 'exponential', delay: 1000 }
            })
          } catch (err: any) {
            console.warn(`⚠️ [Baileys] Fila Redis indisponível (${err.message}). Processando mensagem diretamente pela FSM...`)
            try {
              await processConversationMessage(jobData)
            } catch (fsmErr: any) {
              console.error(`❌ [Baileys] Erro no processamento direto pela FSM para ${remoteJid}:`, fsmErr.message)
            }
          }
        }
      })
    } catch (err: any) {
      this.status = 'DISCONNECTED'
      this.isInitializing = false
      console.error('❌ [Baileys] Falha ao inicializar socket Baileys:', err.message)
    } finally {
      this.isInitializing = false
    }
  }

  public async sendTextMessage({ remoteJid, text }: SendBaileysTextMessageParams): Promise<any> {
    if (!this.socket || this.status !== 'CONNECTED') {
      // Em ambiente de teste mockamos o envio com sucesso
      if (process.env.NODE_ENV === 'test') {
        return { status: 'mock_sent', remoteJid, text }
      }
      throw new Error('WhatsApp não está conectado. Escaneie o QR Code no Dashboard Admin.')
    }

    const jid = this.normalizeJid(remoteJid)
    return await this.socket.sendMessage(jid, { text })
  }

  public async sendMediaMessage({
    remoteJid,
    mediaUrl,
    caption,
    fileName,
    mimetype
  }: SendBaileysMediaMessageParams): Promise<any> {
    if (!this.socket || this.status !== 'CONNECTED') {
      if (process.env.NODE_ENV === 'test') {
        return { status: 'mock_media_sent', remoteJid, mediaUrl }
      }
      throw new Error('WhatsApp não está conectado. Escaneie o QR Code no Dashboard Admin.')
    }

    const jid = this.normalizeJid(remoteJid)
    const isImage = mimetype?.startsWith('image') || /\.(jpg|jpeg|png|webp)$/i.test(mediaUrl)

    if (isImage) {
      if (mediaUrl.startsWith('http')) {
        return await this.socket.sendMessage(jid, {
          image: { url: mediaUrl },
          caption
        })
      } else if (fs.existsSync(mediaUrl)) {
        const buffer = fs.readFileSync(mediaUrl)
        return await this.socket.sendMessage(jid, {
          image: buffer,
          caption
        })
      }
    }

    // Documento / PDF
    const resolvedMimetype = mimetype || 'application/pdf'
    const resolvedFileName = fileName || 'catalogo_petri_fotos.pdf'

    if (mediaUrl.startsWith('http')) {
      return await this.socket.sendMessage(jid, {
        document: { url: mediaUrl },
        mimetype: resolvedMimetype,
        fileName: resolvedFileName,
        caption
      })
    } else if (fs.existsSync(mediaUrl)) {
      const buffer = fs.readFileSync(mediaUrl)
      return await this.socket.sendMessage(jid, {
        document: buffer,
        mimetype: resolvedMimetype,
        fileName: resolvedFileName,
        caption
      })
    } else {
      // Fallback enviando o link como texto se o arquivo local não for encontrado
      return await this.socket.sendMessage(jid, {
        text: `${caption ? caption + '\n\n' : ''}Acesse seu documento em: ${mediaUrl}`
      })
    }
  }

  public async disconnect(): Promise<void> {
    if (this.socket) {
      try {
        await this.socket.logout()
      } catch {
        // Ignora erros caso o socket já esteja desconectado
      }
      try {
        this.socket.end(undefined)
      } catch {
        // Ignora
      }
    }

    this.socket = null
    this.status = 'DISCONNECTED'
    this.qrCodeBase64 = null
    this.pairingCode = null
    this.isInitializing = false

    await this.clearAuthDirectory()
    console.log('🧹 [Baileys] Sessão desconectada e diretório de credenciais limpo.')
  }

  public async restart(): Promise<void> {
    if (this.socket) {
      try {
        this.socket.end(undefined)
      } catch {
        // Ignora
      }
      this.socket = null
    }

    this.status = 'DISCONNECTED'
    this.isInitializing = false
    await this.init()
  }

  private async clearAuthDirectory(): Promise<void> {
    try {
      if (fs.existsSync(this.authDir)) {
        fs.rmSync(this.authDir, { recursive: true, force: true })
      }
    } catch (err: any) {
      console.error('❌ [Baileys] Erro ao limpar pasta de auth:', err.message)
    }
  }

  private normalizeJid(jid: string): string {
    if (jid.includes('@')) {
      return jid
    }
    const clean = jid.replace(/\D/g, '')
    return `${clean}@s.whatsapp.net`
  }
}

export const baileysService = BaileysService.getInstance()
