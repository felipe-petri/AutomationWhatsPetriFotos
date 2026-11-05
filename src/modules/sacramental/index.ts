export interface SacramentalRequest {
  id: string
  remoteJid: string
  studentName: string
  churchName: string
  eventYear: string
  status: 'RECEIVED' | 'PROCESSING' | 'COMPLETED'
  createdAt: Date
}
