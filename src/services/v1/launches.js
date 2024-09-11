'use strict'
const Launch = require('@models/launchModel.js')

module.exports = async function (fastify, opts) {
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      const { thirdwebAuth } = fastify
      const jwt = request.headers?.authorization
      const authResult = await thirdwebAuth.verifyJWT({ jwt })
      if (!authResult.valid) {
        reply.error({ message: 'Failure' })
      }
      request.log.info('Token Valid')
      request.user = authResult.parsedJWT
    } catch (err) {
      console.log(err)
      reply.error(err)
    }
  })

  fastify.post('/launches', async function (request, reply) {
    try {
      const data = request.body
      const { user } = request
      data.owner = user.sub

      // Recursive function to filter out empty or undefined fields
      function cleanData(input) {
        if (Array.isArray(input)) {
          return input
            .map(item => cleanData(item)) // Clean each item in array
            .filter(item => Object.keys(item).length > 0) // Remove empty objects
        } else if (typeof input === 'object' && input !== null) {
          const cleanedObject = {}
          Object.keys(input).forEach(key => {
            const value = cleanData(input[key])
            if (
              value !== undefined &&
              value !== null &&
              value !== '' &&
              Object.keys(value).length > 0
            ) {
              cleanedObject[key] = value
            }
          })
          return cleanedObject
        }
        return input // Return primitive values as they are
      }

      const launchData = cleanData(data) // Clean the input data

      // Insert launchData into the database
      const launch = new Launch(launchData)
      const savedLaunch = await launch.save()

      reply.success({
        message: 'Launch created successfully',
        data: savedLaunch
      })
    } catch (err) {
      reply.error({
        message: 'Failed to create launch',
        error: err.message
      })
    }
  })

  fastify.get('/launches', async function (request, reply) {
    try {
      const { user } = request
      const launch = new Launch()
      const savedLaunchs = await launch.getLaunchsOwned(user.sub)
      reply.success({
        message: 'Success',
        launches: savedLaunchs
      })
    } catch (err) {
      reply.error({
        message: 'Failed',
        error: err.message
      })
    }
  })
}
