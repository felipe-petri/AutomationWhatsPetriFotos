import { describe, expect, it } from 'vitest'
import { buildApp } from '../../src/app.js'

describe('WhatsApp API CRUD Integration Routes', () => {
  const app = buildApp()

  it('GET /api/admin/whatsapp-instances deve retornar a lista de instâncias', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/whatsapp-instances'
    })

    expect(res.statusCode).toBe(200)
    const json = JSON.parse(res.body)
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
    expect(json.data.length).toBeGreaterThan(0)
    expect(json.data[0].instanceName).toBeDefined()
  })

  it('POST /api/admin/whatsapp-instances deve validar payload e criar nova conexão', async () => {
    // 1. Payload inválido
    const invalidRes = await app.inject({
      method: 'POST',
      url: '/api/admin/whatsapp-instances',
      payload: {
        name: 'A' // muito curto
      }
    })
    expect(invalidRes.statusCode).toBe(400)

    // 2. Criação válida
    const validRes = await app.inject({
      method: 'POST',
      url: '/api/admin/whatsapp-instances',
      payload: {
        name: 'Instância Balcão 2',
        instanceName: 'petri_balcao_2',
        apiUrl: 'http://localhost:8080',
        apiKey: 'chave_secreta_teste',
        webhookUrl: 'http://localhost:3000/webhook/evolution'
      }
    })

    expect(validRes.statusCode).toBe(201)
    const json = JSON.parse(validRes.body)
    expect(json.success).toBe(true)
    expect(json.data.name).toBe('Instância Balcão 2')
    expect(json.data.instanceName).toBe('petri_balcao_2')

    const newId = json.data.id

    // 3. Atualizar conexão
    const updateRes = await app.inject({
      method: 'PUT',
      url: `/api/admin/whatsapp-instances/${newId}`,
      payload: {
        name: 'Instância Balcão 2 (Renomeada)'
      }
    })
    expect(updateRes.statusCode).toBe(200)
    const updateJson = JSON.parse(updateRes.body)
    expect(updateJson.data.name).toBe('Instância Balcão 2 (Renomeada)')

    // 4. Testar conexão (retorna ping amigável mesmo offline)
    const testRes = await app.inject({
      method: 'POST',
      url: `/api/admin/whatsapp-instances/${newId}/test`
    })
    expect(testRes.statusCode).toBe(200)

    // 5. Obter QR Code
    const qrRes = await app.inject({
      method: 'GET',
      url: `/api/admin/whatsapp-instances/${newId}/qrcode`
    })
    expect(qrRes.statusCode).toBe(200)
    const qrJson = JSON.parse(qrRes.body)
    expect(qrJson.data.qrcodeBase64).toBeDefined()

    // 6. Excluir conexão
    const delRes = await app.inject({
      method: 'DELETE',
      url: `/api/admin/whatsapp-instances/${newId}`
    })
    expect(delRes.statusCode).toBe(200)
  })
})
