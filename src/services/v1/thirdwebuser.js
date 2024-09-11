'use strict'
require('dotenv').config()

const User = require('@models/userModel.js')
const userPayload = require('@payloads/userPayload.js')

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
      const userModal = new User()

      const { payload, signature } = request.body
      if (!payload || !signature) {
        reply.error({ message: 'Payload is required' })
      }

      try {
        const verifiedPayload = await thirdwebAuth.verifyPayload(request.body)
        const user = await userModal.getUserByWalet(payload.address)

        let newUsr = {}
        if (user === null) {
          newUsr = await User.create({
            wallet: payload.address,
            isVerified: true,
            userIdRef: payload.nonce
          })
        }
        if (verifiedPayload.valid) {
          const jwt = await thirdwebAuth.generateJWT({
            payload: verifiedPayload.payload
          })
          reply
            .setCookie('jwt', jwt, {
              path: '/',
              httpOnly: true,
              sameSite: true,
              maxAge: '604800',
              overwrite: true
            })
            .success({
              message: 'Sign up successful!',
              token: jwt,
              newUsr: newUsr
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
      const authResult = await thirdwebAuth.verifyJWT({ jwt })
      const userModal = new User()
      const user = await userModal.getUserByWalet(authResult.parsedJWT.sub)

      if (!authResult.valid) {
        reply.error({ message: authResult.error })
      }
      reply.success({
        message: 'Success',
        authResult,
        user: user || {}
      })
    }),
    fastify.patch('/me', async function (request, reply) {
      const { thirdwebAuth } = fastify

      const jwt = request.headers?.authorization
      const authResult = await thirdwebAuth.verifyJWT({ jwt })

      if (!authResult.valid) {
        reply.error({ message: 'Faild to authenticate' })
      }
      const currentUser = authResult.parsedJWT

      const { name, profileImage } = request.body
      const { sub } = currentUser

      console.log('currentUser', currentUser)

      if (!sub) {
        return reply.error({ message: 'Faild to authenticate' })
      }

      try {
        const userModal = new User()
        const user = await userModal.updateUser(sub, { name, profileImage })
        if (!user) {
          reply.error({ message: 'Failed to update' })
        }
        reply.success({
          message: 'Edit successfull',
          res
        })
      } catch (error) {
        console.log(error)
        reply.error({ message: 'Unknown error.' })
      }
    })
}

module.exports.autoPrefix = '/twuser'
