'use strict'
require('dotenv').config()

const User = require('@models/userModel.js')
const userPayload = require('@payloads/userPayload.js')
const userModal = new User()

module.exports = async function (fastify, opts) {
  fastify.post('/login/connect', async function (request, reply) {
    const { thirdwebAuth } = fastify

    const { address, chainId } = request.body
    // const user = await userModal.getUserByEmail(address)

    if (!address) {
      return res.status(400).send('Address is required')
    }

    try {
      let res = await thirdwebAuth.generatePayload({
        address,
        chainId: chainId ? parseInt(chainId) : undefined
      })

      reply.success({
        message: 'Sign up successful, please verify your phone number.',
        res
      })
    } catch (error) {
      console.log(error)
      reply.error({ message: 'User already exists, please login.' })
    }
  }),
    fastify.post('/login/verify', async function (request, reply) {
      const { thirdwebAuth } = fastify

      const { payload, signature } = request.body
      // const user = await userModal.getUserByEmail(address)
      if (!payload || !signature) {
        reply.error({ message: 'Payload is required' })
      }

      try {
        const verifiedPayload = await thirdwebAuth.verifyPayload(request.body)

        if (verifiedPayload.valid) {
          const jwt = await thirdwebAuth.generateJWT({
            payload: verifiedPayload.payload
          })
          reply.setCookie('jwt', jwt)
          reply.success({
            message: 'Sign up successful!',
            token: jwt
          })
        } else {
          reply.error({ message: 'Signature missmatch!' })
        }
      } catch (error) {
        console.log(error)
        reply.error({ message: 'Signature missmatch!' })
      }
    }),
    fastify.get('/is_in', async function (request, reply) {
      const { thirdwebAuth } = fastify

      const jwt = request.headers?.authorization

      console.log('headers', request.headers)

      const authResult = await thirdwebAuth.verifyJWT({ jwt })

      if (!authResult.valid) {
        reply.error({ message: 'Failure', authResult })
      }
      reply.success({
        message: 'Success'
      })
    })
}

module.exports.autoPrefix = '/twuser'
