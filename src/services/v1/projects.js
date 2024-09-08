'use strict'
const Project = require('@models/projectModel.js')

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

  fastify.post('/projects', async function (request, reply) {
    try {
      const data = request.body
      const { user } = request

      delete data.vaultInfo

      data.userIdRef = user.nonce
      data.wallet = user.sub
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

      const projectData = cleanData(data) // Clean the input data

      // Insert projectData into the database
      const project = new Project(projectData)
      const savedProject = await project.save()

      reply.success({
        message: 'Project created successfully',
        data: savedProject
      })
    } catch (err) {
      reply.error({
        message: 'Failed to create project',
        error: err.message
      })
    }
  })

  fastify.get('/projects', async function (request, reply) {
    try {
      const { user } = request

      // Get projectData into the database
      const project = new Project()
      const savedProject = await project.getProjectsOwned(user.sub)
      reply.success({
        message: 'Project created successfully',
        projects: savedProject
      })
    } catch (err) {
      reply.error({
        message: 'Failed to create project',
        error: err.message
      })
    }
  })
}
