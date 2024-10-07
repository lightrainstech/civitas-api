'use strict'
const Project = require('@models/projectModel.js')
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
  })

  fastify.post('/projects/list', async function (request, reply) {
    try {
      const { status = ['waiting'] } = request.body
      const projectModel = new Project()
      const projectsList = await projectModel.getAllProjectsAdmin(status)
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

  fastify.patch('/projects/status', async function (request, reply) {
    try {
      const { projectId, status } = request.body
      const updatedProject = await Project.findOneAndUpdate(
        { projectId },
        { $set: { status } },
        { new: true } // Return the updated document
      )

      if (!updatedProject) {
        return reply.error({ message: 'Project not found' })
      }

      reply.success({
        message: 'Project status updated successfully',
        data: updatedProject
      })
    } catch (err) {
      reply.error({
        message: 'Failed to update',
        error: err.message
      })
    }
  })
}
