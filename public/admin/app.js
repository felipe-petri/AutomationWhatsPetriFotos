/**
 * Petri Fotos • Dashboard Administrativo & Automação WhatsApp
 * Frontend Reativo Moderno (Padrão 2. Arquitetura e Stack)
 */

// Estado Global da Aplicação
const state = {
  currentMainTab: 'sessions',
  currentRequestsSubTab: 'prints',
  messages: null,
  originalMessages: null,
  sessions: [],
  pagination: {
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1
  },
  searchTerm: '',
  statusFilter: 'all',
  stats: {
    totalSessions: 0,
    botSessions: 0,
    humanSessions: 0,
    pendingRequests: 0
  },
  requests: {
    personalPrints: [],
    alboom: [],
    sacramental: []
  },
  // Conexões WhatsApp API
  whatsappInstances: [],
  activeQrInstanceId: null,
  qrRefreshCountdown: 25,
  qrCountdownInterval: null,
  qrStatusPollingInterval: null,
  // Gestão de Serviços & Links de Catálogos (UC-02)
  servicesCatalog: [],
  sectors: [],
  catalogsFilter: 'ALL',
  // Fluxograma Q&A
  flowchart: {
    nodes: [],
    edges: []
  },
  selectedFlowNodeId: null,
  flowCategoryFilter: 'Todos',
  flowSearchTerm: '',
  flowCanvas: {
    panX: 30,
    panY: 30,
    zoom: 0.85,
    isDragging: false,
    startX: 0,
    startY: 0,
    isFullscreen: false
  }
}

// ===================================================
// SISTEMA DE TOASTS
// ===================================================
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container')
  if (!container) return

  const toast = document.createElement('div')
  toast.className = `toast-enter pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border transition-all max-w-sm ${
    type === 'success'
      ? 'bg-emerald-600 text-white border-emerald-500'
      : type === 'error'
      ? 'bg-rose-600 text-white border-rose-500'
      : 'bg-slate-800 text-white border-slate-700'
  }`

  const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-triangle' : 'info'
  toast.innerHTML = `
    <i data-lucide="${iconName}" class="w-5 h-5 shrink-0"></i>
    <span class="flex-1">${escapeHtml(message)}</span>
  `

  container.appendChild(toast)
  if (window.lucide) {
    window.lucide.createIcons({ root: toast })
  }

  setTimeout(() => {
    toast.classList.remove('toast-enter')
    toast.classList.add('toast-exit')
    setTimeout(() => {
      toast.remove()
    }, 300)
  }, 3500)
}

// ===================================================
// TEMA ESCURO / CLARO
// ===================================================
function initTheme() {
  const saved = localStorage.getItem('petri-theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = saved ? saved === 'dark' : prefersDark

  setTheme(isDark)

  const toggleBtn = document.getElementById('btn-theme-toggle')
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const currentIsDark = document.documentElement.classList.contains('dark')
      setTheme(!currentIsDark)
    })
  }
}

function setTheme(isDark) {
  const root = document.documentElement
  const sunIcon = document.getElementById('theme-icon-sun')
  const moonIcon = document.getElementById('theme-icon-moon')

  if (isDark) {
    root.classList.add('dark')
    localStorage.setItem('petri-theme', 'dark')
    if (sunIcon) sunIcon.classList.remove('hidden')
    if (moonIcon) moonIcon.classList.add('hidden')
  } else {
    root.classList.remove('dark')
    localStorage.setItem('petri-theme', 'light')
    if (sunIcon) sunIcon.classList.add('hidden')
    if (moonIcon) moonIcon.classList.remove('hidden')
  }

  if (window.lucide) {
    window.lucide.createIcons()
  }
}

// ===================================================
// NAVEGAÇÃO ENTRE ABAS
// ===================================================
function switchMainTab(tab) {
  state.currentMainTab = tab

  const tabs = ['sessions', 'flowchart', 'whatsapp', 'messages', 'requests', 'catalogs']
  tabs.forEach(t => {
    const btn = document.getElementById(`tab-btn-${t}`)
    const content = document.getElementById(`tab-content-${t}`)
    if (btn && content) {
      if (t === tab) {
        btn.className = 'tab-button active flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 shrink-0'
        content.classList.remove('hidden')
      } else {
        btn.className = 'tab-button flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 shrink-0'
        content.classList.add('hidden')
      }
    }
  })

  if (tab === 'sessions') {
    loadSessions()
    loadStats()
  } else if (tab === 'flowchart') {
    loadFlowchart()
  } else if (tab === 'whatsapp') {
    loadWhatsAppInstances()
  } else if (tab === 'messages') {
    loadMessages()
  } else if (tab === 'requests') {
    loadRequests()
  } else if (tab === 'catalogs') {
    loadCatalogs()
  }

  if (window.lucide) {
    window.lucide.createIcons()
  }
}

function switchRequestsSubTab(subTab) {
  state.currentRequestsSubTab = subTab

  const subTabs = ['prints', 'alboom', 'sacramental']
  subTabs.forEach(st => {
    const btn = document.getElementById(`subtab-btn-${st}`)
    const content = document.getElementById(`subtab-content-${st}`)
    if (btn && content) {
      if (st === subTab) {
        btn.className = 'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
        content.classList.remove('hidden')
      } else {
        btn.className = 'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
        content.classList.add('hidden')
      }
    }
  })

  if (window.lucide) {
    window.lucide.createIcons()
  }
}

// ===================================================
// LIVE PREVIEW DO WHATSAPP
// ===================================================
function updateLivePreview(text) {
  const container = document.getElementById('whatsapp-live-preview-content')
  if (!container) return

  if (!text || !text.trim()) {
    container.innerHTML = '<em>Mensagem vazia</em>'
    return
  }

  container.innerHTML = formatWhatsAppText(text)
}

function updateFlowchartSimulatorPreview(text) {
  const bubble = document.getElementById('flowchart-sim-bubble')
  if (!bubble) return

  if (!text || !text.trim()) {
    bubble.innerHTML = '<em>Selecione um nó do fluxograma...</em>'
    return
  }

  bubble.innerHTML = formatWhatsAppText(text)
}

function formatWhatsAppText(text) {
  let formatted = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Negrito: *texto*
  formatted = formatted.replace(/\*([^\*]+)\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>')
  // Itálico: _texto_
  formatted = formatted.replace(/_([^_]+)_/g, '<em>$1</em>')
  // Código mono: `codigo`
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-[11px] font-mono">$1</code>')
  // Quebras de linha
  formatted = formatted.replace(/\n/g, '<br>')

  return formatted
}

// =========================================================================
// CRUD DA API DO WHATSAPP (INSTÂNCIAS, QR CODE, PING & ATIVAÇÃO)
// =========================================================================
async function loadWhatsAppInstances() {
  const grid = document.getElementById('whatsapp-instances-grid')
  if (!grid) return

  try {
    const res = await fetch('/api/admin/whatsapp-instances')
    const json = await res.json()
    if (!json.success) throw new Error(json.message || 'Falha ao buscar instâncias')

    state.whatsappInstances = json.data || []
    renderWhatsAppInstances()
  } catch (err) {
    grid.innerHTML = `
      <div class="col-span-full p-6 text-center text-rose-500 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200">
        Erro ao carregar instâncias da API: ${escapeHtml(err.message)}
      </div>
    `
  }
}

function renderWhatsAppInstances() {
  const grid = document.getElementById('whatsapp-instances-grid')
  if (!grid) return

  const instances = state.whatsappInstances
  document.getElementById('stat-wa-total').textContent = instances.length

  const activeInstance = instances.find(item => item.isDefault)
  const activeNameSpan = document.getElementById('stat-wa-active-name')
  if (activeNameSpan) {
    activeNameSpan.textContent = activeInstance ? activeInstance.name : 'Nenhuma'
    activeNameSpan.title = activeInstance ? activeInstance.name : ''
  }

  if (instances.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
        <i data-lucide="smartphone" class="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600"></i>
        <h4 class="font-bold text-slate-700 dark:text-slate-200">Nenhuma Conexão WhatsApp Configurada</h4>
        <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Cadastre uma nova conexão para integrar o estúdio com a Evolution API e conectar o WhatsApp da Petri Fotos.</p>
        <button onclick="openCreateWhatsAppModal()" class="mt-4 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg inline-flex items-center gap-1.5 shadow-sm">
          <i data-lucide="plus" class="w-4 h-4"></i>
          <span>Cadastrar Conexão</span>
        </button>
      </div>
    `
    if (window.lucide) window.lucide.createIcons({ root: grid })
    return
  }

  grid.innerHTML = instances.map(inst => {
    let statusBadge = ''
    if (inst.status === 'CONNECTED') {
      statusBadge = `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          <span class="w-2 h-2 rounded-full bg-emerald-500 status-pulse"></span>
          CONECTADO
        </span>
      `
    } else if (inst.status === 'QR_CODE') {
      statusBadge = `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
          <span class="w-2 h-2 rounded-full bg-amber-500"></span>
          AGUARDANDO QR CODE
        </span>
      `
    } else if (inst.status === 'CONNECTING') {
      statusBadge = `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
          <span class="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
          CONECTANDO
        </span>
      `
    } else {
      statusBadge = `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
          <span class="w-2 h-2 rounded-full bg-rose-500"></span>
          DESCONECTADO
        </span>
      `
    }

    const defaultBadge = inst.isDefault
      ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700"><i data-lucide="star" class="w-3 h-3 fill-current text-blue-600"></i> ATIVA</span>`
      : ''

    const lastChecked = inst.lastCheckedAt ? formatTimeAgo(inst.lastCheckedAt) : 'Nunca verificado'

    return `
      <div class="bg-white dark:bg-slate-800 rounded-2xl border ${inst.isDefault ? 'border-blue-400 dark:border-blue-600 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-slate-700'} p-5 shadow-sm space-y-4 hover:shadow-md transition">
        <!-- Topo do Card -->
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="font-bold text-slate-900 dark:text-white text-base truncate" title="${escapeHtml(inst.name)}">${escapeHtml(inst.name)}</h3>
              ${defaultBadge}
            </div>
            <p class="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">Instância: <strong>${escapeHtml(inst.instanceName)}</strong></p>
          </div>
          <div>
            ${statusBadge}
          </div>
        </div>

        <!-- Dados de Conexão -->
        <div class="bg-slate-50 dark:bg-slate-700/40 p-3 rounded-xl border border-slate-100 dark:border-slate-700 space-y-1.5 text-xs">
          <div class="flex items-center justify-between">
            <span class="text-slate-500 dark:text-slate-400">Servidor API:</span>
            <span class="font-mono text-slate-700 dark:text-slate-200 truncate max-w-[170px]" title="${escapeHtml(inst.apiUrl)}">${escapeHtml(inst.apiUrl)}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-500 dark:text-slate-400">Webhook:</span>
            <span class="font-mono text-slate-700 dark:text-slate-200 truncate max-w-[170px]" title="${escapeHtml(inst.webhookUrl || 'Não configurado')}">${escapeHtml(inst.webhookUrl || 'Padrão')}</span>
          </div>
          <div class="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-600/60 text-[11px]">
            <span class="text-slate-400">Última checagem:</span>
            <span class="text-slate-500 dark:text-slate-400 font-medium">${lastChecked}</span>
          </div>
        </div>

        ${inst.lastError ? `<p class="text-[11px] text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-200/60 truncate" title="${escapeHtml(inst.lastError)}">⚠️ ${escapeHtml(inst.lastError)}</p>` : ''}

        <!-- Ações do Card -->
        <div class="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700 text-xs">
          <button onclick="openQrCodeModal('${inst.id}')" class="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition">
            <i data-lucide="qr-code" class="w-3.5 h-3.5"></i>
            <span>QR Code</span>
          </button>

          <button onclick="testWhatsAppConnection('${inst.id}')" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition" title="Testar Conexão">
            <i data-lucide="activity" class="w-3.5 h-3.5 text-blue-500"></i>
            <span>Testar</span>
          </button>

          ${
            !inst.isDefault
              ? `
                <button onclick="setActiveWhatsAppInstance('${inst.id}')" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-medium transition" title="Tornar Padrão">
                  <i data-lucide="star" class="w-3.5 h-3.5"></i>
                  <span>Ativar</span>
                </button>
              `
              : ''
          }

          <button onclick="openEditWhatsAppModal('${inst.id}')" class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-300 transition" title="Editar">
            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
          </button>

          <button onclick="handleDeleteWhatsAppInstance('${inst.id}', '${escapeHtml(inst.name)}')" class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-rose-50 hover:border-rose-300 text-slate-400 hover:text-rose-600 transition" title="Excluir">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `
  }).join('')

  if (window.lucide) {
    window.lucide.createIcons({ root: grid })
  }
}

function openCreateWhatsAppModal() {
  document.getElementById('whatsapp-modal-title').textContent = 'Nova Conexão WhatsApp API'
  document.getElementById('wa-form-id').value = ''
  document.getElementById('wa-form-name').value = ''
  document.getElementById('wa-form-instance').value = ''
  document.getElementById('wa-form-url').value = 'http://localhost:8080'
  document.getElementById('wa-form-key').value = ''
  document.getElementById('wa-form-webhook').value = ''
  document.getElementById('wa-form-secret').value = ''
  document.getElementById('wa-form-default').checked = false

  document.getElementById('whatsapp-modal').classList.remove('hidden')
  if (window.lucide) window.lucide.createIcons()
}

function openEditWhatsAppModal(id) {
  const instance = state.whatsappInstances.find(item => item.id === id)
  if (!instance) return

  document.getElementById('whatsapp-modal-title').textContent = 'Editar Conexão WhatsApp API'
  document.getElementById('wa-form-id').value = instance.id
  document.getElementById('wa-form-name').value = instance.name
  document.getElementById('wa-form-instance').value = instance.instanceName
  document.getElementById('wa-form-url').value = instance.apiUrl
  document.getElementById('wa-form-key').value = instance.apiKey
  document.getElementById('wa-form-webhook').value = instance.webhookUrl || ''
  document.getElementById('wa-form-secret').value = instance.webhookSecret || ''
  document.getElementById('wa-form-default').checked = instance.isDefault

  document.getElementById('whatsapp-modal').classList.remove('hidden')
  if (window.lucide) window.lucide.createIcons()
}

function closeWhatsAppModal() {
  document.getElementById('whatsapp-modal').classList.add('hidden')
}

async function handleSaveWhatsAppInstance(event) {
  event.preventDefault()
  const saveBtn = document.getElementById('btn-save-wa')
  if (saveBtn) saveBtn.disabled = true

  const id = document.getElementById('wa-form-id').value.trim()
  const payload = {
    name: document.getElementById('wa-form-name').value.trim(),
    instanceName: document.getElementById('wa-form-instance').value.trim(),
    apiUrl: document.getElementById('wa-form-url').value.trim(),
    apiKey: document.getElementById('wa-form-key').value.trim(),
    webhookUrl: document.getElementById('wa-form-webhook').value.trim() || undefined,
    webhookSecret: document.getElementById('wa-form-secret').value.trim() || undefined,
    isDefault: document.getElementById('wa-form-default').checked
  }

  try {
    const isEdit = Boolean(id)
    const url = isEdit ? `/api/admin/whatsapp-instances/${id}` : '/api/admin/whatsapp-instances'
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const json = await res.json()
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Erro ao salvar conexão')
    }

    showToast(isEdit ? 'Conexão atualizada com sucesso!' : 'Nova conexão WhatsApp cadastrada!', 'success')
    closeWhatsAppModal()
    loadWhatsAppInstances()
  } catch (err) {
    showToast(`Erro ao salvar: ${err.message}`, 'error')
  } finally {
    if (saveBtn) saveBtn.disabled = false
  }
}

async function handleDeleteWhatsAppInstance(id, name) {
  if (!confirm(`Tem certeza que deseja remover a conexão '${name}'?`)) return

  try {
    const res = await fetch(`/api/admin/whatsapp-instances/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Erro ao excluir conexão')
    }

    showToast('Conexão removida com sucesso.', 'info')
    loadWhatsAppInstances()
  } catch (err) {
    showToast(`Erro ao excluir: ${err.message}`, 'error')
  }
}

async function testWhatsAppConnection(id) {
  try {
    showToast('Verificando status na Evolution API...', 'info')
    const res = await fetch(`/api/admin/whatsapp-instances/${id}/test`, { method: 'POST' })
    const json = await res.json()

    if (json.success && json.data) {
      const data = json.data
      const type = data.status === 'CONNECTED' ? 'success' : 'info'
      showToast(`${data.message} (${data.latencyMs}ms)`, type)
    } else {
      showToast(json.message || 'Falha ao testar conexão', 'error')
    }
    loadWhatsAppInstances()
  } catch (err) {
    showToast(`Falha no teste: ${err.message}`, 'error')
  }
}

async function testAllWhatsAppInstances() {
  showToast('Testando todas as conexões cadastradas...', 'info')
  for (const inst of state.whatsappInstances) {
    await fetch(`/api/admin/whatsapp-instances/${inst.id}/test`, { method: 'POST' }).catch(() => {})
  }
  loadWhatsAppInstances()
  showToast('Diagnóstico das conexões concluído!', 'success')
}

async function setActiveWhatsAppInstance(id) {
  try {
    const res = await fetch(`/api/admin/whatsapp-instances/${id}/activate`, { method: 'POST' })
    const json = await res.json()
    if (!res.ok || !json.success) throw new Error(json.message || 'Erro ao ativar instância')

    showToast(json.message, 'success')
    loadWhatsAppInstances()
  } catch (err) {
    showToast(`Erro ao definir como ativa: ${err.message}`, 'error')
  }
}

function stopQrTimers() {
  if (state.qrCountdownInterval) {
    clearInterval(state.qrCountdownInterval)
    state.qrCountdownInterval = null
  }
  if (state.qrStatusPollingInterval) {
    clearInterval(state.qrStatusPollingInterval)
    state.qrStatusPollingInterval = null
  }
}

async function disconnectWhatsApp() {
  if (!confirm('Deseja realmente desconectar a sessão do WhatsApp?')) return

  try {
    const res = await fetch('/api/admin/whatsapp/disconnect', { method: 'POST' })
    const json = await res.json()
    if (json.success) {
      showToast(json.message || 'WhatsApp desconectado com sucesso.', 'info')
      loadWhatsAppInstances()
    }
  } catch (err) {
    showToast(`Erro ao desconectar: ${err.message}`, 'error')
  }
}

async function openQrCodeModal(id) {
  state.activeQrInstanceId = id || 'inst-default-petri'
  stopQrTimers()

  const modal = document.getElementById('qrcode-modal')
  const qrImg = document.getElementById('qrcode-image')
  const subtitle = document.getElementById('qrcode-instance-subtitle')
  const pairingCodeText = document.getElementById('pairing-code-text')
  const loadingState = document.getElementById('qrcode-loading-state')
  const errorState = document.getElementById('qrcode-error-state')
  const timerBadge = document.getElementById('qrcode-timer-badge')

  const instance = state.whatsappInstances.find(item => item.id === state.activeQrInstanceId)
  if (subtitle) {
    subtitle.textContent = instance ? `${instance.name} • Baileys Nativo` : 'Conexão Nativa Baileys'
  }

  // Prepara estados visuais
  if (loadingState) loadingState.classList.remove('hidden')
  if (qrImg) {
    qrImg.classList.add('hidden')
    qrImg.src = ''
  }
  if (errorState) errorState.classList.add('hidden')
  if (pairingCodeText) pairingCodeText.textContent = 'A carregar...'

  state.qrRefreshCountdown = 25
  if (timerBadge) timerBadge.textContent = 'Atualiza em 25s'

  modal.classList.remove('hidden')
  if (window.lucide) window.lucide.createIcons({ root: modal })

  // 1. Carrega o QR Code do Baileys nativo
  await refreshQrCodeModal()

  // 2. Temporizador para auto-refresh do QR Code a cada 25 segundos
  state.qrCountdownInterval = setInterval(() => {
    state.qrRefreshCountdown--
    if (timerBadge) {
      timerBadge.textContent = `Atualiza em ${state.qrRefreshCountdown}s`
    }
    if (state.qrRefreshCountdown <= 0) {
      state.qrRefreshCountdown = 25
      refreshQrCodeModal(true)
    }
  }, 1000)

  // 3. Polling automático a cada 3 segundos: assim que o status mudar para CONNECTED, fecha o modal
  state.qrStatusPollingInterval = setInterval(async () => {
    try {
      const res = await fetch('/api/admin/whatsapp/status')
      const json = await res.json()

      if (json.success && json.status === 'CONNECTED') {
        stopQrTimers()
        closeQrModal()
        showToast('WhatsApp conectado com sucesso!', 'success')
        loadWhatsAppInstances()
      }
    } catch {
      // Ignora falhas temporárias de rede no polling
    }
  }, 3000)
}

async function refreshQrCodeModal(isAuto = false) {
  const qrImg = document.getElementById('qrcode-image')
  const pairingCodeText = document.getElementById('pairing-code-text')
  const loadingState = document.getElementById('qrcode-loading-state')
  const errorState = document.getElementById('qrcode-error-state')
  const errorMessage = document.getElementById('qrcode-error-message')
  const timerBadge = document.getElementById('qrcode-timer-badge')

  // Reinicia contador para 25 segundos
  state.qrRefreshCountdown = 25
  if (timerBadge) timerBadge.textContent = 'Atualiza em 25s'

  // Mostra spinner de carregamento limpo
  if (loadingState) loadingState.classList.remove('hidden')
  if (qrImg) qrImg.classList.add('hidden')
  if (errorState) errorState.classList.add('hidden')

  try {
    // 1. Busca primeiro no endpoint local do Baileys
    let res = await fetch('/api/admin/whatsapp/qr')
    let json = await res.json()

    // Se já estiver conectado:
    if (json.status === 'CONNECTED') {
      stopQrTimers()
      closeQrModal()
      showToast('WhatsApp já conectado e operacional!', 'success')
      loadWhatsAppInstances()
      return
    }

    let qrcodeBase64 = json.qrcode
    let pairingCode = json.pairingCode

    // Fallback para rota de instâncias caso Baileys não retorne de imediato
    if (!qrcodeBase64 && state.activeQrInstanceId) {
      const instRes = await fetch(`/api/admin/whatsapp-instances/${state.activeQrInstanceId}/qrcode`)
      const instJson = await instRes.json()
      if (instJson.success && instJson.data) {
        qrcodeBase64 = instJson.data.qrcodeBase64
        pairingCode = instJson.data.pairingCode
      }
    }

    if (qrcodeBase64) {
      const formattedSrc = qrcodeBase64.startsWith('data:')
        ? qrcodeBase64
        : `data:image/png;base64,${qrcodeBase64}`

      if (qrImg) {
        qrImg.src = formattedSrc
        qrImg.classList.remove('hidden')
      }
      if (loadingState) loadingState.classList.add('hidden')
      if (errorState) errorState.classList.add('hidden')

      if (pairingCodeText) {
        pairingCodeText.textContent = pairingCode || 'Aguardando QR Code...'
      }

      if (!isAuto) {
        showToast('QR Code atualizado com sucesso.', 'info')
      }
    } else {
      throw new Error(json.message || 'QR Code ainda não disponível. Clique em Atualizar QR Code.')
    }
  } catch (err) {
    if (loadingState) loadingState.classList.add('hidden')
    if (qrImg) qrImg.classList.add('hidden')
    if (errorState) {
      errorState.classList.remove('hidden')
      if (errorMessage) {
        errorMessage.textContent = err.message || 'Falha ao comunicar com o serviço do WhatsApp.'
      }
    }
    if (!isAuto) {
      showToast(`Erro ao carregar QR Code: ${err.message}`, 'error')
    }
  }

  if (window.lucide) {
    window.lucide.createIcons({ root: document.getElementById('qrcode-modal') })
  }
}

function closeQrModal() {
  stopQrTimers()
  const modal = document.getElementById('qrcode-modal')
  if (modal) modal.classList.add('hidden')
  state.activeQrInstanceId = null
  loadWhatsAppInstances()
}

// =========================================================================
// =========================================================================
// FLUXOGRAMA INTERATIVO EM TELA ÚNICA (CANVAS SVG COM NAVEGAÇÃO DIRETA)
// =========================================================================

const FLOW_NODE_POSITIONS = {
  // Ponto de Entrada (Gatilho Receptivo)
  'trigger-start': { x: 40, y: 530 },
  // Menu Principal (Menu Raiz)
  'node-main-menu': { x: 430, y: 470 },
  // Ramificações Principais (Coluna 2, x = 880)
  'node-document-photos': { x: 880, y: 40 },
  'node-catalogs-menu': { x: 880, y: 240 },
  'node-personal-prints': { x: 880, y: 450 },
  'node-studio-sessions': { x: 880, y: 660 },
  'node-alboom-menu': { x: 880, y: 870 },
  'node-sacramental': { x: 880, y: 1080 },
  'node-human-attendance': { x: 880, y: 1290 },
  'node-fallback-error': { x: 880, y: 1490 },
  // Sub-níveis e Coletas (Coluna 3, x = 1320)
  'node-catalog-maternidade': { x: 1320, y: 130 },
  'node-catalog-comemoracoes': { x: 1320, y: 270 },
  'node-catalog-estudio': { x: 1320, y: 410 },
  'node-personal-prints-pix': { x: 1320, y: 550 },
  'node-alboom-ask-info': { x: 1320, y: 770 },
  'node-alboom-ask-confirm': { x: 1320, y: 970 },
  'node-sacramental-received': { x: 1320, y: 1160 },
  // Confirmações e SLAs Finais (Coluna 4, x = 1760)
  'node-alboom-wait-hours': { x: 1760, y: 770 },
  'node-alboom-confirmed': { x: 1760, y: 970 }
}

async function loadFlowchart() {
  const nodesContainer = document.getElementById('flowchart-nodes-layer')
  if (!nodesContainer) return

  try {
    const res = await fetch('/api/admin/flowchart')
    const json = await res.json()
    if (!json.success) throw new Error(json.message || 'Falha ao buscar fluxograma')

    state.flowchart = json.data || { nodes: [], edges: [] }

    // Atualiza contador de nós
    const countEl = document.getElementById('canvas-status-nodes-count')
    if (countEl) {
      countEl.textContent = `${state.flowchart.nodes?.length || 0} Nós Interligados`
    }

    renderFlowchart()
    setupCanvasInteractions()

    // Se nenhum nó selecionado ainda, seleciona o nó raiz de boas-vindas
    if (!state.selectedFlowNodeId && state.flowchart.nodes.length > 0) {
      selectFlowNode('node-main-menu')
    }
  } catch (err) {
    if (nodesContainer) {
      nodesContainer.innerHTML = `
        <div class="p-8 text-center text-rose-500 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 max-w-md mx-auto my-12">
          Erro ao carregar fluxograma: ${escapeHtml(err.message)}
        </div>
      `
    }
  }
}

function filterFlowchart(category) {
  state.flowCategoryFilter = category

  // Atualiza classes dos botões de filtro
  document.querySelectorAll('.flow-filter-pill').forEach(btn => {
    if (btn.textContent.includes(category) || (category === 'Todos' && btn.textContent.includes('Todos'))) {
      btn.className = 'flow-filter-pill active px-3 py-1 rounded-full border border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium'
    } else {
      btn.className = 'flow-filter-pill px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
    }
  })

  renderFlowchart()
}

// Controles de Visualização do Canvas (Pan, Zoom, Reset, Fit View)
function applyCanvasTransform() {
  const viewport = document.getElementById('flowchart-canvas-viewport')
  const label = document.getElementById('btn-canvas-zoom-label')
  if (!viewport) return

  viewport.style.transform = `translate(${state.flowCanvas.panX}px, ${state.flowCanvas.panY}px) scale(${state.flowCanvas.zoom})`
  if (label) {
    label.textContent = `${Math.round(state.flowCanvas.zoom * 100)}%`
  }
}

function canvasZoom(delta) {
  const newZoom = Math.min(2.0, Math.max(0.35, state.flowCanvas.zoom + delta))
  state.flowCanvas.zoom = parseFloat(newZoom.toFixed(2))
  applyCanvasTransform()
}

function canvasReset() {
  state.flowCanvas.panX = 30
  state.flowCanvas.panY = 30
  state.flowCanvas.zoom = 0.85
  applyCanvasTransform()
}

function canvasFitView() {
  const wrapper = document.getElementById('flowchart-canvas-wrapper')
  if (!wrapper) return
  const w = wrapper.clientWidth || 800
  const h = wrapper.clientHeight || 680

  const contentW = 2150
  const contentH = 1680

  const scaleX = w / contentW
  const scaleY = h / contentH
  const fitScale = Math.min(scaleX, scaleY, 0.95)

  state.flowCanvas.zoom = Math.max(0.35, parseFloat(fitScale.toFixed(2)))
  state.flowCanvas.panX = Math.round((w - contentW * state.flowCanvas.zoom) / 2)
  state.flowCanvas.panY = 20
  applyCanvasTransform()
}

function exitCanvasFullscreen() {
  const wrapper = document.getElementById('flowchart-canvas-wrapper')
  const btn = document.getElementById('btn-canvas-fullscreen')
  const exitBar = document.getElementById('flowchart-fullscreen-exit-bar')
  if (!wrapper) return

  state.flowCanvas.isFullscreen = false
  wrapper.classList.remove('is-fullscreen')
  if (exitBar) exitBar.classList.add('hidden')
  if (btn) btn.innerHTML = '<i data-lucide="expand" class="w-4 h-4"></i><span class="hidden sm:inline">Tela Cheia</span>'
  if (window.lucide && btn) window.lucide.createIcons({ root: btn })
  setTimeout(canvasFitView, 120)
}

function toggleCanvasFullscreen() {
  const wrapper = document.getElementById('flowchart-canvas-wrapper')
  const btn = document.getElementById('btn-canvas-fullscreen')
  const exitBar = document.getElementById('flowchart-fullscreen-exit-bar')
  if (!wrapper) return

  state.flowCanvas.isFullscreen = !state.flowCanvas.isFullscreen
  if (state.flowCanvas.isFullscreen) {
    wrapper.classList.add('is-fullscreen')
    if (exitBar) exitBar.classList.remove('hidden')
    if (btn) btn.innerHTML = '<i data-lucide="minimize-2" class="w-4 h-4"></i><span class="hidden sm:inline">Restaurar</span>'
  } else {
    wrapper.classList.remove('is-fullscreen')
    if (exitBar) exitBar.classList.add('hidden')
    if (btn) btn.innerHTML = '<i data-lucide="expand" class="w-4 h-4"></i><span class="hidden sm:inline">Tela Cheia</span>'
  }
  if (window.lucide && btn) window.lucide.createIcons({ root: btn })
  if (window.lucide && exitBar) window.lucide.createIcons({ root: exitBar })
  setTimeout(canvasFitView, 120)
}

function setupCanvasInteractions() {
  const wrapper = document.getElementById('flowchart-canvas-wrapper')
  if (!wrapper || wrapper._hasCanvasListeners) return
  wrapper._hasCanvasListeners = true

  // Listener para sair do modo tela cheia ao pressionar ESC
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && state.flowCanvas && state.flowCanvas.isFullscreen) {
      exitCanvasFullscreen()
    }
  })

  wrapper.addEventListener('mousedown', e => {
    // Não inicia drag se clicou em card ou botão
    if (e.target.closest('button, input, textarea, a, .flow-node-card, .flow-edge-badge')) return

    state.flowCanvas.isDragging = true
    state.flowCanvas.startX = e.clientX - state.flowCanvas.panX
    state.flowCanvas.startY = e.clientY - state.flowCanvas.panY
    wrapper.classList.add('is-dragging')
  })

  window.addEventListener('mousemove', e => {
    if (!state.flowCanvas.isDragging) return
    state.flowCanvas.panX = e.clientX - state.flowCanvas.startX
    state.flowCanvas.panY = e.clientY - state.flowCanvas.startY
    applyCanvasTransform()
  })

  window.addEventListener('mouseup', () => {
    if (state.flowCanvas.isDragging) {
      state.flowCanvas.isDragging = false
      wrapper.classList.remove('is-dragging')
    }
  })

  wrapper.addEventListener('wheel', e => {
    e.preventDefault()
    const zoomDelta = e.deltaY < 0 ? 0.08 : -0.08
    canvasZoom(zoomDelta)
  }, { passive: false })
}

// Renderização dos Nós e Conexões SVG na Lousa
function renderFlowchart() {
  const nodesContainer = document.getElementById('flowchart-nodes-layer')
  const pathsGroup = document.getElementById('flowchart-svg-paths')
  const labelsGroup = document.getElementById('flowchart-svg-labels')
  const svgEl = document.getElementById('flowchart-svg-layer')
  if (!nodesContainer || !pathsGroup || !labelsGroup || !svgEl) return

  let allNodes = [...(state.flowchart.nodes || [])]

  // Adiciona o nó inicial visual de Gatilho se não existir
  const hasStartTrigger = allNodes.some(n => n.id === 'trigger-start')
  if (!hasStartTrigger) {
    allNodes.unshift({
      id: 'trigger-start',
      title: 'Início (Gatilho Receptivo)',
      category: 'Geral',
      type: 'TRIGGER',
      state: 'IDLE',
      triggerDescription: 'Primeira mensagem recebida ("Oi", "Olá", "Valores")',
      messageText: 'Detecta a primeira mensagem do cliente e inicia o atendimento cordial direcionando para o menu com opções numeradas.',
      icon: 'zap',
      options: [
        { id: 'opt-start', trigger: 'Qualquer texto', label: 'Disparo de Boas-Vindas', targetNodeId: 'node-main-menu' }
      ]
    })
  }

  // Lista de edges (conecta início e fallback caso necessário)
  let allEdges = [...(state.flowchart.edges || [])]
  if (!allEdges.some(e => e.from === 'trigger-start')) {
    allEdges.unshift({
      id: 'edge-start-main',
      from: 'trigger-start',
      to: 'node-main-menu',
      trigger: 'Início',
      label: 'Mensagem do Cliente'
    })
  }
  if (!allEdges.some(e => e.from === 'node-fallback-error')) {
    allEdges.push({
      id: 'edge-fallback-human',
      from: 'node-fallback-error',
      to: 'node-human-attendance',
      trigger: '2 Erros',
      label: 'Transbordo Direto'
    })
  }

  // Filtro de Nós por Categoria
  let visibleNodes = allNodes
  if (state.flowCategoryFilter && state.flowCategoryFilter !== 'Todos') {
    visibleNodes = allNodes.filter(n => n.category === state.flowCategoryFilter || n.id === 'trigger-start' || n.id === 'node-main-menu')
  }

  // Filtro de Nós por Busca
  if (state.flowSearchTerm) {
    const term = state.flowSearchTerm.toLowerCase()
    visibleNodes = visibleNodes.filter(
      n =>
        n.title.toLowerCase().includes(term) ||
        (n.messageText && n.messageText.toLowerCase().includes(term)) ||
        (n.triggerDescription && n.triggerDescription.toLowerCase().includes(term))
    )
  }

  const visibleNodeIds = new Set(visibleNodes.map(n => n.id))

  // Dimensões do SVG Canvas
  svgEl.setAttribute('width', '2250')
  svgEl.setAttribute('height', '1750')

  // Renderiza nós no container
  nodesContainer.innerHTML = visibleNodes.map((node, idx) => {
    // Posição tabelada ou alinhada dinamicamente
    let coords = FLOW_NODE_POSITIONS[node.id]
    if (!coords) {
      coords = { x: 1320, y: 1300 + idx * 160 }
    }
    const isSelected = state.selectedFlowNodeId === node.id
    return renderFlowNodeCard(node, coords, isSelected)
  }).join('')

  // Renderiza conexões SVG
  let pathsHtml = ''
  let labelsHtml = ''

  allEdges.forEach(edge => {
    // Renderiza apenas se ambos os nós estiverem visíveis
    if (!visibleNodeIds.has(edge.from) || !visibleNodeIds.has(edge.to)) return

    const p1 = FLOW_NODE_POSITIONS[edge.from]
    const p2 = FLOW_NODE_POSITIONS[edge.to]
    if (!p1 || !p2) return

    const isConnectedToActive = state.selectedFlowNodeId === edge.from || state.selectedFlowNodeId === edge.to
    const { d, midX, midY } = computeEdgeCurve(p1, p2)
    const labelText = edge.label || `Se ${edge.trigger}`

    pathsHtml += `
      <path 
        id="edge-path-${edge.id}"
        class="flow-connector-path ${isConnectedToActive ? 'active' : ''}" 
        d="${d}" 
        marker-end="${isConnectedToActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}"
        data-from="${edge.from}"
        data-to="${edge.to}"
      />
    `

    // Badge com etiqueta do caminho
    const labelWidth = Math.max(76, labelText.length * 6.8 + 20)
    labelsHtml += `
      <g 
        class="flow-edge-badge" 
        data-from="${edge.from}" 
        data-to="${edge.to}"
        onclick="selectFlowNode('${edge.to}')"
        title="Transição: ${escapeHtml(labelText)}">
        <rect 
          x="${midX - labelWidth / 2}" 
          y="${midY - 11}" 
          width="${labelWidth}" 
          height="22" 
          rx="11" 
          class="fill-white dark:fill-slate-800 stroke-indigo-300 dark:stroke-indigo-800 shadow-sm" 
          stroke-width="1.2" 
        />
        <text 
          x="${midX}" 
          y="${midY + 4}" 
          text-anchor="middle" 
          class="fill-indigo-700 dark:fill-indigo-300 font-mono text-[10.5px] font-semibold select-none">
          ${escapeHtml(labelText)}
        </text>
      </g>
    `
  })

  pathsGroup.innerHTML = pathsHtml
  labelsGroup.innerHTML = labelsHtml

  applyCanvasTransform()

  if (window.lucide) {
    window.lucide.createIcons({ root: nodesContainer })
  }
}

// Cálculo da curva de Bézier cúbica ou ortogonal
function computeEdgeCurve(p1, p2) {
  const cardW = 320
  const cardH = 155

  // Se o destino estiver à direita
  if (p2.x >= p1.x + 80) {
    const startX = p1.x + cardW
    const startY = p1.y + cardH / 2
    const endX = p2.x
    const endY = p2.y + cardH / 2
    const dx = endX - startX
    const cp1x = startX + Math.max(50, dx * 0.45)
    const cp1y = startY
    const cp2x = endX - Math.max(50, dx * 0.45)
    const cp2y = endY
    const d = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`
    const midX = (startX + endX) / 2
    const midY = (startY + endY) / 2
    return { d, midX, midY }
  } else {
    // Retorno ao menu principal (curva de laço inferior)
    const startX = p1.x + cardW / 2
    const startY = p1.y + cardH
    const endX = p2.x + cardW / 2
    const endY = p2.y + cardH
    const drop = 70
    const d = `M ${startX} ${startY} C ${startX} ${startY + drop}, ${endX} ${endY + drop}, ${endX} ${endY}`
    const midX = (startX + endX) / 2
    const midY = Math.max(startY, endY) + drop - 12
    return { d, midX, midY }
  }
}

function renderFlowNodeCard(node, coords, isSelected) {
  let typeBadgeColor = 'bg-blue-600 text-white'
  let categoryBadgeStyle = 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
  let iconName = 'message-square'

  if (node.type === 'TRIGGER') {
    typeBadgeColor = 'bg-amber-500 text-white'
    categoryBadgeStyle = 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
    iconName = 'zap'
  } else if (node.type === 'ROOT_MENU') {
    typeBadgeColor = 'bg-blue-600 text-white'
    categoryBadgeStyle = 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
    iconName = 'home'
  } else if (node.type === 'SUBMENU') {
    typeBadgeColor = 'bg-indigo-600 text-white'
    categoryBadgeStyle = 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
    iconName = 'list'
  } else if (node.type === 'PIX_PAYMENT') {
    typeBadgeColor = 'bg-amber-500 text-white'
    categoryBadgeStyle = 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
    iconName = 'qr-code'
  } else if (node.type === 'HUMAN_TRANSFER') {
    typeBadgeColor = 'bg-rose-600 text-white'
    categoryBadgeStyle = 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300'
    iconName = 'user-check'
  } else if (node.category === 'Documentos') {
    typeBadgeColor = 'bg-emerald-600 text-white'
    categoryBadgeStyle = 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
    iconName = 'camera'
  } else if (node.category === 'Catálogos') {
    typeBadgeColor = 'bg-purple-600 text-white'
    categoryBadgeStyle = 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300'
    iconName = 'file-text'
  } else if (node.category === 'Revelação') {
    typeBadgeColor = 'bg-indigo-600 text-white'
    categoryBadgeStyle = 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
    iconName = 'printer'
  }

  const messageSnippet = node.messageText
    ? escapeHtml(node.messageText.slice(0, 120)) + (node.messageText.length > 120 ? '...' : '')
    : 'Sem mensagem configurada'

  const PROTECTED_NODES = ['trigger-start', 'node-main-menu', 'node-human-attendance', 'node-fallback-error']
  const isProtected = PROTECTED_NODES.includes(node.id)

  return `
    <div 
      id="flow-node-${node.id}"
      data-node-id="${node.id}"
      onclick="selectFlowNode('${node.id}')"
      onmouseenter="handleNodeHover('${node.id}')"
      title="Clique para gerenciar mensagens e preços deste nó"
      style="left: ${coords.x}px; top: ${coords.y}px;"
      class="flow-node-card rounded-2xl border ${isSelected ? 'flow-node-active border-indigo-600 dark:border-indigo-500 bg-indigo-50/25 dark:bg-indigo-950/25' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'} p-3.5 space-y-2.5 shadow-sm">
      
      <!-- Cabeçalho do Nó -->
      <div class="flex items-start justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <div class="w-7 h-7 rounded-lg ${typeBadgeColor} flex items-center justify-center shrink-0 shadow-xs">
            <i data-lucide="${iconName}" class="w-3.5 h-3.5"></i>
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[9.5px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${categoryBadgeStyle}">${escapeHtml(node.category || 'Geral')}</span>
              <span class="text-[9px] text-slate-400 font-mono truncate">${escapeHtml(node.state || '')}</span>
            </div>
            <h4 class="font-bold text-slate-900 dark:text-white text-xs leading-snug truncate mt-0.5" title="${escapeHtml(node.title)}">${escapeHtml(node.title)}</h4>
          </div>
        </div>

        <div class="flex items-center gap-1 shrink-0">
          ${!isProtected ? `
            <button 
              type="button"
              onclick="event.stopPropagation(); confirmDeleteNode('${escapeHtml(node.id)}')"
              class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-700 transition" 
              title="Excluir este nó / mensagem">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          ` : `
            <span class="p-1 text-emerald-500 dark:text-emerald-400" title="Nó essencial protegido do sistema">
              <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
            </span>
          `}
          <!-- Botão de Edição Rápida / Redirecionamento -->
          <button 
            type="button"
            onclick="event.stopPropagation(); navigateToMessageManager('${escapeHtml(node.id)}')"
            class="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition" 
            title="Editar no Gerenciador de Mensagens & Preços">
            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>

      <!-- Gatilho do Cliente -->
      <div class="text-[10.5px] bg-slate-50 dark:bg-slate-700/40 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-700/60 flex items-center gap-1 text-slate-600 dark:text-slate-300">
        <i data-lucide="corner-down-right" class="w-3 h-3 text-indigo-500 shrink-0"></i>
        <span class="font-semibold text-slate-400 text-[9.5px] uppercase">Gatilho:</span>
        <span class="font-mono text-indigo-600 dark:text-indigo-400 font-medium truncate">${escapeHtml(node.triggerDescription || '')}</span>
      </div>

      <!-- Preview do Balão WhatsApp -->
      <div class="flow-node-whatsapp-bubble p-2 text-[11px] text-slate-700 dark:text-slate-300 leading-snug line-clamp-2 border border-slate-100 dark:border-slate-700/60 font-sans">
        ${messageSnippet}
      </div>

      ${node.slaNotice ? `
        <div class="text-[9.5px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded flex items-center gap-1">
          <i data-lucide="clock" class="w-3 h-3"></i>
          <span class="truncate">${escapeHtml(node.slaNotice)}</span>
        </div>
      ` : ''}

      <!-- Rodapé com Saídas e Ação de Clique -->
      <div class="pt-1 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
        <span class="hover:text-indigo-500 font-medium">Clique para editar &rarr;</span>
        <span class="font-mono text-[9px] text-indigo-500">${node.options?.length ? `${node.options.length} saídas` : 'Terminal'}</span>
      </div>
    </div>
  `
}

// Seleção do Nó e Sincronização em Tempo Real com o Painel Direito
function selectFlowNode(nodeId) {
  state.selectedFlowNodeId = nodeId

  let node = state.flowchart.nodes.find(n => n.id === nodeId)
  if (!node && nodeId === 'trigger-start') {
    node = {
      id: 'trigger-start',
      title: 'Início (Gatilho Receptivo)',
      category: 'Geral',
      state: 'IDLE',
      triggerDescription: 'Primeira mensagem do cliente ("Oi", "Olá", "Valores")',
      messageText: 'Detecta a primeira mensagem do cliente e inicia o atendimento cordial direcionando para o menu com opções numeradas.',
      slaNotice: 'Disparo receptivo instantâneo'
    }
  }
  if (!node) return

  // Atualiza classe de destaque nos cards
  document.querySelectorAll('.flow-node-card').forEach(el => {
    if (el.getAttribute('data-node-id') === nodeId) {
      el.classList.add('flow-node-active')
    } else {
      el.classList.remove('flow-node-active')
    }
  })

  // Atualiza destaque das linhas SVG conectadas
  document.querySelectorAll('.flow-connector-path').forEach(el => {
    const from = el.getAttribute('data-from')
    const to = el.getAttribute('data-to')
    if (from === nodeId || to === nodeId) {
      el.classList.add('active')
      el.setAttribute('marker-end', 'url(#arrowhead-active)')
    } else {
      el.classList.remove('active')
      el.setAttribute('marker-end', 'url(#arrowhead)')
    }
  })

  // Atualiza painel do inspetor lateral
  const titleEl = document.getElementById('inspector-title')
  if (titleEl) titleEl.textContent = node.title

  const triggerEl = document.getElementById('inspector-trigger')
  if (triggerEl) triggerEl.textContent = node.triggerDescription || '--'

  const messageEl = document.getElementById('inspector-message')
  if (messageEl) messageEl.textContent = node.messageText || 'Sem mensagem configurada'

  const badgeEl = document.getElementById('inspector-badge')
  if (badgeEl) badgeEl.textContent = `${node.category || 'Geral'} • ${node.state || 'ESTADO'}`

  const slaContainer = document.getElementById('inspector-sla-container')
  const slaText = document.getElementById('inspector-sla')
  if (slaContainer && slaText) {
    if (node.slaNotice) {
      slaContainer.classList.remove('hidden')
      slaText.textContent = node.slaNotice
    } else {
      slaContainer.classList.add('hidden')
    }
  }

  // Atualiza imediatamente o simulador do WhatsApp
  updateFlowchartSimulatorPreview(node.messageText)
}

function handleNodeHover(nodeId) {
  const node = state.flowchart.nodes.find(n => n.id === nodeId)
  if (node && node.messageText) {
    updateFlowchartSimulatorPreview(node.messageText)
  }
}

// Redirecionamento com Transição de Aba, Rolagem Suave e Destaque Visual
function navigateToMessageManager(nodeId) {
  if (!nodeId) return

  // Mapeamento entre os IDs dos nós do fluxograma e os formulários do Gerenciador de Mensagens
  const nodeToFormMap = {
    'node-document-photos': { cardId: 'card-msg-documents', inputId: 'input-doc-text' },
    'node-main-menu': { cardId: 'card-msg-welcome', inputId: 'input-welcome-text' },
    'trigger-start': { cardId: 'card-msg-welcome', inputId: 'input-welcome-text' },
    'node-catalogs-menu': { cardId: 'card-msg-catalogs', inputId: 'input-catalogs-text' },
    'node-catalog-maternidade': { cardId: 'card-msg-catalogs', inputId: 'input-catalogs-text' },
    'node-catalog-comemoracoes': { cardId: 'card-msg-catalogs', inputId: 'input-catalogs-text' },
    'node-catalog-estudio': { cardId: 'card-msg-catalogs', inputId: 'input-catalogs-text' },
    'node-personal-prints': { cardId: 'card-msg-personal-prints', inputId: 'input-print-instructions' },
    'node-personal-prints-pix': { cardId: 'card-msg-personal-prints', inputId: 'input-print-quote' },
    'node-studio-sessions': { cardId: 'card-msg-studio', inputId: 'input-studio-text' },
    'node-alboom-menu': { cardId: 'card-msg-alboom', inputId: 'input-alboom-menu' },
    'node-alboom-ask-info': { cardId: 'card-msg-alboom', inputId: 'input-alboom-wait-hours' },
    'node-alboom-wait-hours': { cardId: 'card-msg-alboom', inputId: 'input-alboom-wait-hours' },
    'node-alboom-ask-confirm': { cardId: 'card-msg-alboom', inputId: 'input-alboom-confirmation' },
    'node-alboom-confirmed': { cardId: 'card-msg-alboom', inputId: 'input-alboom-confirmation' },
    'node-sacramental': { cardId: 'card-msg-sacramental', inputId: 'input-sacramental-notice' },
    'node-sacramental-received': { cardId: 'card-msg-sacramental', inputId: 'input-sacramental-received' },
    'node-human-attendance': { cardId: 'card-msg-human', inputId: 'input-human-direct' },
    'node-fallback-error': { cardId: 'card-msg-human', inputId: 'input-human-fallback' }
  }

  const target = nodeToFormMap[nodeId] || { cardId: 'card-msg-welcome', inputId: 'input-welcome-text' }

  // 1. Transição de aba para Mensagens & Preços
  switchMainTab('messages')

  // 2. Foco com scrollIntoView e animação temporária
  setTimeout(() => {
    const cardEl = document.getElementById(target.cardId)
    const inputEl = document.getElementById(target.inputId)

    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      cardEl.classList.remove('highlight-pulse-target')
      // Força reflow para reiniciar animação CSS
      void cardEl.offsetWidth
      cardEl.classList.add('highlight-pulse-target')

      setTimeout(() => {
        cardEl.classList.remove('highlight-pulse-target')
      }, 3000)
    }

    if (inputEl) {
      inputEl.focus()
      updateLivePreview(inputEl.value)
    }

    const node = state.flowchart.nodes.find(n => n.id === nodeId)
    const nodeTitle = node ? node.title : 'Mensagens'
    showToast(`Focando edição de: ${nodeTitle}`, 'info')
  }, 120)
}

function autoFillFlowNodeSlug(value) {
  const idInput = document.getElementById('flow-form-id-input')
  const hiddenId = document.getElementById('flow-form-id')
  if (idInput && (!hiddenId || !hiddenId.value)) {
    idInput.value = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
}

function openEditFlowNodeModal(nodeId) {
  const node = state.flowchart.nodes.find(n => n.id === nodeId)
  if (!node) return

  document.getElementById('flow-node-modal-title').textContent = `Editar: ${node.title}`
  document.getElementById('flow-form-id').value = node.id

  const idInput = document.getElementById('flow-form-id-input')
  if (idInput) {
    idInput.value = node.id
    idInput.disabled = true
  }

  document.getElementById('flow-form-is-custom').value = node.isCustom ? 'true' : 'false'
  document.getElementById('flow-form-title').value = node.title
  document.getElementById('flow-form-trigger').value = node.triggerDescription || ''
  document.getElementById('flow-form-message').value = node.messageText || ''

  const catSelect = document.getElementById('flow-form-category')
  if (catSelect) catSelect.value = node.category || 'Personalizado'

  const parentSelect = document.getElementById('flow-form-parent')
  if (parentSelect && node.parentId) {
    parentSelect.value = node.parentId
  }

  const deleteBtn = document.getElementById('btn-delete-flow-node')
  const PROTECTED = ['node-main-menu', 'node-human-attendance', 'node-fallback-error', 'trigger-start']
  if (deleteBtn) {
    if (!PROTECTED.includes(node.id)) {
      deleteBtn.classList.remove('hidden')
    } else {
      deleteBtn.classList.add('hidden')
    }
  }

  document.getElementById('flow-node-modal').classList.remove('hidden')
  if (window.lucide) window.lucide.createIcons()
}

function openCreateNodeModal(parentId) {
  document.getElementById('flow-node-modal-title').textContent = 'Novo Nó / Mensagem do Fluxo'
  document.getElementById('flow-form-id').value = ''

  const idInput = document.getElementById('flow-form-id-input')
  if (idInput) {
    idInput.value = ''
    idInput.disabled = false
  }

  document.getElementById('flow-form-is-custom').value = 'true'
  document.getElementById('flow-form-title').value = ''
  document.getElementById('flow-form-trigger').value = ''
  document.getElementById('flow-form-message').value = ''

  const catSelect = document.getElementById('flow-form-category')
  if (catSelect) catSelect.value = 'Personalizado'

  const parentSelect = document.getElementById('flow-form-parent')
  if (parentSelect) {
    parentSelect.value = parentId || 'node-main-menu'
  }

  const deleteBtn = document.getElementById('btn-delete-flow-node')
  if (deleteBtn) deleteBtn.classList.add('hidden')

  document.getElementById('flow-node-modal').classList.remove('hidden')
  if (window.lucide) window.lucide.createIcons()
}

function closeFlowNodeModal() {
  document.getElementById('flow-node-modal').classList.add('hidden')
}

function confirmDeleteNode(nodeId) {
  const PROTECTED = ['node-main-menu', 'node-human-attendance', 'node-fallback-error', 'trigger-start']
  if (PROTECTED.includes(nodeId)) {
    showToast('Este nó é essencial ao sistema (Menu Principal / Atendimento) e é protegido contra exclusão.', 'error')
    return
  }

  const node = state.flowchart && state.flowchart.nodes ? state.flowchart.nodes.find(n => n.id === nodeId) : null
  const title = node ? node.title : nodeId.replace(/^node-/, '').replace(/-/g, ' ')

  state.pendingDeleteNodeId = nodeId

  const nameEl = document.getElementById('confirm-delete-node-name')
  const idEl = document.getElementById('confirm-delete-node-id')
  if (nameEl) nameEl.textContent = title
  if (idEl) idEl.textContent = `ID: ${nodeId}`

  const modal = document.getElementById('confirm-delete-modal')
  if (modal) modal.classList.remove('hidden')
  if (window.lucide) window.lucide.createIcons()
}

function closeConfirmDeleteModal() {
  state.pendingDeleteNodeId = null
  const modal = document.getElementById('confirm-delete-modal')
  if (modal) modal.classList.add('hidden')
}

async function executeDeleteConfirmedNode() {
  const nodeId = state.pendingDeleteNodeId
  if (!nodeId) return

  const btn = document.getElementById('btn-confirm-delete-node')
  if (btn) btn.disabled = true

  try {
    const res = await fetch(`/api/admin/messages/node/${encodeURIComponent(nodeId)}`, {
      method: 'DELETE'
    })
    const json = await res.json()
    if (!res.ok || !json.success) throw new Error(json.message || 'Erro ao excluir nó')

    showToast('Mensagem removida com sucesso. As ramificações dependentes retornaram ao Menu Principal.', 'success')
    closeConfirmDeleteModal()
    closeFlowNodeModal()

    await Promise.all([loadFlowchart(), loadMessages()])
  } catch (err) {
    showToast(`Erro ao excluir mensagem: ${err.message}`, 'error')
  } finally {
    if (btn) btn.disabled = false
  }
}

function handleDeleteFlowNodeFromModal() {
  const id = document.getElementById('flow-form-id').value.trim()
  if (id) {
    confirmDeleteNode(id)
  }
}

function insertTagIntoFlowText(tag) {
  const textarea = document.getElementById('flow-form-message')
  if (!textarea) return

  const start = textarea.selectionStart || 0
  const end = textarea.selectionEnd || 0
  const text = textarea.value
  textarea.value = text.substring(0, start) + tag + text.substring(end)
  textarea.focus()
  textarea.selectionStart = textarea.selectionEnd = start + tag.length
}

async function handleSaveFlowNode(event) {
  event.preventDefault()
  const saveBtn = document.getElementById('btn-save-flow-node')
  if (saveBtn) saveBtn.disabled = true

  const existingId = document.getElementById('flow-form-id').value.trim()
  const customSlug = document.getElementById('flow-form-id-input')?.value.trim() || ''
  const title = document.getElementById('flow-form-title').value.trim()
  const category = document.getElementById('flow-form-category')?.value || 'Personalizado'
  const parentId = document.getElementById('flow-form-parent')?.value || 'node-main-menu'
  const triggerDescription = document.getElementById('flow-form-trigger').value.trim()
  const messageText = document.getElementById('flow-form-message').value.trim()

  try {
    if (existingId) {
      // Atualização de nó existente
      const res = await fetch(`/api/admin/flowchart/node/${encodeURIComponent(existingId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, triggerDescription, messageText })
      })

      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || 'Erro ao atualizar nó')

      showToast('Nó do fluxograma atualizado e sincronizado!', 'success')
    } else {
      // Criação de nó customizado
      const res = await fetch('/api/admin/messages/node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: customSlug,
          parentId,
          title,
          category,
          triggerDescription,
          messageText
        })
      })

      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || 'Erro ao criar nó')

      showToast('Nova pergunta e resposta adicionada ao fluxograma!', 'success')
    }

    closeFlowNodeModal()
    await Promise.all([loadFlowchart(), loadMessages()])
    if (existingId) selectFlowNode(existingId)
  } catch (err) {
    showToast(`Erro ao salvar nó: ${err.message}`, 'error')
  } finally {
    if (saveBtn) saveBtn.disabled = false
  }
}

// ===================================================
// GERENCIADOR DE MENSAGENS E PREÇOS (API)
// ===================================================
async function loadMessages() {
  try {
    const res = await fetch('/api/admin/messages')
    const json = await res.json()
    if (!json.success) throw new Error(json.message || 'Falha ao buscar mensagens')

    state.messages = json.data
    state.originalMessages = JSON.parse(JSON.stringify(json.data))
    populateMessagesForm(json.data)
  } catch (err) {
    showToast(`Erro ao carregar mensagens: ${err.message}`, 'error')
  }
}

function populateMessagesForm(data) {
  if (!data) return

  // 1. Fotos para Documento
  const docPhotos = data.document_photos || {}
  const docPriceInput = document.getElementById('input-doc-price')
  if (docPriceInput) docPriceInput.value = docPhotos.price ?? 30.0

  const pkgs = docPhotos.packages || {}
  const pkg3x4 = document.getElementById('input-pkg-3x4')
  if (pkg3x4) pkg3x4.value = pkgs['3x4'] ?? 6

  const pkg35x45 = document.getElementById('input-pkg-35x45')
  if (pkg35x45) pkg35x45.value = pkgs['3.5x4.5'] ?? 6

  const pkg5x5 = document.getElementById('input-pkg-5x5')
  if (pkg5x5) pkg5x5.value = pkgs['5x5'] ?? 2

  const pkg5x7 = document.getElementById('input-pkg-5x7')
  if (pkg5x7) pkg5x7.value = pkgs['5x7'] ?? 2

  const docTextInput = document.getElementById('input-doc-text')
  if (docTextInput) docTextInput.value = docPhotos.text ?? ''

  // 2. Boas-vindas e Menus
  const mainMenu = data.main_menu || {}
  const welcomeInput = document.getElementById('input-welcome-text')
  if (welcomeInput) {
    welcomeInput.value = mainMenu.welcome ?? ''
    updateLivePreview(welcomeInput.value)
  }

  const catalogs = data.catalogs || {}
  const catalogsInput = document.getElementById('input-catalogs-text')
  if (catalogsInput) catalogsInput.value = catalogs.menu ?? ''

  const studio = data.studio_sessions || {}
  const studioInput = document.getElementById('input-studio-text')
  if (studioInput) studioInput.value = studio.info ?? ''

  // 3. Revelação de Fotos Pessoais
  const prints = data.personal_prints || {}
  const printInstructions = document.getElementById('input-print-instructions')
  if (printInstructions) printInstructions.value = prints.instructions ?? ''
  const printQuote = document.getElementById('input-print-quote')
  if (printQuote) printQuote.value = prints.quote_and_pix ?? ''

  // 4. Galeria Alboom
  const alboom = data.alboom || {}
  const alboomSlaInput = document.getElementById('input-alboom-sla-days')
  if (alboomSlaInput) alboomSlaInput.value = alboom.production_days_sla ?? 10

  const alboomMenuInput = document.getElementById('input-alboom-menu')
  if (alboomMenuInput) alboomMenuInput.value = alboom.menu ?? ''

  const alboomWaitHours = document.getElementById('input-alboom-wait-hours')
  if (alboomWaitHours) alboomWaitHours.value = alboom.wait_hours_notice ?? ''

  const alboomConfirmation = document.getElementById('input-alboom-confirmation')
  if (alboomConfirmation) alboomConfirmation.value = alboom.confirmation_notice ?? ''

  // 5. Fotos Sacramentais
  const sacramental = data.sacramental || {}
  const sacramentalNotice = document.getElementById('input-sacramental-notice')
  if (sacramentalNotice) sacramentalNotice.value = sacramental.prepaid_notice ?? ''

  const sacramentalReceived = document.getElementById('input-sacramental-received')
  if (sacramentalReceived) sacramentalReceived.value = sacramental.received_notice ?? ''

  // 6. Transbordo Humano
  const human = data.human_attendance || {}
  const humanDirect = document.getElementById('input-human-direct')
  if (humanDirect) humanDirect.value = human.direct_transfer ?? ''

  const humanFallback = document.getElementById('input-human-fallback')
  if (humanFallback) humanFallback.value = human.fallback_transfer ?? ''

  // Sincroniza visibilidade de cards base caso tenham sido removidos do fluxo
  if (state.flowchart && state.flowchart.nodes) {
    const activeIds = state.flowchart.nodes.map(n => n.id)
    const cardDocs = document.getElementById('card-msg-documents')
    if (cardDocs) cardDocs.style.display = activeIds.includes('node-document-photos') ? '' : 'none'
    const cardPrints = document.getElementById('card-msg-personal-prints')
    if (cardPrints) cardPrints.style.display = activeIds.includes('node-personal-prints') ? '' : 'none'
    const cardAlboom = document.getElementById('card-msg-alboom')
    if (cardAlboom) cardAlboom.style.display = activeIds.includes('node-alboom-menu') ? '' : 'none'
    const cardSacramental = document.getElementById('card-msg-sacramental')
    if (cardSacramental) cardSacramental.style.display = activeIds.includes('node-sacramental') ? '' : 'none'
  }

  // Renderiza blocos de mensagens customizados criados dinamicamente
  renderCustomMessages(data)
}

function renderCustomMessages(data) {
  const container = document.getElementById('custom-messages-container')
  if (!container) return

  const customNodes = data.custom_nodes || {}
  const entries = Object.entries(customNodes)

  if (entries.length === 0) {
    container.innerHTML = ''
    return
  }

  let html = `
    <div class="border-t border-slate-200 dark:border-slate-700 pt-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <i data-lucide="layers" class="w-5 h-5 text-indigo-500"></i>
            Blocos de Mensagens Adicionais (Criados no Fluxo)
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">Mensagens e ramificações personalizadas criadas dinamicamente.</p>
        </div>
      </div>
      <div class="space-y-4">
  `

  entries.forEach(([id, item]) => {
    const itemTitle = item.title || id
    const itemTrigger = item.trigger || ''
    const itemText = item.message || item.text || ''
    const category = item.category || 'Personalizado'

    html += `
      <div id="card-custom-msg-${escapeHtml(id)}" class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-all duration-300">
        <div class="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <i data-lucide="message-circle" class="w-4 h-4"></i>
            </div>
            <div>
              <h4 class="font-bold text-slate-800 dark:text-white text-sm">${escapeHtml(itemTitle)}</h4>
              <span class="text-[10px] font-mono text-slate-400">${escapeHtml(id)}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 font-medium">${escapeHtml(category)}</span>
            <button type="button" onclick="confirmDeleteNode('${escapeHtml(id)}')" class="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition" title="Excluir este bloco de mensagem">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
        <div class="p-5 space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">Título</label>
              <input type="text" data-custom-id="${escapeHtml(id)}" data-field="title" value="${escapeHtml(itemTitle)}" class="custom-msg-input w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white">
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">Gatilho do Cliente</label>
              <input type="text" data-custom-id="${escapeHtml(id)}" data-field="trigger" value="${escapeHtml(itemTrigger)}" class="custom-msg-input w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white">
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">Texto de Resposta (WhatsApp)</label>
            <textarea rows="3" data-custom-id="${escapeHtml(id)}" data-field="message" class="custom-msg-input w-full p-3 text-sm bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white font-mono">${escapeHtml(itemText)}</textarea>
          </div>
        </div>
      </div>
    `
  })

  html += `</div></div>`
  container.innerHTML = html
  if (window.lucide) window.lucide.createIcons({ root: container })
}

async function saveMessages() {
  const saveBtn = document.getElementById('btn-save-messages')
  const saveText = document.getElementById('save-btn-text')

  if (saveBtn) saveBtn.disabled = true
  if (saveText) saveText.textContent = 'Salvando...'

  try {
    const payload = JSON.parse(JSON.stringify(state.messages || {}))

    payload.document_photos = payload.document_photos || {}
    payload.document_photos.price = parseFloat(document.getElementById('input-doc-price')?.value || '30')
    payload.document_photos.packages = {
      '3x4': parseInt(document.getElementById('input-pkg-3x4')?.value || '6', 10),
      '3.5x4.5': parseInt(document.getElementById('input-pkg-35x45')?.value || '6', 10),
      '5x5': parseInt(document.getElementById('input-pkg-5x5')?.value || '2', 10),
      '5x7': parseInt(document.getElementById('input-pkg-5x7')?.value || '2', 10)
    }
    payload.document_photos.text = document.getElementById('input-doc-text')?.value || ''

    payload.main_menu = payload.main_menu || {}
    payload.main_menu.welcome = document.getElementById('input-welcome-text')?.value || ''

    payload.catalogs = payload.catalogs || {}
    payload.catalogs.menu = document.getElementById('input-catalogs-text')?.value || ''

    payload.studio_sessions = payload.studio_sessions || {}
    payload.studio_sessions.info = document.getElementById('input-studio-text')?.value || ''

    payload.personal_prints = payload.personal_prints || {}
    payload.personal_prints.instructions = document.getElementById('input-print-instructions')?.value || ''
    payload.personal_prints.quote_and_pix = document.getElementById('input-print-quote')?.value || ''

    payload.alboom = payload.alboom || {}
    payload.alboom.production_days_sla = parseInt(document.getElementById('input-alboom-sla-days')?.value || '10', 10)
    payload.alboom.menu = document.getElementById('input-alboom-menu')?.value || payload.alboom.menu
    payload.alboom.wait_hours_notice = document.getElementById('input-alboom-wait-hours')?.value || ''
    payload.alboom.confirmation_notice = document.getElementById('input-alboom-confirmation')?.value || ''

    payload.sacramental = payload.sacramental || {}
    payload.sacramental.prepaid_notice = document.getElementById('input-sacramental-notice')?.value || ''
    payload.sacramental.received_notice = document.getElementById('input-sacramental-received')?.value || ''

    payload.human_attendance = payload.human_attendance || {}
    payload.human_attendance.direct_transfer = document.getElementById('input-human-direct')?.value || ''
    payload.human_attendance.fallback_transfer = document.getElementById('input-human-fallback')?.value || ''

    // Coleta campos dos blocos customizados
    payload.custom_nodes = payload.custom_nodes || {}
    document.querySelectorAll('.custom-msg-input').forEach(input => {
      const id = input.getAttribute('data-custom-id')
      const field = input.getAttribute('data-field')
      if (id && field) {
        if (!payload.custom_nodes[id]) payload.custom_nodes[id] = {}
        payload.custom_nodes[id][field] = input.value
      }
    })

    const res = await fetch('/api/admin/messages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const json = await res.json()
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Erro ao salvar alterações')
    }

    state.messages = json.data
    state.originalMessages = JSON.parse(JSON.stringify(json.data))
    showToast('Alterações salvas e sincronizadas com sucesso no WhatsApp!', 'success')
    await Promise.all([loadFlowchart(), loadMessages()])
  } catch (err) {
    showToast(`Erro ao salvar mensagens: ${err.message}`, 'error')
  } finally {
    if (saveBtn) saveBtn.disabled = false
    if (saveText) saveText.textContent = 'Salvar Alterações'
  }
}

function resetMessages() {
  if (state.originalMessages) {
    populateMessagesForm(state.originalMessages)
    showToast('Valores restaurados para a última versão salva.', 'info')
  }
}

// ===================================================
// MONITOR DE SESSÕES & CONVERSAS (API)
// ===================================================
async function loadStats() {
  try {
    const res = await fetch('/api/admin/stats')
    const json = await res.json()
    if (json.success && json.data) {
      state.stats = json.data
      document.getElementById('stat-total').textContent = json.data.totalSessions ?? 0
      document.getElementById('stat-bot').textContent = json.data.botSessions ?? 0
      document.getElementById('stat-human').textContent = json.data.humanSessions ?? 0
      document.getElementById('stat-requests').textContent = json.data.pendingRequests ?? 0
    }
  } catch (err) {
    console.error('Falha ao carregar métricas:', err)
  }
}

async function loadSessions() {
  const tbody = document.getElementById('sessions-table-body')
  if (!tbody) return

  tbody.innerHTML = `
    <tr>
      <td colspan="6" class="py-8 text-center text-slate-400">
        <div class="flex items-center justify-center gap-2">
          <i data-lucide="loader-2" class="w-5 h-5 animate-spin text-blue-600"></i>
          <span>Carregando conversas ativas...</span>
        </div>
      </td>
    </tr>
  `
  if (window.lucide) window.lucide.createIcons({ root: tbody })

  try {
    const params = new URLSearchParams({
      page: String(state.pagination.page),
      limit: String(state.pagination.limit),
      status: state.statusFilter
    })
    if (state.searchTerm) {
      params.append('search', state.searchTerm)
    }

    const res = await fetch(`/api/admin/sessions?${params.toString()}`)
    const json = await res.json()
    if (!json.success) throw new Error(json.message || 'Erro ao listar sessões')

    state.sessions = json.data.items || []
    state.pagination.total = json.data.total || 0
    state.pagination.totalPages = json.data.totalPages || 1

    renderSessionsTable()
    updatePaginationControls()
  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-8 text-center text-rose-500">
          Erro ao carregar sessões: ${escapeHtml(err.message)}
        </td>
      </tr>
    `
  }
}

function renderSessionsTable() {
  const tbody = document.getElementById('sessions-table-body')
  if (!tbody) return

  if (state.sessions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-12 text-center text-slate-400">
          <div class="max-w-xs mx-auto space-y-2">
            <i data-lucide="message-square-off" class="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600"></i>
            <p class="font-medium">Nenhuma sessão encontrada</p>
            <p class="text-xs text-slate-400">Tente ajustar seus filtros de busca ou aguarde novas mensagens pelo WhatsApp.</p>
          </div>
        </td>
      </tr>
    `
    if (window.lucide) window.lucide.createIcons({ root: tbody })
    return
  }

  tbody.innerHTML = state.sessions.map(s => {
    const isHuman = s.currentState === 'HUMAN_ATTENDANCE'
    const initials = (s.senderName || 'CL')
      .split(' ')
      .map(p => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()

    const updatedAtFormatted = formatTimeAgo(s.updatedAt || s.createdAt)
    const contextJsonStr = JSON.stringify(s.contextData || {}, null, 2)
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

    return `
      <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition">
        <td class="py-3.5 px-4">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center shrink-0">
              ${initials}
            </div>
            <div>
              <p class="font-semibold text-slate-900 dark:text-white leading-tight">${escapeHtml(s.senderName || 'Cliente')}</p>
              <p class="text-[11px] text-slate-400">${formatPhoneDisplay(s.remoteJid)}</p>
            </div>
          </div>
        </td>
        <td class="py-3.5 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">
          ${escapeHtml(s.remoteJid)}
        </td>
        <td class="py-3.5 px-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
            ${escapeHtml(s.currentState)}
          </span>
        </td>
        <td class="py-3.5 px-4">
          ${
            isHuman
              ? `
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  <span class="w-2 h-2 rounded-full bg-amber-500 status-pulse"></span>
                  TRANSBORDO HUMANO
                </span>
              `
              : `
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 status-pulse"></span>
                  EM ATENDIMENTO AUTOMÁTICO
                </span>
              `
          }
        </td>
        <td class="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
          ${updatedAtFormatted}
        </td>
        <td class="py-3.5 px-4 text-right">
          <div class="flex items-center justify-end space-x-2">
            <button 
              onclick="openSessionModal('${escapeHtml(s.senderName)}', '${escapeHtml(s.remoteJid)}', '${contextJsonStr}')"
              class="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium transition"
              title="Inspecionar Contexto FSM">
              Contexto
            </button>
            ${
              isHuman
                ? `
                  <button 
                    onclick="toggleHumanAttendance('${escapeHtml(s.remoteJid)}', 'IDLE')"
                    class="flex items-center gap-1 px-3 py-1 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition">
                    <i data-lucide="play" class="w-3.5 h-3.5"></i>
                    <span>Retomar Bot</span>
                  </button>
                `
                : `
                  <button 
                    onclick="toggleHumanAttendance('${escapeHtml(s.remoteJid)}', 'HUMAN_ATTENDANCE')"
                    class="flex items-center gap-1 px-3 py-1 text-xs rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm transition">
                    <i data-lucide="pause" class="w-3.5 h-3.5"></i>
                    <span>Pausar Bot</span>
                  </button>
                `
            }
          </div>
        </td>
      </tr>
    `
  }).join('')

  if (window.lucide) {
    window.lucide.createIcons({ root: tbody })
  }
}

function updatePaginationControls() {
  const info = document.getElementById('sessions-pagination-info')
  const pageSpan = document.getElementById('sessions-current-page')
  const prevBtn = document.getElementById('sessions-prev-btn')
  const nextBtn = document.getElementById('sessions-next-btn')

  if (info) {
    const start = state.sessions.length > 0 ? (state.pagination.page - 1) * state.pagination.limit + 1 : 0
    const end = Math.min(state.pagination.page * state.pagination.limit, state.pagination.total)
    info.textContent = `Mostrando ${start} a ${end} de ${state.pagination.total} conversas`
  }

  if (pageSpan) {
    pageSpan.textContent = `Pág. ${state.pagination.page} de ${state.pagination.totalPages}`
  }

  if (prevBtn) {
    prevBtn.disabled = state.pagination.page <= 1
  }

  if (nextBtn) {
    nextBtn.disabled = state.pagination.page >= state.pagination.totalPages
  }
}

async function toggleHumanAttendance(remoteJid, targetState) {
  try {
    const res = await fetch(`/api/admin/sessions/${encodeURIComponent(remoteJid)}/toggle-human`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetState })
    })

    const json = await res.json()
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Falha ao alterar atendimento')
    }

    showToast(json.message, 'success')
    loadSessions()
    loadStats()
  } catch (err) {
    showToast(`Erro: ${err.message}`, 'error')
  }
}

// Modal de Contexto
function openSessionModal(name, jid, contextJson) {
  document.getElementById('modal-client-name').textContent = name || 'Cliente'
  document.getElementById('modal-remote-jid').textContent = jid || ''
  
  let formatted = '{}'
  try {
    const decoded = contextJson.replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    formatted = JSON.stringify(JSON.parse(decoded), null, 2)
  } catch {
    formatted = contextJson
  }

  document.getElementById('modal-context-json').textContent = formatted
  document.getElementById('session-modal').classList.remove('hidden')
  if (window.lucide) window.lucide.createIcons()
}

function closeSessionModal() {
  document.getElementById('session-modal').classList.add('hidden')
}

// ===================================================
// FILA DE PEDIDOS E SOLICITAÇÕES (API)
// ===================================================
async function loadRequests() {
  try {
    const res = await fetch('/api/admin/requests')
    const json = await res.json()
    if (!json.success) throw new Error(json.message || 'Erro ao carregar solicitações')

    state.requests = json.data || { personalPrints: [], alboom: [], sacramental: [] }
    renderRequestsSubTabs()
  } catch (err) {
    showToast(`Erro nas solicitações: ${err.message}`, 'error')
  }
}

function renderRequestsSubTabs() {
  // 1. Fotos Pessoais
  const printsTbody = document.getElementById('prints-table-body')
  if (printsTbody) {
    const list = state.requests.personalPrints || []
    if (list.length === 0) {
      printsTbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-400">Nenhum pedido de revelação de fotos pessoais no momento.</td></tr>`
    } else {
      printsTbody.innerHTML = list.map(item => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30">
          <td class="p-3.5 font-medium text-slate-900 dark:text-white">${escapeHtml(item.senderName)}</td>
          <td class="p-3.5 font-mono text-xs text-slate-500">${escapeHtml(item.remoteJid)}</td>
          <td class="p-3.5">${item.photoCount ? `${item.photoCount} foto(s)` : 'Aguardando envio'}</td>
          <td class="p-3.5 font-mono text-xs">${escapeHtml(item.photoSize || 'Não selecionado')}</td>
          <td class="p-3.5 font-semibold text-slate-900 dark:text-white">${item.totalAmount ? `R$ ${item.totalAmount.toFixed(2)}` : '--'}</td>
          <td class="p-3.5">
            ${
              item.pixStatus === 'PAID'
                ? '<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">PAGO</span>'
                : '<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">AGUARDANDO PIX</span>'
            }
          </td>
          <td class="p-3.5 text-xs text-slate-400">${formatTimeAgo(item.updatedAt)}</td>
        </tr>
      `).join('')
    }
  }

  // 2. Alboom com SLA
  const alboomTbody = document.getElementById('alboom-table-body')
  if (alboomTbody) {
    const list = state.requests.alboom || []
    if (list.length === 0) {
      alboomTbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400">Nenhuma solicitação da Galeria Alboom no momento.</td></tr>`
    } else {
      alboomTbody.innerHTML = list.map(item => {
        const isConfirmation = item.type === 'CONFIRM_SELECTION'
        const slaBadge = item.isOverdue
          ? '<span class="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300">PRAZO EXCEDIDO</span>'
          : item.businessDaysRemaining <= 2
          ? `<span class="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">URGENTE (${item.businessDaysRemaining}d restantes)</span>`
          : `<span class="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">Dentro do SLA (${item.businessDaysRemaining}d restantes)</span>`

        return `
          <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30">
            <td class="p-3.5 font-medium text-slate-900 dark:text-white">${escapeHtml(item.senderName)}</td>
            <td class="p-3.5 font-mono text-xs text-slate-500">${escapeHtml(item.remoteJid)}</td>
            <td class="p-3.5">
              ${
                isConfirmation
                  ? '<span class="px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">Confirmação de Seleção</span>'
                  : '<span class="px-2 py-0.5 rounded text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300">Pedido de Link de Acesso</span>'
              }
            </td>
            <td class="p-3.5 text-xs text-slate-700 dark:text-slate-300 max-w-xs break-words">${escapeHtml(item.clientData)}</td>
            <td class="p-3.5">
              <div class="space-y-1">
                <div class="flex justify-between text-xs font-medium">
                  <span>${item.businessDaysPassed} de ${item.slaDays} dias úteis</span>
                  <span class="text-slate-400">${item.businessDaysRemaining}d restantes</span>
                </div>
                <div class="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div class="h-full rounded-full ${item.isOverdue ? 'bg-rose-500' : item.businessDaysRemaining <= 2 ? 'bg-amber-500' : 'bg-emerald-500'}" style="width: ${Math.min(100, (item.businessDaysPassed / item.slaDays) * 100)}%"></div>
                </div>
              </div>
            </td>
            <td class="p-3.5">${slaBadge}</td>
          </tr>
        `
      }).join('')
    }
  }

  // 3. Fotos Sacramentais
  const sacramentalTbody = document.getElementById('sacramental-table-body')
  if (sacramentalTbody) {
    const list = state.requests.sacramental || []
    if (list.length === 0) {
      sacramentalTbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-400">Nenhum pedido de resgate de fotos religiosas registrado.</td></tr>`
    } else {
      sacramentalTbody.innerHTML = list.map(item => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30">
          <td class="p-3.5 font-medium text-slate-900 dark:text-white">${escapeHtml(item.senderName)}</td>
          <td class="p-3.5 font-mono text-xs text-slate-500">${escapeHtml(item.remoteJid)}</td>
          <td class="p-3.5 text-xs text-slate-700 dark:text-slate-300 max-w-md break-words">${escapeHtml(item.details)}</td>
          <td class="p-3.5">
            <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
              QUITADO NO DIA DO EVENTO
            </span>
          </td>
          <td class="p-3.5 text-xs text-slate-400">${formatTimeAgo(item.updatedAt)}</td>
        </tr>
      `).join('')
    }
  }
}

// ===================================================
// UTILITÁRIOS
// ===================================================
function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatPhoneDisplay(jid) {
  if (!jid) return ''
  const clean = jid.replace('@s.whatsapp.net', '')
  if (clean.length === 12 || clean.length === 13) {
    return `+${clean.slice(0, 2)} (${clean.slice(2, 4)}) ${clean.slice(4)}`
  }
  return clean
}

function formatTimeAgo(dateInput) {
  if (!dateInput) return '--'
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return '--'

  const diffSeconds = Math.floor((new Date() - date) / 1000)
  if (diffSeconds < 60) return 'Agora mesmo'
  if (diffSeconds < 3600) return `há ${Math.floor(diffSeconds / 60)} min`
  if (diffSeconds < 86400) return `há ${Math.floor(diffSeconds / 3600)}h`
  return `há ${Math.floor(diffSeconds / 86400)} dia(s)`
}

// ===================================================
// GESTÃO DE SERVIÇOS & LINKS DE CATÁLOGOS NO SITE (UC-02)
// ===================================================
async function loadCatalogs() {
  try {
    const res = await fetch('/api/admin/services-catalog')
    const json = await res.json()
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Falha ao buscar catálogo de serviços')
    }

    state.servicesCatalog = json.data.services || []
    state.sectors = json.data.sectors || []

    // Atualiza contadores de KPIs
    const total = state.servicesCatalog.length
    const active = state.servicesCatalog.filter(s => s.active).length
    const inactive = total - active
    const sectorsCount = state.sectors.length

    const totalEl = document.getElementById('catalogs-total-count')
    const activeEl = document.getElementById('catalogs-active-count')
    const inactiveEl = document.getElementById('catalogs-inactive-count')
    const sectorsEl = document.getElementById('catalogs-sectors-count')

    if (totalEl) totalEl.textContent = total
    if (activeEl) activeEl.textContent = active
    if (inactiveEl) inactiveEl.textContent = inactive
    if (sectorsEl) sectorsEl.textContent = sectorsCount

    renderSectorsFilterPills()
    renderServicesCatalog()
  } catch (err) {
    showToast(`Erro ao carregar catálogo de serviços: ${err.message}`, 'error')
  }
}

function renderSectorsFilterPills() {
  const container = document.getElementById('catalogs-filter-pills')
  if (!container) return

  const allActive = state.catalogsFilter === 'ALL'
  let html = `
    <button onclick="filterCatalogsCategory('ALL')" class="catalog-filter-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold ${allActive ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'} transition" data-category="ALL">
      Todos os Setores (${state.servicesCatalog.length})
    </button>
  `

  state.sectors.forEach(sec => {
    const isCurrent = state.catalogsFilter === sec
    const count = state.servicesCatalog.filter(s => s.sector === sec).length
    html += `
      <button onclick="filterCatalogsCategory('${sec.replace(/'/g, "\\'")}')" class="catalog-filter-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold ${isCurrent ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'} transition" data-category="${sec}">
        ${sec} (${count})
      </button>
    `
  })

  container.innerHTML = html
}

function filterCatalogsCategory(category) {
  state.catalogsFilter = category
  renderSectorsFilterPills()
  renderServicesCatalog()
}

function updateServiceField(id, field, value) {
  const item = (state.servicesCatalog || []).find(s => s.id === id)
  if (item) {
    item[field] = value
  }
}

function updateServicePreview(id) {
  const item = (state.servicesCatalog || []).find(s => s.id === id)
  const previewEl = document.getElementById(`preview-text-${id}`)
  if (item && previewEl) {
    const rawTemplate = item.humanizedMessage || ''
    const formatted = rawTemplate
      .replace(/{title}/g, item.title || '')
      .replace(/{url}/g, item.url || '')
      .replace(/{link}/g, item.url || '')
    previewEl.textContent = formatted
  }
}

function toggleServiceActive(id, checked) {
  const item = (state.servicesCatalog || []).find(s => s.id === id)
  if (item) {
    item.active = checked
    const activeCount = state.servicesCatalog.filter(s => s.active).length
    const inactiveCount = state.servicesCatalog.length - activeCount
    const activeEl = document.getElementById('catalogs-active-count')
    const inactiveEl = document.getElementById('catalogs-inactive-count')
    if (activeEl) activeEl.textContent = activeCount
    if (inactiveEl) inactiveEl.textContent = inactiveCount

    const badgeEl = document.getElementById(`badge-active-${id}`)
    if (badgeEl) {
      if (checked) {
        badgeEl.className = 'px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
        badgeEl.textContent = 'Ativo no Bot'
      } else {
        badgeEl.className = 'px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
        badgeEl.textContent = 'Oculto'
      }
    }
  }
}

function removeService(id) {
  const item = (state.servicesCatalog || []).find(s => s.id === id)
  if (!item) return

  if (confirm(`Tem certeza que deseja remover o serviço "${item.title}" do catálogo?`)) {
    state.servicesCatalog = state.servicesCatalog.filter(s => s.id !== id)
    showToast(`Serviço "${item.title}" removido. Clique em "Salvar Alterações" para confirmar.`, 'info')
    renderServicesCatalog()
    renderSectorsFilterPills()
  }
}

function renderServicesCatalog() {
  const container = document.getElementById('services-catalog-container')
  if (!container) return

  let services = state.servicesCatalog || []
  if (state.catalogsFilter !== 'ALL') {
    services = services.filter(s => s.sector === state.catalogsFilter)
  }

  if (services.length === 0) {
    container.innerHTML = `
      <div class="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-400">
        <i data-lucide="layers" class="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600"></i>
        <p class="font-medium text-slate-600 dark:text-slate-300">Nenhum serviço encontrado para este setor.</p>
        <button onclick="openNewServiceModal()" class="mt-3 px-4 py-2 text-xs font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700">
          Adicionar Serviço Agora
        </button>
      </div>
    `
    if (window.lucide) window.lucide.createIcons()
    return
  }

  const grouped = {}
  services.forEach(s => {
    if (!grouped[s.sector]) {
      grouped[s.sector] = []
    }
    grouped[s.sector].push(s)
  })

  const sectorIcons = {
    'Maternidade & Família': 'baby',
    'Aniversários & Comemorações': 'cake',
    'Carreira & Formatura': 'briefcase',
    'Sazonais': 'sparkles'
  }

  container.innerHTML = Object.entries(grouped).map(([sectorName, items]) => {
    const iconName = sectorIcons[sectorName] || 'folder'

    return `
      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <!-- Cabeçalho do Setor -->
        <div class="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-700/40 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="p-1.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg">
              <i data-lucide="${iconName}" class="w-4 h-4"></i>
            </div>
            <h3 class="font-bold text-sm text-slate-900 dark:text-white">${sectorName}</h3>
            <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300">
              ${items.length} ${items.length === 1 ? 'serviço' : 'serviços'}
            </span>
          </div>
          <button onclick="openNewServiceModal('${sectorName.replace(/'/g, "\\'")}')" class="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 flex items-center gap-1">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            <span>Adicionar a este setor</span>
          </button>
        </div>

        <!-- Grade de Cards dos Serviços do Setor -->
        <div class="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
          ${items.map(s => {
            const previewText = (s.humanizedMessage || '')
              .replace(/{title}/g, s.title)
              .replace(/{url}/g, s.url)
              .replace(/{link}/g, s.url)

            return `
              <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col justify-between space-y-3.5 hover:border-purple-300 dark:hover:border-purple-700/60 transition">
                <!-- Topo: ID, Ativo e Ações -->
                <div class="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-700/50 pb-2.5">
                  <div class="flex items-center gap-2">
                    <code class="px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-400 font-semibold">
                      ${s.id}
                    </code>
                    <span id="badge-active-${s.id}" class="px-2 py-0.5 rounded-full text-[11px] font-semibold ${s.active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}">
                      ${s.active ? 'Ativo no Bot' : 'Oculto'}
                    </span>
                  </div>
                  <div class="flex items-center gap-2.5">
                    <label class="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-400">
                      <span>Exibir:</span>
                      <input type="checkbox" ${s.active ? 'checked' : ''} onchange="toggleServiceActive('${s.id}', this.checked)" class="w-4 h-4 text-purple-600 rounded border-slate-300 dark:border-slate-600 focus:ring-purple-500">
                    </label>
                    <button onclick="removeService('${s.id}')" title="Excluir Serviço" class="text-slate-400 hover:text-rose-600 p-1 rounded transition">
                      <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                  </div>
                </div>

                <!-- Input Nome do Serviço -->
                <div>
                  <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Nome de Exibição Comercial</label>
                  <input 
                    type="text" 
                    value="${s.title.replace(/"/g, '&quot;')}" 
                    oninput="updateServiceField('${s.id}', 'title', this.value); updateServicePreview('${s.id}')"
                    class="w-full px-3 py-1.5 text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                  >
                </div>

                <!-- Input URL com Botão de Teste -->
                <div>
                  <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Link Oficial no Site da Petri Fotos</label>
                  <div class="flex items-center gap-2">
                    <input 
                      type="url" 
                      value="${s.url}" 
                      oninput="updateServiceField('${s.id}', 'url', this.value); updateServicePreview('${s.id}')"
                      class="flex-1 px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-purple-700 dark:text-purple-300"
                    >
                    <a 
                      href="${s.url}" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      class="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition flex items-center gap-1 shrink-0"
                    >
                      <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                      <span>Testar</span>
                    </a>
                  </div>
                </div>

                <!-- Textarea Mensagem Humanizada -->
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Mensagem Acolhedora (WhatsApp)</label>
                    <span class="text-[10px] text-slate-400">Tags: <code class="font-bold">{title}</code> e <code class="font-bold">{url}</code></span>
                  </div>
                  <textarea 
                    rows="3" 
                    oninput="updateServiceField('${s.id}', 'humanizedMessage', this.value); updateServicePreview('${s.id}')"
                    class="w-full p-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-slate-200"
                  >${s.humanizedMessage || ''}</textarea>
                </div>

                <!-- Prévia em tempo real da mensagem -->
                <div class="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-[11px] space-y-1">
                  <div class="flex items-center gap-1 font-semibold text-emerald-800 dark:text-emerald-300">
                    <i data-lucide="message-circle" class="w-3 h-3"></i>
                    <span>Prévia no WhatsApp:</span>
                  </div>
                  <p id="preview-text-${s.id}" class="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-sans">
                    ${previewText}
                  </p>
                </div>
              </div>
            `
          }).join('')}
        </div>
      </div>
    `
  }).join('')

  if (window.lucide) window.lucide.createIcons()
}

async function saveServicesCatalog() {
  const saveBtn = document.getElementById('btn-save-services-catalog')
  if (saveBtn) {
    saveBtn.disabled = true
    saveBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Salvando...</span>'
  }

  try {
    const res = await fetch('/api/admin/services-catalog', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state.servicesCatalog)
    })

    const json = await res.json()
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Erro ao salvar alterações do catálogo')
    }

    showToast('Catálogo de serviços e links atualizado com sucesso!', 'success')
    state.servicesCatalog = json.data
  } catch (err) {
    showToast(`Erro ao salvar: ${err.message}`, 'error')
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false
      saveBtn.innerHTML = '<i data-lucide="save" class="w-4 h-4"></i><span>Salvar Alterações</span>'
      if (window.lucide) window.lucide.createIcons()
    }
  }
}

// Modal de Novo Serviço
function openNewServiceModal(defaultSector = '') {
  const modal = document.getElementById('service-catalog-modal')
  if (!modal) return

  document.getElementById('service-form-title').value = ''
  document.getElementById('service-form-id').value = ''
  document.getElementById('service-form-sector').value = defaultSector || (state.sectors?.[0] || 'Maternidade & Família')
  document.getElementById('service-form-url').value = 'https://petrifotos.com.br/'
  document.getElementById('service-form-message').value =
    'Que notícia maravilhosa! 💛 Dá uma olhadinha em tudo o que preparamos para o {title} (fotos, propostas e detalhes de produção):\n🔗 {url}\n\nDá uma olhada com carinho e me avise qual opção combina mais com o que você imaginou! Se precisar de ajuda para escolher ou quiser consultar nossa agenda, estou por aqui. ✨'
  document.getElementById('service-form-active').checked = true

  modal.classList.remove('hidden')
  if (window.lucide) window.lucide.createIcons()
}

function closeNewServiceModal() {
  const modal = document.getElementById('service-catalog-modal')
  if (modal) modal.classList.add('hidden')
}

function autoFillSlug(title) {
  const idInput = document.getElementById('service-form-id')
  if (!idInput) return

  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  idInput.value = slug
}

async function handleAddNewService(event) {
  event.preventDefault()

  const id = document.getElementById('service-form-id').value.trim()
  const title = document.getElementById('service-form-title').value.trim()
  const sector = document.getElementById('service-form-sector').value.trim()
  const url = document.getElementById('service-form-url').value.trim()
  const humanizedMessage = document.getElementById('service-form-message').value.trim()
  const active = document.getElementById('service-form-active').checked

  if (!id || !title || !sector || !url || !humanizedMessage) {
    showToast('Preencha todos os campos obrigatórios!', 'error')
    return
  }

  const exists = (state.servicesCatalog || []).some(s => s.id === id)
  if (exists) {
    showToast(`O identificador "${id}" já está em uso por outro serviço!`, 'error')
    return
  }

  const newService = {
    id,
    title,
    sector,
    url,
    humanizedMessage,
    active
  }

  if (!state.servicesCatalog) state.servicesCatalog = []
  state.servicesCatalog.push(newService)
  if (!state.sectors.includes(sector)) {
    state.sectors.push(sector)
  }

  closeNewServiceModal()
  showToast(`Serviço "${title}" adicionado! Salvando no servidor...`, 'info')
  await saveServicesCatalog()
  renderSectorsFilterPills()
  renderServicesCatalog()
}

// ===================================================
// INICIALIZAÇÃO E EVENTOS
// ===================================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme()

  // Botões principais
  document.getElementById('btn-save-messages')?.addEventListener('click', saveMessages)
  document.getElementById('btn-reset-messages')?.addEventListener('click', resetMessages)
  document.getElementById('btn-refresh-data')?.addEventListener('click', () => {
    loadStats()
    if (state.currentMainTab === 'sessions') loadSessions()
    else if (state.currentMainTab === 'flowchart') loadFlowchart()
    else if (state.currentMainTab === 'whatsapp') loadWhatsAppInstances()
    else if (state.currentMainTab === 'messages') loadMessages()
    else if (state.currentMainTab === 'requests') loadRequests()
    else if (state.currentMainTab === 'catalogs') loadCatalogs()
    showToast('Dados sincronizados com o servidor.', 'info')
  })

  // Paginação
  document.getElementById('sessions-prev-btn')?.addEventListener('click', () => {
    if (state.pagination.page > 1) {
      state.pagination.page--
      loadSessions()
    }
  })

  document.getElementById('sessions-next-btn')?.addEventListener('click', () => {
    if (state.pagination.page < state.pagination.totalPages) {
      state.pagination.page++
      loadSessions()
    }
  })

  // Filtros de Sessões
  let searchTimeout = null
  document.getElementById('sessions-search-input')?.addEventListener('input', e => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      state.searchTerm = e.target.value.trim()
      state.pagination.page = 1
      loadSessions()
    }, 350)
  })

  document.getElementById('sessions-status-filter')?.addEventListener('change', e => {
    state.statusFilter = e.target.value
    state.pagination.page = 1
    loadSessions()
  })

  // Busca no Fluxograma
  let flowSearchTimeout = null
  document.getElementById('flow-search-input')?.addEventListener('input', e => {
    clearTimeout(flowSearchTimeout)
    flowSearchTimeout = setTimeout(() => {
      state.flowSearchTerm = e.target.value.trim()
      renderFlowchart()
    }, 300)
  })

  // Carregamento inicial de dados
  loadStats()
  loadSessions()
  loadMessages()

  if (window.lucide) {
    window.lucide.createIcons()
  }
})
