'use strict'
const Project = require('@models/projectModel.js')

module.exports = async function (fastify, opts) {
  // fastify.addHook('onRequest', async (request, reply) => {
  //   try {
  //     const { thirdwebAuth } = fastify
  //     const jwt = request.cookies?.jwt
  //     const authResult = await thirdwebAuth.verifyJWT({ jwt })

  //     if (!authResult.valid) {
  //       reply.error({ message: 'Failure' })
  //     }
  //   } catch (err) {
  //     reply.error(err)
  //   }
  // })

  fastify.post('/projects', async function (request, reply) {
    try {
      const data = request.body

      delete data.vaultInfo

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
}
