import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'

export interface FlowNode {
  id: string
  title: string
  category: 'Geral' | 'Documentos' | 'Catálogos' | 'Revelação' | 'Estúdio' | 'Alboom' | 'Sacramental' | 'Atendimento' | string
  type: 'TRIGGER' | 'ROOT_MENU' | 'SUBMENU' | 'INFO_RESPONSE' | 'COLLECT_INPUT' | 'PIX_PAYMENT' | 'HUMAN_TRANSFER' | string
  state: string
  triggerDescription: string
  messageText: string
  slaNotice?: string
  icon?: string
  options?: Array<{
    id: string
    trigger: string
    label: string
    targetNodeId: string
  }>
}

export interface FlowEdge {
  id: string
  from: string
  to: string
  trigger?: string
  label?: string
}

export interface FlowchartViewProps {
  nodes?: FlowNode[]
  edges?: FlowEdge[]
  selectedNodeId?: string | null
  onSelectNode?: (nodeId: string) => void
  onNavigateToManager?: (nodeId: string) => void
  onEditNodeModal?: (nodeId: string) => void
}

const DEFAULT_POSITIONS: Record<string, { x: number; y: number }> = {
  'trigger-start': { x: 40, y: 530 },
  'node-main-menu': { x: 430, y: 470 },
  // Coluna 2 (Opções Primárias)
  'node-document-photos': { x: 880, y: 40 },
  'node-catalogs-menu': { x: 880, y: 240 },
  'node-personal-prints': { x: 880, y: 450 },
  'node-studio-sessions': { x: 880, y: 660 },
  'node-alboom-menu': { x: 880, y: 870 },
  'node-sacramental': { x: 880, y: 1080 },
  'node-human-attendance': { x: 880, y: 1290 },
  'node-fallback-error': { x: 880, y: 1490 },
  // Coluna 3 (Sub-níveis / Coletas)
  'node-catalog-maternidade': { x: 1320, y: 130 },
  'node-catalog-comemoracoes': { x: 1320, y: 270 },
  'node-catalog-estudio': { x: 1320, y: 410 },
  'node-personal-prints-pix': { x: 1320, y: 550 },
  'node-alboom-ask-info': { x: 1320, y: 770 },
  'node-alboom-ask-confirm': { x: 1320, y: 970 },
  'node-sacramental-received': { x: 1320, y: 1160 },
  // Coluna 4 (Confirmações Finais e SLAs)
  'node-alboom-wait-hours': { x: 1760, y: 770 },
  'node-alboom-confirmed': { x: 1760, y: 970 }
}

export const FlowchartView: React.FC<FlowchartViewProps> = ({
  nodes = [],
  edges = [],
  selectedNodeId: initialSelectedId,
  onSelectNode,
  onNavigateToManager,
  onEditNodeModal
}) => {
  const [selectedId, setSelectedId] = useState<string>(initialSelectedId || 'node-main-menu')
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos')
  const [searchTerm, setSearchTerm] = useState<string>('')

  // Canvas Pan & Zoom State
  const [zoom, setZoom] = useState<number>(0.85)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 30, y: 30 })
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)

  const canvasWrapperRef = useRef<HTMLDivElement>(null)

  // Sincroniza seleção externa
  useEffect(() => {
    if (initialSelectedId) {
      setSelectedId(initialSelectedId)
    }
  }, [initialSelectedId])

  const activeNode = useMemo(() => {
    return nodes.find(n => n.id === (hoveredNodeId || selectedId)) || nodes.find(n => n.id === selectedId) || null
  }, [nodes, selectedId, hoveredNodeId])

  // Filtragem dos nós
  const filteredNodes = useMemo(() => {
    return nodes.filter(n => {
      const matchCat = categoryFilter === 'Todos' || n.category === categoryFilter || n.id === 'trigger-start' || n.id === 'node-main-menu'
      const matchSearch = !searchTerm || n.title.toLowerCase().includes(searchTerm.toLowerCase()) || n.messageText.toLowerCase().includes(searchTerm.toLowerCase())
      return matchCat && matchSearch
    })
  }, [nodes, categoryFilter, searchTerm])

  const visibleNodeIds = useMemo(() => new Set(filteredNodes.map(n => n.id)), [filteredNodes])

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, textarea, a, .flow-node-card, .flow-edge-badge')) {
      return
    }
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }, [pan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY < 0 ? 0.08 : -0.08
    setZoom(prev => Math.min(2.0, Math.max(0.35, parseFloat((prev + delta).toFixed(2)))))
  }, [])

  const handleFitView = useCallback(() => {
    if (!canvasWrapperRef.current) return
    const w = canvasWrapperRef.current.clientWidth || 800
    const h = canvasWrapperRef.current.clientHeight || 680
    const contentW = 2150
    const contentH = 1680

    const scaleX = w / contentW
    const scaleY = h / contentH
    const fitScale = Math.min(scaleX, scaleY, 0.95)

    setZoom(Math.max(0.35, parseFloat(fitScale.toFixed(2))))
    setPan({
      x: Math.round((w - contentW * fitScale) / 2),
      y: 20
    })
  }, [])

  const handleNodeClick = (nodeId: string) => {
    setSelectedId(nodeId)
    onSelectNode?.(nodeId)
  }

  const handleNavigate = (nodeId: string) => {
    setSelectedId(nodeId)
    onSelectNode?.(nodeId)
    onNavigateToManager?.(nodeId)
  }

  // Cálculo da Curva de Bézier Cúbica
  const computeBezierPath = (fromId: string, toId: string) => {
    const p1 = DEFAULT_POSITIONS[fromId]
    const p2 = DEFAULT_POSITIONS[toId]
    if (!p1 || !p2) return { d: '', midX: 0, midY: 0 }

    const cardW = 320
    const cardH = 155

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
      return { d, midX: (startX + endX) / 2, midY: (startY + endY) / 2 }
    } else {
      const startX = p1.x + cardW / 2
      const startY = p1.y + cardH
      const endX = p2.x + cardW / 2
      const endY = p2.y + cardH
      const drop = 70
      const d = `M ${startX} ${startY} C ${startX} ${startY + drop}, ${endX} ${endY + drop}, ${endX} ${endY}`
      return { d, midX: (startX + endX) / 2, midY: Math.max(startY, endY) + drop - 12 }
    }
  }

  return (
    <div className="space-y-5 w-full select-none font-sans text-slate-800 dark:text-slate-100">
      
      {/* Barra de Filtros e Busca */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Fluxograma Q&A Interativo</h2>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
              Tela Única Dinâmica
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Clique em qualquer balão para focar na edição do conteúdo na aba Gerenciador de Mensagens e Preços.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar nó..."
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none w-52"
          />
        </div>
      </div>

      {/* Grid Principal: Canvas (8 cols) + Lateral de Prévia WhatsApp (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Canvas Interativo */}
        <div className="lg:col-span-8 space-y-3">
          
          {/* Controles de Zoom e Canvas */}
          <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{filteredNodes.length} Nós Conectados</span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="text-[11px] text-slate-400">Arraste para mover • Scroll para zoom</span>
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={() => setZoom(z => Math.max(0.35, parseFloat((z - 0.15).toFixed(2))))} 
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition" 
                title="Diminuir Zoom">
                ➖
              </button>
              <button 
                onClick={() => { setZoom(0.85); setPan({ x: 30, y: 30 }) }} 
                className="px-2 py-1 rounded-lg text-[11px] font-mono text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition" 
                title="Resetar Zoom">
                {Math.round(zoom * 100)}%
              </button>
              <button 
                onClick={() => setZoom(z => Math.min(2.0, parseFloat((z + 0.15).toFixed(2))))} 
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition" 
                title="Aumentar Zoom">
                ➕
              </button>
              <button 
                onClick={handleFitView} 
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition" 
                title="Ajustar à Tela">
                Ajustar
              </button>
              <button 
                onClick={() => setIsFullscreen(f => !f)} 
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition" 
                title="Tela Cheia">
                ⛶
              </button>
            </div>
          </div>

          {/* Canvas Wrapper */}
          <div
            ref={canvasWrapperRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            className={`flowchart-canvas-wrapper h-[680px] w-full border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden bg-slate-50 dark:bg-slate-900 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen' : ''}`}
            style={{
              backgroundImage: 'radial-gradient(#94a3b8 1.2px, transparent 1.2px)',
              backgroundSize: '24px 24px'
            }}>

            {/* Viewport Transformado */}
            <div
              className="absolute top-0 left-0 transition-transform duration-75 origin-top-left"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
              }}>
              
              {/* SVG Conectores e Setas */}
              <svg width="2250" height="1750" className="absolute top-0 left-0 pointer-events-auto overflow-visible">
                <defs>
                  <marker id="react-arrowhead" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
                    <polygon points="0 0, 10 4, 0 8" fill="#6366f1" />
                  </marker>
                  <marker id="react-arrowhead-active" markerWidth="11" markerHeight="9" refX="10" refY="4.5" orient="auto">
                    <polygon points="0 0, 11 4.5, 0 9" fill="#3b82f6" />
                  </marker>
                </defs>

                {/* Linhas Bézier */}
                {edges.map(edge => {
                  if (!visibleNodeIds.has(edge.from) || !visibleNodeIds.has(edge.to)) return null
                  const { d, midX, midY } = computeBezierPath(edge.from, edge.to)
                  if (!d) return null
                  const isActive = selectedId === edge.from || selectedId === edge.to

                  return (
                    <g key={edge.id}>
                      <path
                        d={d}
                        fill="none"
                        stroke={isActive ? '#4f46e5' : '#94a3b8'}
                        strokeWidth={isActive ? 3.2 : 2.2}
                        strokeDasharray={isActive ? '6 3' : undefined}
                        markerEnd={isActive ? 'url(#react-arrowhead-active)' : 'url(#react-arrowhead)'}
                        className="transition-colors duration-200"
                      />
                      {/* Badge da Transição */}
                      <g
                        className="cursor-pointer flow-edge-badge"
                        onClick={() => handleNodeClick(edge.to)}
                        title={`Transição: ${edge.label || edge.trigger}`}>
                        <rect
                          x={midX - Math.max(76, (edge.label?.length || 8) * 6.8 + 20) / 2}
                          y={midY - 11}
                          width={Math.max(76, (edge.label?.length || 8) * 6.8 + 20)}
                          height={22}
                          rx={11}
                          className="fill-white dark:fill-slate-800 stroke-indigo-300 dark:stroke-indigo-800 shadow-sm"
                          strokeWidth="1.2"
                        />
                        <text
                          x={midX}
                          y={midY + 4}
                          textAnchor="middle"
                          className="fill-indigo-700 dark:fill-indigo-300 font-mono text-[10.5px] font-semibold">
                          {edge.label || `Se ${edge.trigger}`}
                        </text>
                      </g>
                    </g>
                  )
                })}
              </svg>

              {/* Nós do Fluxograma */}
              <div className="relative">
                {filteredNodes.map(node => {
                  const coords = DEFAULT_POSITIONS[node.id] || { x: 1320, y: 1300 }
                  const isSelected = selectedId === node.id

                  return (
                    <div
                      key={node.id}
                      onClick={() => handleNodeClick(node.id)}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      style={{ left: `${coords.x}px`, top: `${coords.y}px` }}
                      className={`flow-node-card absolute w-[320px] rounded-2xl border p-3.5 space-y-2.5 shadow-sm transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/30 ring-2 ring-indigo-500/40 shadow-lg'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-400 hover:shadow-md'
                      }`}>
                      
                      {/* Cabeçalho */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="text-[9.5px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                            {node.category || 'Geral'}
                          </span>
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs leading-snug truncate mt-1" title={node.title}>
                            {node.title}
                          </h4>
                        </div>

                        {/* Botão de Edição Rápida */}
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            handleNavigate(node.id)
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition"
                          title="Focar no Gerenciador de Mensagens">
                          ✏️
                        </button>
                      </div>

                      {/* Gatilho */}
                      <div className="text-[10.5px] bg-slate-50 dark:bg-slate-700/40 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-700/60 flex items-center gap-1 text-slate-600 dark:text-slate-300">
                        <span className="font-semibold text-slate-400 text-[9.5px] uppercase">Gatilho:</span>
                        <span className="font-mono text-indigo-600 dark:text-indigo-400 font-medium truncate">{node.triggerDescription}</span>
                      </div>

                      {/* Balão WhatsApp Snippet */}
                      <div className="p-2 text-[11px] text-slate-700 dark:text-slate-300 bg-slate-50/70 dark:bg-slate-900/40 rounded-lg border border-slate-100 dark:border-slate-700/60 font-sans line-clamp-2 leading-snug">
                        {node.messageText || 'Sem mensagem'}
                      </div>

                      {/* Rodapé do Nó */}
                      <div className="pt-1 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium">Clique para editar &rarr;</span>
                        <span className="font-mono text-[9px] text-slate-400">{node.options?.length || 0} conexões</span>
                      </div>
                    </div>
                  )
                })}
              </div>

            </div>

          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
            <span>💡 Clique em qualquer balão para navegar automaticamente para o formulário correspondente com foco animado.</span>
            <span className="font-mono text-[10px]">React • Tailwind CSS</span>
          </div>

        </div>

        {/* Coluna Direita: Inspetor do Nó Selecionado & Simulador WhatsApp */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Card Inspetor */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                👁️ Nó em Foco
              </span>
              <button
                onClick={() => activeNode && onEditNodeModal?.(activeNode.id)}
                className="text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold transition">
                Modal Rápido
              </button>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                {activeNode?.title || 'Selecione um nó'}
              </h3>
              <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                {activeNode?.category || 'Geral'} • {activeNode?.state || 'ESTADO'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Gatilho do Cliente</span>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-mono bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg mt-0.5 break-words">
                {activeNode?.triggerDescription || '--'}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Resposta do Bot</span>
              <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans bg-slate-50 dark:bg-slate-700/50 p-2.5 rounded-lg mt-0.5 max-h-36 overflow-y-auto leading-relaxed border border-slate-100 dark:border-slate-700">
                {activeNode?.messageText || 'Clique em qualquer nó do fluxograma à esquerda para inspecionar e editar.'}
              </div>
            </div>

            {activeNode?.slaNotice && (
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Regra de Negócio / SLA</span>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 p-2 rounded-lg mt-0.5 font-medium">
                  {activeNode.slaNotice}
                </p>
              </div>
            )}

            {/* Botão Proeminente de Redirecionamento para Gerenciador */}
            <button
              onClick={() => activeNode && handleNavigate(activeNode.id)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md transition transform active:scale-95">
              <span>✏️</span>
              <span>Editar no Gerenciador de Mensagens</span>
            </button>
          </div>

          {/* Mini Simulador WhatsApp Live */}
          <div className="bg-slate-900 rounded-[2rem] p-3 shadow-xl border-4 border-slate-800">
            <div className="w-20 h-3 bg-slate-800 rounded-full mx-auto mb-2"></div>
            <div className="bg-[#efeae2] dark:bg-[#0b141a] rounded-[1.5rem] overflow-hidden flex flex-col h-[340px] border border-slate-700/30">
              <div className="bg-[#008069] dark:bg-[#202c33] text-white px-3 py-2 flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-[10px]">PF</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate leading-tight">Petri Fotos Oficial</p>
                  <p className="text-[9px] text-emerald-200">automação ativa</p>
                </div>
              </div>
              <div className="flex-1 p-2.5 overflow-y-auto space-y-2 text-xs">
                <div className="whatsapp-bubble-received p-2.5 max-w-[95%] text-slate-800 dark:text-slate-100 bg-white dark:bg-[#202c33] rounded-lg shadow-sm">
                  <div className="whitespace-pre-wrap text-[11px] leading-relaxed break-words">
                    {activeNode?.messageText || 'Selecione um nó do fluxograma para visualizar aqui em tempo real.'}
                  </div>
                  <div className="text-[9px] text-right mt-1 text-slate-400 font-mono">10:00</div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}

export default FlowchartView
