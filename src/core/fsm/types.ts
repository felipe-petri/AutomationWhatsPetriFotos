export type ConversationState =
  | 'IDLE'
  | 'MAIN_MENU'
  | 'DOCUMENT_PHOTOS'
  | 'CATALOGS_MENU'
  | 'CATALOGS_SUBMENU_INFANTIL'
  | 'CATALOGS_SUBMENU_NATAL'
  | 'PERSONAL_PRINTS_WAITING_MEDIA'
  | 'PERSONAL_PRINTS_WAITING_SIZE'
  | 'STUDIO_SESSIONS'
  | 'ALBOOM_MENU'
  | 'ALBOOM_AWAITING_REQUEST_DATA'
  | 'ALBOOM_AWAITING_SELECTION_CONFIRM'
  | 'SACRAMENTAL_AWAITING_DATA'
  | 'HUMAN_ATTENDANCE'

export interface SessionContext {
  lastMenuOption?: string
  photoCount?: number
  photoSize?: string
  clientName?: string
  sessionDate?: string
  churchName?: string
  studentName?: string
  eventYear?: string
  orderId?: string
  selectedMenu?: string
  catalogOption?: string
  catalogSubOption?: string
  [key: string]: unknown
}

export interface FSMTransitionInput {
  remoteJid: string
  senderName: string
  currentState: ConversationState
  contextData: SessionContext
  textInput: string
  rawPayload?: Record<string, unknown>
}

export interface MediaAttachment {
  url: string
  fileName?: string
  mimetype?: string
}

export interface FSMTransitionResult {
  nextState: ConversationState
  updatedContext: SessionContext
  replyMessage: string
  mediaAttachment?: MediaAttachment
}
