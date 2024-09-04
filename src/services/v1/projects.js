'use strict'

module.exports = async function (fastify, opts) {
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      const { thirdwebAuth } = fastify
      const jwt = request.cookies?.jwt
      const authResult = await thirdwebAuth.verifyJWT({ jwt })

      if (!authResult.valid) {
        reply.error({ message: 'Failure' })
      }
    } catch (err) {
      reply.error(err)
    }
  })

  fastify.post('/projects', {}, async function (request, reply) {
    try {
    } catch (error) {
      console.log(error)
    }
    return reply
  })
}
