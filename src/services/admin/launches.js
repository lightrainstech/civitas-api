'use strict'
const Launch = require('@models/launchModel.js')
const { isAdminWallet } = require('@utils/index.js')
require('dotenv').config()

module.exports = async function (fastify, opts) {
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      const { thirdwebAuth } = fastify
      const jwt = request.headers?.authorization
      const authResult = await thirdwebAuth.verifyJWT({ jwt })
      if (!authResult.valid) {
        reply.error({ message: 'Failed to authenticate' })
      } else {
        request.log.info('Token Valid')
        const currentUser = authResult.parsedJWT
        const { sub } = currentUser
        if (!isAdminWallet(sub)) {
          reply.error({ message: 'You are not authorized to access this page' })
        }
      }
    } catch (err) {
      console.log('jwt err', err)
      reply.error(err)
    }
  }),
    fastify.post('/launches/list', async function (request, reply) {
      try {
        const { status = ['upcoming'] } = request.body
        const launchModel = new Launch()
        const launchList = await launchModel.getAllLaunchesAdmin(status)
        if (!projectsList) {
          return reply.error({ message: 'No project matching status' })
        }
        reply.success({
          data: projectsList
        })
      } catch (err) {
        console.log(err)
        reply.error({
          message: 'Unknown error',
          error: err.message
        })
      }
    })
}
