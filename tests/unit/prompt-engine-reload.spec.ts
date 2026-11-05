import { describe, expect, it } from 'vitest'
import { PromptEngine } from '../../src/core/prompts/prompt.engine.js'

describe('PromptEngine Dynamic Reload', () => {
  it('deve permitir atualizar mensagens em memória sem reiniciar o servidor', () => {
    const original = PromptEngine.getAll()

    const customMessages = {
      ...original,
      main_menu: {
        ...original.main_menu,
        welcome: 'Mensagem de boas-vindas modificada em tempo real!'
      }
    }

    PromptEngine.reload(customMessages)

    expect(PromptEngine.get('main_menu.welcome')).toBe(
      'Mensagem de boas-vindas modificada em tempo real!'
    )

    // Restaura estado original
    PromptEngine.reload(original)
  })

  it('deve ler valores numéricos e brutos com getRaw', () => {
    const price = PromptEngine.getRaw<number>('document_photos.price')
    expect(price).toBe(30)

    const slaDays = PromptEngine.getRaw<number>('alboom.production_days_sla')
    expect(slaDays).toBe(10)
  })
})
