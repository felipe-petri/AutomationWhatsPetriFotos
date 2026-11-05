import { describe, expect, it } from 'vitest'
import { calculateBusinessDays } from '../../src/shared/utils/date.utils.js'

describe('calculateBusinessDays Utility', () => {
  it('deve retornar 0 quando a data inicial for igual ou posterior à final', () => {
    const today = new Date('2026-10-20T10:00:00Z')
    expect(calculateBusinessDays(today, today)).toBe(0)
    expect(calculateBusinessDays(today, '2026-10-19T10:00:00Z')).toBe(0)
  })

  it('deve calcular dias úteis corretamente excluindo sábados e domingos', () => {
    // 2026-10-16 é Sexta-feira
    // 2026-10-19 é Segunda-feira
    // Intervalo deve contar apenas 1 dia útil (a sexta transcorrida até segunda)
    const friday = new Date('2026-10-16T10:00:00Z')
    const monday = new Date('2026-10-19T10:00:00Z')

    expect(calculateBusinessDays(friday, monday)).toBe(1)
  })

  it('deve calcular uma semana de trabalho completa como 5 dias úteis', () => {
    // 2026-10-12 (Segunda) até 2026-10-19 (Segunda seguinte)
    const mon1 = new Date('2026-10-12T00:00:00Z')
    const mon2 = new Date('2026-10-19T00:00:00Z')

    expect(calculateBusinessDays(mon1, mon2)).toBe(5)
  })
})
