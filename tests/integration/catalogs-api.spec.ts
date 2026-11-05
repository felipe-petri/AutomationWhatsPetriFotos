import { describe, it, expect } from 'vitest'
import { buildApp } from '../../src/app.js'

describe('Admin Services Catalog API (UC-02 - Links & Mensagens Humanizadas)', () => {
  const app = buildApp()

  it('GET /api/admin/services-catalog deve retornar os setores e serviços configurados', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/services-catalog'
    })

    expect(res.statusCode).toBe(200)
    const json = JSON.parse(res.body)
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data.services)).toBe(true)
    expect(Array.isArray(json.data.sectors)).toBe(true)
    expect(json.data.services.length).toBeGreaterThanOrEqual(14)

    // Verifica campos obrigatórios de um serviço
    const gestante = json.data.services.find((s: any) => s.id === 'gestante')
    expect(gestante).toBeDefined()
    expect(gestante.title).toBe('Ensaio Gestante')
    expect(gestante.sector).toBe('Maternidade & Família')
    expect(gestante.url).toContain('https://')
    expect(gestante.humanizedMessage).toContain('{title}')
    expect(gestante.humanizedMessage).toContain('{url}')
    expect(typeof gestante.active).toBe('boolean')
  })

  it('PUT /api/admin/services-catalog deve rejeitar payload com URL inválida', async () => {
    const invalidPayload = [
      {
        id: 'teste-invalido',
        title: 'Ensaio Teste',
        sector: 'Maternidade & Família',
        url: 'url-sem-protocolo-invalida',
        humanizedMessage: 'Mensagem teste',
        active: true
      }
    ]

    const res = await app.inject({
      method: 'PUT',
      url: '/api/admin/services-catalog',
      payload: invalidPayload
    })

    expect(res.statusCode).toBe(400)
    const json = JSON.parse(res.body)
    expect(json.success).toBe(false)
    expect(json.error).toBe('ValidationError')
  })

  it('PUT /api/admin/services-catalog deve rejeitar payload vazio', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/admin/services-catalog',
      payload: []
    })

    expect(res.statusCode).toBe(400)
  })

  it('PUT /api/admin/services-catalog deve salvar e atualizar serviços com sucesso', async () => {
    const getRes = await app.inject({
      method: 'GET',
      url: '/api/admin/services-catalog'
    })
    const originalServices = JSON.parse(getRes.body).data.services

    const updatedServices = originalServices.map((s: any) => {
      if (s.id === 'gestante') {
        return {
          ...s,
          title: 'Ensaio Gestante Exclusivo'
        }
      }
      return s
    })

    const putRes = await app.inject({
      method: 'PUT',
      url: '/api/admin/services-catalog',
      payload: updatedServices
    })

    expect(putRes.statusCode).toBe(200)
    const putJson = JSON.parse(putRes.body)
    expect(putJson.success).toBe(true)

    // Restaura o original
    await app.inject({
      method: 'PUT',
      url: '/api/admin/services-catalog',
      payload: originalServices
    })
  })
})
