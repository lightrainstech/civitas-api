'use strict'
const Project = require('@models/projectModel.js')

module.exports = async function (fastify, opts) {
  fastify.post('/projects/:projectId/vaults', async function (request, reply) {
    try {
      const { projectId } = request.params
      const vaultData = request.body

      // Filter out empty or undefined fields in vaultData
      function cleanData(input) {
        const cleanedObject = {}
        Object.keys(input).forEach(key => {
          if (
            input[key] !== undefined &&
            input[key] !== null &&
            input[key] !== ''
          ) {
            cleanedObject[key] = input[key]
          }
        })
        return cleanedObject
      }

      const cleanedVaultData = cleanData(vaultData) // Clean the input data

      // Find the project and push new vault data to vaultInfo array
      const updatedProject = await Project.findOneAndUpdate(
        { projectId },
        { $push: { vaultInfo: cleanedVaultData } },
        { new: true } // Return the updated document
      )

      if (!updatedProject) {
        return reply.error({ message: 'Project not found' })
      }

      reply.success({
        message: 'Vault added successfully',
        data: updatedProject
      })
    } catch (err) {
      reply.error({
        message: 'Failed to add vault',
        error: err.message
      })
    }
  })
}
