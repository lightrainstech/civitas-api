'use strict'
const Web3 = require('web3')
const Project = require('@models/projectModel.js')
const Transaction = require('@models/transactionModel.js')

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
        request.user = authResult.parsedJWT
      }
    } catch (err) {
      console.log('jwt err', err)
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
        message: 'Projects listed successfully',
        projects: savedProject
      })
    } catch (err) {
      reply.error({
        message: 'Failed to list projects',
        error: err.message
      })
    }
  }),
    fastify.patch('/projects/:projectId', async function (request, reply) {
      try {
        const { projectId } = request.params
        const updates = request.body

        const allowedFields = [
          'name',
          'description',
          'status',
          'projectLogo',
          'projectBanner',
          'teamInfo',
          'tokenInfo',
          'roadMap',
          'whitePaper',
          'website'
        ]

        function filterAllowedFields(input) {
          const filteredObject = {}
          Object.keys(input).forEach(key => {
            if (
              input[key] !== undefined &&
              input[key] !== null &&
              input[key] !== '' &&
              allowedFields.includes(key) // Only include allowed fields
            ) {
              filteredObject[key] = input[key]
            }
          })
          return filteredObject
        }

        const filteredUpdates = filterAllowedFields(updates)

        if (Object.keys(filteredUpdates).length === 0) {
          return reply.error({ message: 'No valid fields to update' })
        }

        // Find the project and update it with the cleaned data
        const updatedProject = await Project.updatedProject(
          projectId,
          filteredUpdates
        )

        if (!updatedProject) {
          return reply.error({ message: 'Project not found' })
        }

        reply.success({
          message: 'Project updated successfully',
          data: updatedProject
        })
      } catch (err) {
        reply.error({
          message: 'Failed to update project',
          error: err.message
        })
      }
    })

  fastify.get('/projects/is_owner/:str', async function (request, reply) {
    const { str } = request.params
    const projectModel = new Project()
    const { user } = request
    try {
      const owned = await projectModel.getIsOwned(str, user.sub)
      reply.success({
        message: owned.isLaunched
          ? 'Project is already published'
          : 'Project is not published',
        available: owned ? true : false
      })
    } catch (error) {
      console.log(error)
      reply.error({ message: 'Failed to fetch' })
    }
    return reply
  }),
    fastify.get('/projects/stakes', async function (request, reply) {
      try {
        const { user } = request

        const transactionModel = new Transaction()
        let savedProject = await transactionModel.getStakes({
            wallet: Web3.utils.toChecksumAddress(user.sub)
          }),
          dataArray = []

        for await (let item of savedProject) {
          if (item._id) {
            let obj = {}
            const vaultAddress = Web3.utils.toChecksumAddress(item.vaultAddress)
            const vault = item.vaultInfo.find(
                v => v.vaultAddress === vaultAddress
              ),
              decimals = vault ? vault.depositTokenDecimals : 18
            obj.wallet = item.wallet
            obj.vaultAddress = item.vaultAddress
            obj.vaultName = vault ? vault.name : '--'
            obj.totalAmount = Number(
              Web3.utils.fromWei(item.totalAmount, decimals)
            )
            obj.projectId = item.projectId
            obj.projectName = item.projectName
            obj.displayPic = item.displayPic
            obj.vaultDisplayPic = vault ? vault.displayPic : {}
            obj.tvl = vault ? vault.tvl : 0
            obj.status = item.status
            dataArray.push(obj)
          }
        }
        reply.success({
          message: 'Staked Projects',
          projects: dataArray
        })
      } catch (err) {
        reply.error({
          message: 'Failed to list projects',
          error: err.message
        })
      }
    })
}
