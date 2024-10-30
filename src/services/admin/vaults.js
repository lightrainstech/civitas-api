'use strict'
const Project = require('@models/projectModel.js')
require('dotenv').config()
const { isAdminWallet } = require('@utils/index.js')
const { createVault } = require('@utils/contractUtils.js')

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

      let cleanedVaultData = cleanData(vaultData) // Clean the input data
      const vaultAddress = await createVault(
        {
          depositTokenAddress: vaultData.depositTokenAddress,
          lpTokenName: vaultData.lpTokenName,
          lpTokenSymbol: vaultData.lpTokenSymbol
        },
        vaultData.chain
      )
      cleanedVaultData.vaultAddress = vaultAddress
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
