import { ConversationState, SessionContext } from '../../core/fsm/types.js'

export interface Session {
  remoteJid: string
  senderName: string
  currentState: ConversationState
  contextData: SessionContext
  errorCount: number
  createdAt: Date
  updatedAt: Date
}

export interface UpdateSessionDTO {
  currentState?: ConversationState
  contextData?: SessionContext
  errorCount?: number
  updatedAt?: Date
}

export interface ListSessionsOptions {
  page?: number
  limit?: number
  search?: string
  status?: string
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface SessionStats {
  totalSessions: number
  botSessions: number
  humanSessions: number
  pendingRequests: number
}

export interface PersonalPrintRequestItem {
  remoteJid: string
  senderName: string
  photoCount?: number
  photoSize?: string
  totalAmount?: number
  pixStatus: 'PENDING_PIX' | 'PAID'
  createdAt: Date
  updatedAt: Date
}

export interface AlboomRequestItem {
  remoteJid: string
  senderName: string
  type: 'REQUEST_LINK' | 'CONFIRM_SELECTION'
  clientData: string
  status: 'AWAITING_UPLOAD' | 'SELECTION_CONFIRMED'
  createdAt: Date
  updatedAt: Date
  businessDaysPassed: number
  businessDaysRemaining: number
  slaDays: number
  isOverdue: boolean
}

export interface SacramentalRequestItem {
  remoteJid: string
  senderName: string
  details: string
  studentName?: string
  churchName?: string
  eventYear?: string
  status: 'PENDING_RETRIEVAL' | 'RESOLVED'
  createdAt: Date
  updatedAt: Date
}

export interface RequestsQueueResult {
  personalPrints: PersonalPrintRequestItem[]
  alboom: AlboomRequestItem[]
  sacramental: SacramentalRequestItem[]
}
