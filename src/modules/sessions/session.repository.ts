import { dbPool, parseJsonField, stringifyJsonField } from '../../shared/database/connection.js'
import {
  Session,
  UpdateSessionDTO,
  ListSessionsOptions,
  PaginatedResult,
  SessionStats,
  RequestsQueueResult,
  PersonalPrintRequestItem,
  AlboomRequestItem,
  SacramentalRequestItem
} from './session.types.js'
import { ConversationState } from '../../core/fsm/types.js'
import { calculateBusinessDays } from '../../shared/utils/date.utils.js'
import { PromptEngine } from '../../core/prompts/prompt.engine.js'

export class SessionRepository {
  public async findByRemoteJid(remoteJid: string): Promise<Session | null> {
    const query = `
      SELECT 
        remote_jid as remoteJid,
        sender_name as senderName,
        current_state as currentState,
        context_data as contextData,
        error_count as errorCount,
        created_at as createdAt,
        updated_at as updatedAt
      FROM sessions
      WHERE remote_jid = ?
      LIMIT 1
    `
    const [rows] = await dbPool.query<any[]>(query, [remoteJid])
    if (!rows || rows.length === 0) return null

    const row = rows[0]
    return {
      remoteJid: row.remoteJid,
      senderName: row.senderName,
      currentState: row.currentState,
      contextData: parseJsonField(row.contextData),
      errorCount: Number(row.errorCount || 0),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    } as Session
  }

  public async create(remoteJid: string, senderName: string): Promise<Session> {
    const query = `
      INSERT INTO sessions (remote_jid, sender_name, current_state, context_data, error_count)
      VALUES (?, ?, 'IDLE', '{}', 0)
      ON DUPLICATE KEY UPDATE 
        sender_name = VALUES(sender_name), 
        updated_at = CURRENT_TIMESTAMP
    `
    await dbPool.query(query, [remoteJid, senderName])
    const session = await this.findByRemoteJid(remoteJid)
    if (!session) {
      throw new Error(`Falha ao obter sessão recém criada para: ${remoteJid}`)
    }
    return session
  }

  public async update(remoteJid: string, data: UpdateSessionDTO): Promise<Session | null> {
    const fields: string[] = []
    const values: unknown[] = []

    if (data.currentState !== undefined) {
      fields.push(`current_state = ?`)
      values.push(data.currentState)
    }

    if (data.contextData !== undefined) {
      fields.push(`context_data = ?`)
      values.push(stringifyJsonField(data.contextData))
    }

    if (data.errorCount !== undefined) {
      fields.push(`error_count = ?`)
      values.push(data.errorCount)
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(remoteJid)

    const query = `
      UPDATE sessions
      SET ${fields.join(', ')}
      WHERE remote_jid = ?
    `

    await dbPool.query(query, values)
    return await this.findByRemoteJid(remoteJid)
  }

  public async list(options: ListSessionsOptions = {}): Promise<PaginatedResult<Session>> {
    const page = Math.max(1, options.page || 1)
    const limit = Math.max(1, Math.min(100, options.limit || 20))
    const offset = (page - 1) * limit

    const whereClauses: string[] = []
    const values: unknown[] = []

    if (options.search && options.search.trim()) {
      whereClauses.push(`(sender_name LIKE ? OR remote_jid LIKE ?)`)
      const pattern = `%${options.search.trim()}%`
      values.push(pattern, pattern)
    }

    if (options.status) {
      if (options.status === 'human') {
        whereClauses.push(`current_state = 'HUMAN_ATTENDANCE'`)
      } else if (options.status === 'bot') {
        whereClauses.push(`current_state != 'HUMAN_ATTENDANCE'`)
      } else if (options.status !== 'all') {
        whereClauses.push(`current_state = ?`)
        values.push(options.status)
      }
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const countQuery = `SELECT COUNT(*) as count FROM sessions ${whereString}`
    const [countRows] = await dbPool.query<any[]>(countQuery, values)
    const total = parseInt(countRows[0]?.count || '0', 10)

    const listQuery = `
      SELECT 
        remote_jid as remoteJid,
        sender_name as senderName,
        current_state as currentState,
        context_data as contextData,
        error_count as errorCount,
        created_at as createdAt,
        updated_at as updatedAt
      FROM sessions
      ${whereString}
      ORDER BY updated_at DESC
      LIMIT ? OFFSET ?
    `
    const listValues = [...values, limit, offset]
    const [rows] = await dbPool.query<any[]>(listQuery, listValues)

    const items: Session[] = (rows || []).map((row: any) => ({
      remoteJid: row.remoteJid,
      senderName: row.senderName,
      currentState: row.currentState,
      contextData: parseJsonField(row.contextData),
      errorCount: Number(row.errorCount || 0),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }))

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    }
  }

  public async toggleHumanAttendance(remoteJid: string, forceState?: ConversationState): Promise<Session> {
    const session = await this.findByRemoteJid(remoteJid)
    if (!session) {
      throw new Error(`Sessão não encontrada para o número: ${remoteJid}`)
    }

    let nextState: ConversationState
    if (forceState) {
      nextState = forceState
    } else {
      nextState = session.currentState === 'HUMAN_ATTENDANCE' ? 'IDLE' : 'HUMAN_ATTENDANCE'
    }

    const updated = await this.update(remoteJid, {
      currentState: nextState,
      contextData: {
        ...session.contextData,
        lastManualToggleAt: new Date().toISOString(),
        manualToggleBy: 'admin_dashboard'
      },
      errorCount: nextState === 'IDLE' ? 0 : session.errorCount
    })

    if (!updated) {
      throw new Error(`Falha ao alternar estado da sessão: ${remoteJid}`)
    }

    return updated
  }

  public async getStats(): Promise<SessionStats> {
    const query = `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN current_state = 'HUMAN_ATTENDANCE' THEN 1 END) as human,
        COUNT(CASE WHEN current_state != 'HUMAN_ATTENDANCE' THEN 1 END) as bot,
        COUNT(CASE WHEN
          JSON_UNQUOTE(JSON_EXTRACT(context_data, '$.selectedMenu')) IN ('PERSONAL_PRINTS', 'ALBOOM', 'SACRAMENTAL')
          OR JSON_EXTRACT(context_data, '$.alboomAction') IS NOT NULL
          OR JSON_EXTRACT(context_data, '$.sacramentalData') IS NOT NULL
          OR JSON_EXTRACT(context_data, '$.photoCount') IS NOT NULL
        THEN 1 END) as pending
      FROM sessions
    `
    const [rows] = await dbPool.query<any[]>(query)
    const row = rows[0] || {}

    return {
      totalSessions: parseInt(row.total || '0', 10),
      humanSessions: parseInt(row.human || '0', 10),
      botSessions: parseInt(row.bot || '0', 10),
      pendingRequests: parseInt(row.pending || '0', 10)
    }
  }

  public async listRequests(): Promise<RequestsQueueResult> {
    const query = `
      SELECT 
        remote_jid as remoteJid,
        sender_name as senderName,
        current_state as currentState,
        context_data as contextData,
        error_count as errorCount,
        created_at as createdAt,
        updated_at as updatedAt
      FROM sessions
      WHERE 
        JSON_UNQUOTE(JSON_EXTRACT(context_data, '$.selectedMenu')) IN ('PERSONAL_PRINTS', 'ALBOOM', 'SACRAMENTAL')
        OR JSON_EXTRACT(context_data, '$.alboomAction') IS NOT NULL
        OR JSON_EXTRACT(context_data, '$.sacramentalData') IS NOT NULL
        OR JSON_EXTRACT(context_data, '$.photoCount') IS NOT NULL
      ORDER BY updated_at DESC
      LIMIT 100
    `
    const [rows] = await dbPool.query<any[]>(query)
    const sessions: Session[] = (rows || []).map((row: any) => ({
      remoteJid: row.remoteJid,
      senderName: row.senderName,
      currentState: row.currentState,
      contextData: parseJsonField(row.contextData),
      errorCount: Number(row.errorCount || 0),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }))

    const personalPrints: PersonalPrintRequestItem[] = []
    const alboom: AlboomRequestItem[] = []
    const sacramental: SacramentalRequestItem[] = []

    const slaDays = (PromptEngine.getRaw('alboom.production_days_sla') as number) || 10

    for (const s of sessions) {
      const ctx = s.contextData || {}

      // Personal prints
      if (ctx.selectedMenu === 'PERSONAL_PRINTS' || ctx.photoCount || ctx.photoSize || ctx.orderId) {
        personalPrints.push({
          remoteJid: s.remoteJid,
          senderName: s.senderName,
          photoCount: typeof ctx.photoCount === 'number' ? ctx.photoCount : undefined,
          photoSize: typeof ctx.photoSize === 'string' ? ctx.photoSize : undefined,
          totalAmount: typeof ctx.totalAmount === 'number' ? ctx.totalAmount : undefined,
          pixStatus: ctx.pixStatus === 'PAID' ? 'PAID' : 'PENDING_PIX',
          createdAt: s.createdAt,
          updatedAt: s.updatedAt
        })
      }

      // Alboom requests
      if (ctx.alboomAction || ctx.alboomRequestData || ctx.alboomSelectionData || ctx.selectedMenu === 'ALBOOM') {
        const isConfirm = ctx.alboomAction === 'CONFIRM_SELECTION' || !!ctx.alboomSelectionData
        const type: 'REQUEST_LINK' | 'CONFIRM_SELECTION' = isConfirm ? 'CONFIRM_SELECTION' : 'REQUEST_LINK'
        const status = isConfirm ? 'SELECTION_CONFIRMED' : 'AWAITING_UPLOAD'
        const clientData = (ctx.alboomSelectionData as string) || (ctx.alboomRequestData as string) || ctx.clientName || 'Não informado'

        const daysPassed = calculateBusinessDays(s.updatedAt, new Date())
        const daysRemaining = Math.max(0, slaDays - daysPassed)

        alboom.push({
          remoteJid: s.remoteJid,
          senderName: s.senderName,
          type,
          clientData,
          status,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          businessDaysPassed: daysPassed,
          businessDaysRemaining: daysRemaining,
          slaDays,
          isOverdue: isConfirm && daysPassed > slaDays
        })
      }

      // Sacramental requests
      if (ctx.sacramentalData || ctx.selectedMenu === 'SACRAMENTAL' || ctx.studentName || ctx.churchName) {
        sacramental.push({
          remoteJid: s.remoteJid,
          senderName: s.senderName,
          details: (ctx.sacramentalData as string) || 'Aguardando envio dos detalhes',
          studentName: ctx.studentName as string | undefined,
          churchName: ctx.churchName as string | undefined,
          eventYear: ctx.eventYear as string | undefined,
          status: 'PENDING_RETRIEVAL',
          createdAt: s.createdAt,
          updatedAt: s.updatedAt
        })
      }
    }

    return {
      personalPrints,
      alboom,
      sacramental
    }
  }
}

export const sessionRepository = new SessionRepository()
