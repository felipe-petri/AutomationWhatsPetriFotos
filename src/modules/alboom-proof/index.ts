export const ALBOOM_PRODUCTION_SLA_DAYS = 10

export type AlboomRequestStatus = 'AWAITING_UPLOAD' | 'LINK_SENT' | 'SELECTION_CONFIRMED'

export interface AlboomRequest {
  id: string
  remoteJid: string
  clientName: string
  sessionApproxDate?: string
  status: AlboomRequestStatus
  createdAt: Date
  selectionConfirmedAt?: Date
  productionDeadlineAt?: Date
}
