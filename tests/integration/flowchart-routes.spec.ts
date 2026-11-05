import { describe, expect, it } from 'vitest'
import { buildApp } from '../../src/app.js'

describe('Flowchart Q&A Integration Routes', () => {
  const app = buildApp()

  it('GET /api/admin/flowchart deve retornar os nós e conexões do fluxo de conversa', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/flowchart'
    })

    expect(res.statusCode).toBe(200)
    const json = JSON.parse(res.body)
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data.nodes)).toBe(true)
    expect(Array.isArray(json.data.edges)).toBe(true)

    // Valida nós essenciais
    const nodeIds = json.data.nodes.map((n: any) => n.id)
    expect(nodeIds).toContain('node-main-menu')
    expect(nodeIds).toContain('node-document-photos')
    expect(nodeIds).toContain('node-alboom-menu')
    expect(nodeIds).toContain('node-human-attendance')
  })

  it('PUT /api/admin/flowchart/node/:id deve atualizar texto de nó do fluxo', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/admin/flowchart/node/node-document-photos',
      payload: {
        title: 'Fotos para Documento (Título Atualizado)'
      }
    })

    expect(res.statusCode).toBe(200)
    const json = JSON.parse(res.body)
    expect(json.success).toBe(true)
    expect(json.data.title).toBe('Fotos para Documento (Título Atualizado)')
  })

  it('POST e DELETE de nó customizado no fluxograma', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/admin/flowchart/node',
      payload: {
        title: 'Dúvidas sobre Molduras',
        category: 'Personalizado',
        triggerDescription: 'Cliente pergunta sobre molduras de quadros',
        messageText: 'Trabalhamos com molduras em madeira nobre e paspatur anti-mofo! Venha conferir nosso mostruário no estúdio.'
      }
    })

    expect(createRes.statusCode).toBe(201)
    const createdJson = JSON.parse(createRes.body)
    expect(createdJson.data.id).toBeDefined()
    const customId = createdJson.data.id

    // Exclusão
    const delRes = await app.inject({
      method: 'DELETE',
      url: `/api/admin/flowchart/node/${customId}`
    })
    expect(delRes.statusCode).toBe(200)
  })

  it('POST /api/admin/messages/node e DELETE /api/admin/messages/node/:nodeId com proteção de nós essenciais', async () => {
    // 1. Criação com id customizado e parentId
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/admin/messages/node',
      payload: {
        id: 'promocao-dia-das-maes',
        parentId: 'node-main-menu',
        title: 'Promoção Dia das Mães',
        category: 'Personalizado',
        triggerDescription: 'Opção 8 ou "dia das mães"',
        messageText: 'Garanta seu ensaio de Dia das Mães com 10% de desconto!'
      }
    })

    expect(createRes.statusCode).toBe(201)
    const createdJson = JSON.parse(createRes.body)
    expect(createdJson.success).toBe(true)
    expect(createdJson.data.id).toBe('node-promocao-dia-das-maes')

    // 2. Verifica se a ligação lógica (edge) foi gerada a partir do nó pai
    const flowRes = await app.inject({
      method: 'GET',
      url: '/api/admin/flowchart'
    })
    const flowJson = JSON.parse(flowRes.body)
    const matchingEdge = flowJson.data.edges.find((e: any) => e.from === 'node-main-menu' && e.to === 'node-promocao-dia-das-maes')
    expect(matchingEdge).toBeDefined()

    // 3. Tentar deletar nó protegido (deve falhar com 400)
    const protectedDelRes = await app.inject({
      method: 'DELETE',
      url: '/api/admin/messages/node/node-main-menu'
    })
    expect(protectedDelRes.statusCode).toBe(400)
    const protectedJson = JSON.parse(protectedDelRes.body)
    expect(protectedJson.message).toContain('protegidos')

    // 4. Deletar o nó customizado criado
    const deleteRes = await app.inject({
      method: 'DELETE',
      url: '/api/admin/messages/node/node-promocao-dia-das-maes'
    })
    expect(deleteRes.statusCode).toBe(200)
    const deleteJson = JSON.parse(deleteRes.body)
    expect(deleteJson.success).toBe(true)
  })
})
