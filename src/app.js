'use strict'
require('dotenv').config()
// Require external modules
const path = require('path')
const autoload = require('@fastify/autoload')
const swagger = require('@fastify/swagger')

const Etag = require('@fastify/etag')
const cors = require('@fastify/cors')
const fastifyMultipart = require('@fastify/multipart')

// Import Swagger Options
const swaggerConf = require('@configs/swagger')

module.exports = function (fastify, opts, next) {
  fastify.register(cors, {
    origin: true,
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept'],
    credentials: true,
    maxAge: 8400,
    preflightContinue: true
  })
  fastify.register(swagger, swaggerConf.options)
  fastify.register(Etag)
  fastify.register(fastifyMultipart)

  fastify.register(require('@fastify/cookie'), {
    secret: process.env.COOKIE_SECRET,
    hook: 'onRequest'
  })

  fastify.register(require('@fastify/jwt'), {
    secret: process.env.JWT_SECRET
  })

  fastify.register(autoload, {
    dir: path.join(__dirname, 'plugins')
  })
  fastify.register(autoload, {
    dir: path.join(__dirname, 'services/v1/'),
    options: Object.assign({ prefix: '/api/v1' }, opts)
  })
  fastify.register(autoload, {
    dir: path.join(__dirname, 'services/admin/'),
    options: Object.assign({ prefix: '/api/v1/admin' }, opts)
  })

  fastify.decorate('authenticate', async function (request, reply) {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.send(err)
    }
  })
  next()
}
