import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fsmRouter } from '../../src/core/fsm/fsm.router.js'
import { servicesCatalogService } from '../../src/modules/catalogs/services-catalog.service.js'

describe('Catalogs FSM Flow & Services Links (UC-02)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('deve navegar de MAIN_MENU (opção 2) para CATALOGS_MENU', async () => {
    const result = await fsmRouter.execute({
      remoteJid: '5511999990001@s.whatsapp.net',
      senderName: 'Cliente Teste',
      currentState: 'MAIN_MENU',
      contextData: {},
      textInput: '2'
    })

    expect(result.nextState).toBe('CATALOGS_MENU')
    expect(result.updatedContext.selectedMenu).toBe('CATALOGS_MENU')
    expect(result.replyMessage).toContain('Escolha o catálogo ou orçamento')
  })

  it('deve disparar mensagem humanizada com link oficial para Ensaio Gestante (opção 1)', async () => {
    const result = await fsmRouter.execute({
      remoteJid: '5511999990001@s.whatsapp.net',
      senderName: 'Cliente Teste',
      currentState: 'CATALOGS_MENU',
      contextData: {},
      textInput: '1'
    })

    expect(result.nextState).toBe('IDLE')
    expect(result.replyMessage).toContain('Ensaio Gestante')
    expect(result.replyMessage).toContain('https://petrifotos.com.br/gestante')
    expect(result.replyMessage).toContain('🔗')
    expect(result.updatedContext.lastServiceId).toBe('gestante')
  })

  it('deve abrir o submenu de Aniversário Infantil (opção 5)', async () => {
    const result = await fsmRouter.execute({
      remoteJid: '5511999990001@s.whatsapp.net',
      senderName: 'Cliente Teste',
      currentState: 'CATALOGS_MENU',
      contextData: {},
      textInput: '5'
    })

    expect(result.nextState).toBe('CATALOGS_SUBMENU_INFANTIL')
    expect(result.updatedContext.catalogOption).toBe('aniversario-infantil')
    expect(result.replyMessage).toContain('Pacotes 2026')
    expect(result.replyMessage).toContain('Pacotes 2027')
  })

  it('deve responder com link de 2026 ao escolher opção 1 no submenu infantil', async () => {
    const result = await fsmRouter.execute({
      remoteJid: '5511999990001@s.whatsapp.net',
      senderName: 'Cliente Teste',
      currentState: 'CATALOGS_SUBMENU_INFANTIL',
      contextData: { catalogOption: 'aniversario-infantil' },
      textInput: '1'
    })

    expect(result.nextState).toBe('IDLE')
    expect(result.replyMessage).toContain('Aniversário Infantil (2026)')
    expect(result.replyMessage).toContain('https://petrifotos.com.br/aniversario-infantil-2026')
  })

  it('deve responder com link de 2027 ao escolher opção 2 no submenu infantil', async () => {
    const result = await fsmRouter.execute({
      remoteJid: '5511999990001@s.whatsapp.net',
      senderName: 'Cliente Teste',
      currentState: 'CATALOGS_SUBMENU_INFANTIL',
      contextData: { catalogOption: 'aniversario-infantil' },
      textInput: '2'
    })

    expect(result.nextState).toBe('IDLE')
    expect(result.replyMessage).toContain('Aniversário Infantil (2027)')
    expect(result.replyMessage).toContain('https://petrifotos.com.br/aniversario-infantil-2027')
  })

  it('deve permitir voltar do submenu infantil para o menu de catálogos digitando 0 ou voltar', async () => {
    const result = await fsmRouter.execute({
      remoteJid: '5511999990001@s.whatsapp.net',
      senderName: 'Cliente Teste',
      currentState: 'CATALOGS_SUBMENU_INFANTIL',
      contextData: { catalogOption: 'aniversario-infantil' },
      textInput: '0'
    })

    expect(result.nextState).toBe('CATALOGS_MENU')
    expect(result.replyMessage).toContain('Escolha o catálogo ou orçamento')
  })

  it('deve abrir o submenu de Natal Sazonal (opção 12)', async () => {
    const result = await fsmRouter.execute({
      remoteJid: '5511999990001@s.whatsapp.net',
      senderName: 'Cliente Teste',
      currentState: 'CATALOGS_MENU',
      contextData: {},
      textInput: '12'
    })

    expect(result.nextState).toBe('CATALOGS_SUBMENU_NATAL')
    expect(result.updatedContext.catalogOption).toBe('natal')
    expect(result.replyMessage).toContain('Lote Novembro')
    expect(result.replyMessage).toContain('Lote Dezembro')
  })

  it('deve responder com link de Natal Novembro ao escolher opção 1 no submenu de Natal', async () => {
    const result = await fsmRouter.execute({
      remoteJid: '5511999990001@s.whatsapp.net',
      senderName: 'Cliente Teste',
      currentState: 'CATALOGS_SUBMENU_NATAL',
      contextData: { catalogOption: 'natal' },
      textInput: '1'
    })

    expect(result.nextState).toBe('IDLE')
    expect(result.replyMessage).toContain('Ensaio de Natal (Lote Novembro)')
    expect(result.replyMessage).toContain('https://petrifotos.com.br/natal-novembro')
  })

  it('deve tratar cordialmente quando o serviço estiver inativo ou não encontrado', async () => {
    vi.spyOn(servicesCatalogService, 'getById').mockReturnValue(undefined)

    const result = await fsmRouter.execute({
      remoteJid: '5511999990001@s.whatsapp.net',
      senderName: 'Cliente Teste',
      currentState: 'CATALOGS_MENU',
      contextData: {},
      textInput: '1'
    })

    expect(result.nextState).toBe('IDLE')
    expect(result.replyMessage).toContain('estão sendo atualizadas em nosso site oficial')
    expect(result.replyMessage).toContain('falar com nossa produtora')
  })
})
