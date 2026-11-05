import { PromptEngine } from '../../core/prompts/prompt.engine.js'
import { sessionRepository } from '../sessions/session.repository.js'
import {
  UpdateMessagesDTO,
  ListSessionsQuery
} from './admin.schema.js'
import { ConversationState } from '../../core/fsm/types.js'
import { AppError } from '../../core/errors/index.js'

export class AdminService {
  public getMessages() {
    return PromptEngine.getAll()
  }

  public async updateMessages(newMessages: UpdateMessagesDTO) {
    try {
      await PromptEngine.save(newMessages)
      return PromptEngine.getAll()
    } catch (err: any) {
      throw new AppError(`Falha ao salvar as mensagens: ${err.message}`, 500)
    }
  }

  public async listSessions(query: ListSessionsQuery) {
    return await sessionRepository.list(query)
  }

  public async toggleHuman(remoteJid: string, forceState?: ConversationState) {
    try {
      return await sessionRepository.toggleHumanAttendance(remoteJid, forceState)
    } catch (err: any) {
      if (err.message?.includes('não encontrada')) {
        throw new AppError(err.message, 404)
      }
      throw new AppError(err.message || 'Erro ao alternar modo de atendimento', 500)
    }
  }

  public async getStats() {
    return await sessionRepository.getStats()
  }

  public async getRequestsQueue() {
    return await sessionRepository.listRequests()
  }
}

export const adminService = new AdminService()
