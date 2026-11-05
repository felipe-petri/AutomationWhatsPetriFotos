import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import messages from '../../config/messages.json' with { type: 'json' }

export class PromptEngine {
  private static messagesDict: Record<string, any> = JSON.parse(JSON.stringify(messages))

  /**
   * Obtém uma mensagem configurada no messages.json navegando pela notação de pontos.
   * Exemplo: PromptEngine.get('main_menu.welcome')
   */
  public static get(keyPath: string, params?: Record<string, string | number>): string {
    const keys = keyPath.split('.')
    let current: any = this.messagesDict

    for (const key of keys) {
      if (current === undefined || current === null || !(key in current)) {
        throw new Error(`Mensagem não encontrada para a chave: "${keyPath}"`)
      }
      current = current[key]
    }

    if (typeof current !== 'string') {
      throw new Error(`O caminho "${keyPath}" não aponta para uma string de mensagem válida.`)
    }

    if (!params) {
      return current
    }

    return this.interpolate(current, params)
  }

  /**
   * Obtém qualquer valor configurado no messages.json (string, number, object, etc).
   */
  public static getRaw<T = unknown>(keyPath: string): T {
    const keys = keyPath.split('.')
    let current: any = this.messagesDict

    for (const key of keys) {
      if (current === undefined || current === null || !(key in current)) {
        throw new Error(`Configuração não encontrada para a chave: "${keyPath}"`)
      }
      current = current[key]
    }

    return current as T
  }

  /**
   * Substitui placeholders no formato {PLACEHOLDER} pelos valores fornecidos.
   */
  public static interpolate(template: string, params: Record<string, string | number>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      if (key in params) {
        return String(params[key])
      }
      return match
    })
  }

  /**
   * Retorna o dicionário completo de mensagens
   */
  public static getAll(): typeof messages {
    return this.messagesDict as typeof messages
  }

  /**
   * Atualiza o dicionário de mensagens em memória
   */
  public static reload(newMessages: Record<string, any>): void {
    this.messagesDict = JSON.parse(JSON.stringify(newMessages))
  }

  /**
   * Atualiza as mensagens em memória e persiste no arquivo messages.json
   */
  public static async save(newMessages: Record<string, any>, customFilePath?: string): Promise<void> {
    this.reload(newMessages)

    const targetPath = customFilePath || fileURLToPath(new URL('../../config/messages.json', import.meta.url))
    await fs.writeFile(targetPath, JSON.stringify(newMessages, null, 2), 'utf-8')
  }
}
