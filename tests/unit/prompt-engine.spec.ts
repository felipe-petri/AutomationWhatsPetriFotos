import { describe, expect, it } from 'vitest'
import { PromptEngine } from '../../src/core/prompts/prompt.engine.js'

describe('PromptEngine', () => {
  it('deve carregar as mensagens do menu principal corretamente', () => {
    const welcome = PromptEngine.get('main_menu.welcome')
    expect(welcome).toContain('Petri Fotos')
    expect(welcome).toContain('Fotos para Documento')
  })

  it('deve interpolar parâmetros dinâmicos corretamente', () => {
    const interpolated = PromptEngine.get('personal_prints.quote_and_pix', {
      TOTAL_PHOTOS: 15,
      PHOTO_SIZE: '10x15',
      TOTAL_PRICE: '45,00',
      PIX_COPIA_E_COLA: '00020126580014br.gov.bcb.pix...'
    })

    expect(interpolated).toContain('15 fotos')
    expect(interpolated).toContain('10x15')
    expect(interpolated).toContain('R$ 45,00')
    expect(interpolated).toContain('00020126580014br.gov.bcb.pix...')
  })

  it('deve lançar erro caso a chave de mensagem não exista', () => {
    expect(() => PromptEngine.get('chave_inexistente.subchave')).toThrowError(
      'Mensagem não encontrada para a chave: "chave_inexistente.subchave"'
    )
  })
})
