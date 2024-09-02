'use strict'

module.exports = async function (fastify, opts) {
  fastify.get('/projects/list', {}, async function (request, reply) {
    try {
    } catch (error) {
      console.log(error)
    }
    return reply
  })
}
