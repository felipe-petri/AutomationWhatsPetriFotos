import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import { PromptEngine } from '../../core/prompts/prompt.engine.js'
import { AppError } from '../../core/errors/index.js'

export type FlowNodeType =
  | 'ROOT_MENU'
  | 'SUBMENU'
  | 'INFO_RESPONSE'
  | 'COLLECT_INPUT'
  | 'PIX_PAYMENT'
  | 'HUMAN_TRANSFER'
  | 'CUSTOM_QA'

export interface FlowOption {
  id: string
  trigger: string
  label: string
  targetNodeId: string
  description?: string
}

export interface FlowNode {
  id: string
  parentId?: string
  title: string
  category: 'Geral' | 'Documentos' | 'Catálogos' | 'Revelação' | 'Estúdio' | 'Alboom' | 'Sacramental' | 'Atendimento' | 'Personalizado' | string
  type: FlowNodeType
  state: string
  triggerDescription: string
  messageKey?: string
  messageText: string
  options: FlowOption[]
  slaNotice?: string
  icon: string
  isCustom?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface FlowEdge {
  id: string
  from: string
  to: string
  trigger: string
  label: string
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CUSTOM_NODES_FILE = path.resolve(__dirname, '../../config/custom-flow-nodes.json')
const DELETED_NODES_FILE = path.resolve(__dirname, '../../config/deleted-flow-nodes.json')

export class FlowchartService {
  private customNodes: FlowNode[] = []
  private deletedBaseNodeIds: string[] = []

  constructor() {
    this.loadCustomNodes()
    this.loadDeletedBaseNodes()
  }

  private loadDeletedBaseNodes(): void {
    try {
      if (fs.existsSync(DELETED_NODES_FILE)) {
        const raw = fs.readFileSync(DELETED_NODES_FILE, 'utf-8')
        this.deletedBaseNodeIds = JSON.parse(raw)
      } else {
        this.deletedBaseNodeIds = []
      }
    } catch {
      this.deletedBaseNodeIds = []
    }
  }

  private saveDeletedBaseNodes(): void {
    try {
      const dir = path.dirname(DELETED_NODES_FILE)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(DELETED_NODES_FILE, JSON.stringify(this.deletedBaseNodeIds, null, 2), 'utf-8')
    } catch (err: any) {
      console.error('Falha ao salvar deleted-flow-nodes.json:', err.message)
    }
  }

  private loadCustomNodes(): void {
    try {
      if (fs.existsSync(CUSTOM_NODES_FILE)) {
        const raw = fs.readFileSync(CUSTOM_NODES_FILE, 'utf-8')
        this.customNodes = JSON.parse(raw)
      } else {
        this.customNodes = []
      }
    } catch {
      this.customNodes = []
    }
  }

  private saveCustomNodes(): void {
    try {
      const dir = path.dirname(CUSTOM_NODES_FILE)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(CUSTOM_NODES_FILE, JSON.stringify(this.customNodes, null, 2), 'utf-8')
    } catch (err: any) {
      console.error('Falha ao salvar custom-flow-nodes.json:', err.message)
    }
  }

  public getFlowchart(): { nodes: FlowNode[]; edges: FlowEdge[] } {
    const messages = PromptEngine.getAll()

    // Nós base da árvore de conversa
    const baseNodes: FlowNode[] = [
      {
        id: 'node-main-menu',
        title: 'Boas-Vindas & Menu Principal',
        category: 'Geral',
        type: 'ROOT_MENU',
        state: 'MAIN_MENU',
        triggerDescription: 'Primeira mensagem do cliente (ex: "Oi", "Olá", "Boa tarde")',
        messageKey: 'main_menu.welcome',
        messageText: messages.main_menu?.welcome || '',
        icon: 'home',
        options: [
          { id: 'opt-1', trigger: '1', label: '1 - Fotos para Documento', targetNodeId: 'node-document-photos' },
          { id: 'opt-2', trigger: '2', label: '2 - Catálogos de Ensaios (PDF)', targetNodeId: 'node-catalogs-menu' },
          { id: 'opt-3', trigger: '3', label: '3 - Revelação de Fotos Pessoais', targetNodeId: 'node-personal-prints' },
          { id: 'opt-4', trigger: '4', label: '4 - Ensaios no Estúdio', targetNodeId: 'node-studio-sessions' },
          { id: 'opt-5', trigger: '5', label: '5 - Galeria Alboom (Link/Escolha)', targetNodeId: 'node-alboom-menu' },
          { id: 'opt-6', trigger: '6', label: '6 - Crisma e 1ª Comunhão', targetNodeId: 'node-sacramental' },
          { id: 'opt-0', trigger: '0', label: '0 - Falar com Atendente', targetNodeId: 'node-human-attendance' }
        ]
      },
      {
        id: 'node-document-photos',
        title: 'Fotos para Documento (3x4, 5x5)',
        category: 'Documentos',
        type: 'INFO_RESPONSE',
        state: 'DOCUMENT_PHOTOS',
        triggerDescription: 'Opção 1 ou palavras-chave ("3x4", "documento", "visto")',
        messageKey: 'document_photos.text',
        messageText: messages.document_photos?.text || '',
        slaNotice: 'Presencial • Ordem de chegada • Pagamento no balcão (R$ 30,00)',
        icon: 'camera',
        options: [
          { id: 'opt-doc-return', trigger: '0', label: '0 - Dúvidas ou Localização', targetNodeId: 'node-human-attendance' }
        ]
      },
      {
        id: 'node-catalogs-menu',
        title: 'Catálogos e Orçamentos em PDF',
        category: 'Catálogos',
        type: 'SUBMENU',
        state: 'CATALOGS_MENU',
        triggerDescription: 'Opção 2 ou palavras-chave ("catálogo", "ensaio", "valores")',
        messageKey: 'catalogs.menu',
        messageText: messages.catalogs?.menu || '',
        icon: 'file-text',
        options: [
          { id: 'opt-cat-1', trigger: '1', label: '1 - Maternidade & Bebê', targetNodeId: 'node-catalog-maternidade' },
          { id: 'opt-cat-2', trigger: '2', label: '2 - Comemorações (15 anos/Infantil)', targetNodeId: 'node-catalog-comemoracoes' },
          { id: 'opt-cat-3', trigger: '3', label: '3 - Estúdio & Carreira', targetNodeId: 'node-catalog-estudio' },
          { id: 'opt-cat-0', trigger: '0', label: '0 - Voltar ao Menu Principal', targetNodeId: 'node-main-menu' }
        ]
      },
      {
        id: 'node-catalog-maternidade',
        title: 'Envio PDF: Maternidade & Bebê',
        category: 'Catálogos',
        type: 'INFO_RESPONSE',
        state: 'IDLE',
        triggerDescription: 'Opção 1 no submenu de catálogos',
        messageText: 'Enviando catálogo em PDF: Gestante, Newborn, Acompanhamento e Revelação.',
        icon: 'baby',
        options: []
      },
      {
        id: 'node-catalog-comemoracoes',
        title: 'Envio PDF: Comemorações',
        category: 'Catálogos',
        type: 'INFO_RESPONSE',
        state: 'IDLE',
        triggerDescription: 'Opção 2 no submenu de catálogos',
        messageText: 'Enviando catálogo em PDF: Aniversário Infantil, 15 Anos e Batizado.',
        icon: 'cake',
        options: []
      },
      {
        id: 'node-catalog-estudio',
        title: 'Envio PDF: Estúdio & Carreira',
        category: 'Catálogos',
        type: 'INFO_RESPONSE',
        state: 'IDLE',
        triggerDescription: 'Opção 3 no submenu de catálogos',
        messageText: 'Enviando catálogo em PDF: Família, Formatura e Perfil Profissional.',
        icon: 'briefcase',
        options: []
      },
      {
        id: 'node-personal-prints',
        title: 'Instruções para Revelação de Fotos',
        category: 'Revelação',
        type: 'COLLECT_INPUT',
        state: 'PERSONAL_PRINTS_WAITING_MEDIA',
        triggerDescription: 'Opção 3 ou palavras-chave ("revelar", "imprimir foto")',
        messageKey: 'personal_prints.instructions',
        messageText: messages.personal_prints?.instructions || '',
        icon: 'printer',
        options: [
          { id: 'opt-print-pix', trigger: 'Envio de Fotos e Tamanho', label: 'Cálculo de Lote & Pix Copia e Cola', targetNodeId: 'node-personal-prints-pix' }
        ]
      },
      {
        id: 'node-personal-prints-pix',
        title: 'Orçamento & Pix Copia e Cola',
        category: 'Revelação',
        type: 'PIX_PAYMENT',
        state: 'PERSONAL_PRINTS_WAITING_SIZE',
        triggerDescription: 'Após envio das fotos e dimensão desejada',
        messageKey: 'personal_prints.quote_and_pix',
        messageText: messages.personal_prints?.quote_and_pix || '',
        slaNotice: 'Pix obrigatório antes de mandar para laboratório',
        icon: 'qr-code',
        options: []
      },
      {
        id: 'node-studio-sessions',
        title: 'Informações de Ensaios no Estúdio',
        category: 'Estúdio',
        type: 'INFO_RESPONSE',
        state: 'STUDIO_SESSIONS',
        triggerDescription: 'Opção 4 ou "estúdio"',
        messageKey: 'studio_sessions.info',
        messageText: messages.studio_sessions?.info || '',
        icon: 'building',
        options: [
          { id: 'opt-studio-human', trigger: '0', label: '0 - Falar com Produtora', targetNodeId: 'node-human-attendance' }
        ]
      },
      {
        id: 'node-alboom-menu',
        title: 'Menu de Opções Galeria Alboom',
        category: 'Alboom',
        type: 'SUBMENU',
        state: 'ALBOOM_MENU',
        triggerDescription: 'Opção 5 ou "alboom"',
        messageKey: 'alboom.menu',
        messageText: messages.alboom?.menu || '',
        icon: 'grid',
        options: [
          { id: 'opt-alboom-link', trigger: '1', label: '1 - Solicitar Link da Galeria', targetNodeId: 'node-alboom-ask-info' },
          { id: 'opt-alboom-confirm', trigger: '2', label: '2 - Confirmar Escolha de Fotos', targetNodeId: 'node-alboom-ask-confirm' },
          { id: 'opt-alboom-0', trigger: '0', label: '0 - Voltar ao Menu Principal', targetNodeId: 'node-main-menu' }
        ]
      },
      {
        id: 'node-alboom-ask-info',
        title: 'Alboom: Coleta Nome & Data',
        category: 'Alboom',
        type: 'COLLECT_INPUT',
        state: 'ALBOOM_AWAITING_REQUEST_DATA',
        triggerDescription: 'Opção 1 no menu do Alboom',
        messageKey: 'alboom.ask_client_info',
        messageText: messages.alboom?.ask_client_info || '',
        icon: 'user-plus',
        options: [
          { id: 'opt-alboom-link-done', trigger: 'Envio de Nome e Data', label: 'Aviso de SLA (Algumas Horas)', targetNodeId: 'node-alboom-wait-hours' }
        ]
      },
      {
        id: 'node-alboom-wait-hours',
        title: 'Alboom: SLA de Upload (Horas)',
        category: 'Alboom',
        type: 'INFO_RESPONSE',
        state: 'IDLE',
        triggerDescription: 'Após envio dos dados pelo cliente',
        messageKey: 'alboom.wait_hours_notice',
        messageText: messages.alboom?.wait_hours_notice || '',
        slaNotice: 'Aviso de que equipe precisa de algumas horas para subir as fotos',
        icon: 'clock',
        options: []
      },
      {
        id: 'node-alboom-ask-confirm',
        title: 'Alboom: Coleta de Titular para Produção',
        category: 'Alboom',
        type: 'COLLECT_INPUT',
        state: 'ALBOOM_AWAITING_SELECTION_CONFIRM',
        triggerDescription: 'Opção 2 no menu do Alboom',
        messageKey: 'alboom.ask_selection_client_name',
        messageText: messages.alboom?.ask_selection_client_name || '',
        icon: 'check-square',
        options: [
          { id: 'opt-alboom-confirm-done', trigger: 'Envio de Nome do Titular', label: 'Confirmação e SLA 10 Dias Úteis', targetNodeId: 'node-alboom-confirmed' }
        ]
      },
      {
        id: 'node-alboom-confirmed',
        title: 'Alboom: Prazo de Produção (10 Dias Úteis)',
        category: 'Alboom',
        type: 'INFO_RESPONSE',
        state: 'IDLE',
        triggerDescription: 'Após confirmação do titular do ensaio',
        messageKey: 'alboom.confirmation_notice',
        messageText: messages.alboom?.confirmation_notice || '',
        slaNotice: `Prazo contratual de até ${messages.alboom?.production_days_sla || 10} dias úteis`,
        icon: 'check-circle-2',
        options: []
      },
      {
        id: 'node-sacramental',
        title: 'Fotos Sacramentais (Crisma / Comunhão)',
        category: 'Sacramental',
        type: 'COLLECT_INPUT',
        state: 'SACRAMENTAL_AWAITING_DATA',
        triggerDescription: 'Opção 6 ou "comunhão", "crisma"',
        messageKey: 'sacramental.prepaid_notice',
        messageText: messages.sacramental?.prepaid_notice || '',
        slaNotice: 'Serviço previamente quitado na cerimônia (sem cobrança)',
        icon: 'shield-check',
        options: [
          { id: 'opt-sacramental-done', trigger: 'Envio de Dados (Nome/Paróquia/Ano)', label: 'Aviso de Checagem no Acervo', targetNodeId: 'node-sacramental-received' }
        ]
      },
      {
        id: 'node-sacramental-received',
        title: 'Sacramental: Confirmação de Acervo',
        category: 'Sacramental',
        type: 'INFO_RESPONSE',
        state: 'IDLE',
        triggerDescription: 'Após envio dos dados da cerimônia',
        messageKey: 'sacramental.received_notice',
        messageText: messages.sacramental?.received_notice || '',
        icon: 'check',
        options: []
      },
      {
        id: 'node-human-attendance',
        title: 'Transbordo Humano (Atendente)',
        category: 'Atendimento',
        type: 'HUMAN_TRANSFER',
        state: 'HUMAN_ATTENDANCE',
        triggerDescription: 'Comando "0", "atendente", "humano", "ajuda"',
        messageKey: 'human_attendance.direct_transfer',
        messageText: messages.human_attendance?.direct_transfer || '',
        slaNotice: 'Automação pausada. Atendimento transferido para a equipe.',
        icon: 'user-check',
        options: []
      },
      {
        id: 'node-fallback-error',
        title: 'Fallback Automático (2 Falhas Seguidas)',
        category: 'Atendimento',
        type: 'HUMAN_TRANSFER',
        state: 'HUMAN_ATTENDANCE',
        triggerDescription: 'Quando o cliente erra 2 vezes a opção do menu',
        messageKey: 'human_attendance.fallback_transfer',
        messageText: messages.human_attendance?.fallback_transfer || '',
        slaNotice: 'Transferência automática para atendente humano',
        icon: 'alert-triangle',
        options: []
      }
    ]

    // Filtra nós base que foram excluídos
    const activeBaseNodes = baseNodes.filter(n => !this.deletedBaseNodeIds.includes(n.id))
    const allNodes = [...activeBaseNodes, ...this.customNodes]

    // Gerar edges a partir das opções declaradas e conexões pai
    const edges: FlowEdge[] = []
    allNodes.forEach(node => {
      node.options.forEach(opt => {
        const isTargetActive = allNodes.some(n => n.id === opt.targetNodeId)
        edges.push({
          id: `edge-${node.id}-${opt.id}`,
          from: node.id,
          to: isTargetActive ? opt.targetNodeId : 'node-main-menu',
          trigger: opt.trigger,
          label: opt.label
        })
      })

      // Se possui parentId declarado (em nós criados dinamicamente)
      if (node.parentId && node.parentId !== node.id) {
        const isParentActive = allNodes.some(n => n.id === node.parentId)
        const effectiveParent = isParentActive ? node.parentId : 'node-main-menu'
        edges.push({
          id: `edge-${effectiveParent}-${node.id}`,
          from: effectiveParent,
          to: node.id,
          trigger: node.triggerDescription || 'Opção',
          label: node.title
        })
      }
    })

    return { nodes: allNodes, edges }
  }

  public async updateNode(
    nodeId: string,
    data: {
      title?: string
      messageText?: string
      triggerDescription?: string
      options?: FlowOption[]
    }
  ): Promise<FlowNode> {
    const { nodes } = this.getFlowchart()
    const target = nodes.find(n => n.id === nodeId)
    if (!target) {
      throw new AppError(`Nó do fluxograma com ID '${nodeId}' não encontrado.`, 404)
    }

    // Se possui messageKey, salva diretamente no messages.json do PromptEngine
    if (target.messageKey && data.messageText !== undefined) {
      const messages = PromptEngine.getAll()
      const parts = target.messageKey.split('.')
      let current: any = messages
      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]]
      }
      current[parts[parts.length - 1]] = data.messageText
      await PromptEngine.save(messages)
      target.messageText = data.messageText
    }

    // Se for nó customizado, atualiza na lista customizada
    const customIndex = this.customNodes.findIndex(n => n.id === nodeId)
    if (customIndex !== -1) {
      this.customNodes[customIndex] = {
        ...this.customNodes[customIndex],
        ...data,
        updatedAt: new Date().toISOString()
      }
      this.saveCustomNodes()
      return this.customNodes[customIndex]
    }

    if (data.title) target.title = data.title
    if (data.triggerDescription) target.triggerDescription = data.triggerDescription
    if (data.options) target.options = data.options

    return target
  }

  public async createCustomNode(data: {
    id?: string
    parentId?: string
    title: string
    category: FlowNode['category']
    triggerDescription: string
    messageText: string
    options?: FlowOption[]
  }): Promise<FlowNode> {
    const rawId = (data.id && data.id.trim())
      ? data.id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-')
      : `node-${data.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
    const sanitizedId = rawId.startsWith('node-') ? rawId : `node-${rawId}`

    const newNode: FlowNode = {
      id: sanitizedId,
      parentId: data.parentId || 'node-main-menu',
      title: data.title,
      category: data.category || 'Personalizado',
      type: 'CUSTOM_QA',
      state: 'CUSTOM_QA',
      triggerDescription: data.triggerDescription,
      messageText: data.messageText,
      options: data.options || [],
      icon: 'message-circle',
      isCustom: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Se estava na lista de deletados, restaura
    const delIdx = this.deletedBaseNodeIds.indexOf(sanitizedId)
    if (delIdx !== -1) {
      this.deletedBaseNodeIds.splice(delIdx, 1)
      this.saveDeletedBaseNodes()
    }

    // Se já existia, atualiza; caso contrário adiciona
    const existingIdx = this.customNodes.findIndex(n => n.id === sanitizedId)
    if (existingIdx !== -1) {
      this.customNodes[existingIdx] = newNode
    } else {
      this.customNodes.push(newNode)
    }

    this.saveCustomNodes()

    // Sincroniza também no PromptEngine / messages.json sob custom_nodes
    try {
      const messages = PromptEngine.getAll() as any
      if (!messages.custom_nodes) messages.custom_nodes = {}
      messages.custom_nodes[sanitizedId] = {
        title: data.title,
        trigger: data.triggerDescription,
        message: data.messageText
      }
      await PromptEngine.save(messages)
    } catch (err: any) {
      console.warn('Falha ao sincronizar com messages.json:', err.message)
    }

    return newNode
  }

  public async deleteCustomNode(nodeId: string): Promise<void> {
    const PROTECTED_NODES = ['node-main-menu', 'node-human-attendance', 'node-fallback-error', 'trigger-start']
    if (PROTECTED_NODES.includes(nodeId)) {
      throw new AppError('Nós essenciais de sistema (Menu Principal e Transbordo Humano) são protegidos e não podem ser excluídos.', 400)
    }

    let removed = false

    const index = this.customNodes.findIndex(n => n.id === nodeId)
    if (index !== -1) {
      this.customNodes.splice(index, 1)
      this.saveCustomNodes()
      removed = true
    }

    // Se for nó base
    if (!removed) {
      if (!this.deletedBaseNodeIds.includes(nodeId)) {
        this.deletedBaseNodeIds.push(nodeId)
        this.saveDeletedBaseNodes()
        removed = true
      }
    }

    // Remove do messages.json se estava em custom_nodes
    try {
      const messages = PromptEngine.getAll() as any
      if (messages.custom_nodes && messages.custom_nodes[nodeId]) {
        delete messages.custom_nodes[nodeId]
        await PromptEngine.save(messages)
      }
    } catch {}

    if (!removed) {
      throw new AppError(`Nó com ID '${nodeId}' não encontrado.`, 404)
    }
  }
}

export const flowchartService = new FlowchartService()
