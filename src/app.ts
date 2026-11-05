import cors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import fastify, { FastifyInstance } from 'fastify'
import path from 'path'
import { fileURLToPath } from 'url'
import { AppError } from './core/errors/index.js'
import { webhookRoutes } from './modules/webhook/webhook.routes.js'
import { adminRoutes } from './modules/admin/admin.routes.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function buildApp(): FastifyInstance {
  const app = fastify({
    logger: true
  })

  app.register(cors, {
    origin: '*'
  })

  // Healthcheck
  app.get('/health', async () => {
    return { status: 'ok', uptime: process.uptime() }
  })

  // Redirecionamento amigável /admin -> /admin/
  app.get('/admin', async (_request, reply) => {
    return reply.redirect('/admin/')
  })

  // Servir Dashboard Administrativo estático
  const publicPath = path.resolve(__dirname, '../public/admin')
  app.register(fastifyStatic, {
    root: publicPath,
    prefix: '/admin/',
    decorateReply: false
  })

  // Registro das rotas da API
  app.register(webhookRoutes)
  app.register(adminRoutes)

  // Tratamento global de erros
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: error.name,
        message: error.message
      })
    }

    request.log.error(error)
    return reply.status(500).send({
      error: 'InternalServerError',
      message: 'Ocorreu um erro interno no servidor.'
    })
  })

  return app
}
