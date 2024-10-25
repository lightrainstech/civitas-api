'use strict'
require('dotenv').config()
const Launch = require('@models/launchModel.js')
const { isAdminWallet } = require('@utils/index.js')
const { ethers } = require('ethers')
const erc20FactoryAbi = require('@abis/erc20FactoryAbi.json')
const { createERC20Token } = require('@utils/contractUtils')
const OWNER_WALLET = process.env.DEPLOYER_WALLET_ADDR

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
  fastify.post('/launches/list', async function (request, reply) {
    try {
      const { status } = request.body
      const launchModel = new Launch()
      const launchList = await launchModel.getAllLaunchesAdmin(status)
      if (!launchList) {
        return reply.error({ message: 'No launches matching status' })
      }
      reply.success({
        data: launchList
      })
    } catch (err) {
      console.log(err)
      reply.error({
        message: 'Unknown error',
        error: err.message
      })
    }
  }),
    fastify.patch('/launches/:launchId', async function (request, reply) {
      try {
        const { tokenAddress, presaleAddress } = request.body
        const { launchId } = request.params
        const launchModel = new Launch()
        const launchData = await launchModel.updatePresaleInfo({
          launchId,
          tokenAddress,
          presaleAddress
        })
        reply.success({
          message: 'Updated successfully',
          data: launchData
        })
      } catch (err) {
        console.log(err)
        reply.error({
          message: 'Unknown error',
          error: err.message
        })
      }
    }),
    fastify.patch(
      '/launches/:launchId/approve',
      async function (request, reply) {
        try {
          const {
            totalSupply,
            presaleAddress,
            marketMakingAddress,
            idoAddress,
            fundWallet,
            tokenPrice,
            status
          } = request.body
          const { launchId } = request.params
          const launchModel = new Launch()
          const launchData = await launchModel.getLauchDetails(launchId)

          if (launchData) {
            // Project is approved
            const { agenda } = fastify
            await agenda.schedule('now', 'launch_token', {
              args: {
                name: launchData.name,
                symbol: launchData.tokenSymbol,
                owner: process.env.DEPLOYER_WALLET_ADDR,
                totalSupply,
                presaleAddress,
                marketMakingAddress,
                idoAddress
              },
              chain: launchData.chain,
              launchId,
              hardCap: launchData.hardCap,
              startTime: Math.floor(
                new Date(launchData.startDate).getTime() / 1000
              ),
              endTime: Math.floor(
                new Date(launchData.endDate).getTime() / 1000
              ),
              tokenPrice,
              fundWallet
            })
          }
          reply.success({
            message: 'Started deploying contracts'
          })
        } catch (err) {
          console.log(err)
          reply.error({
            message: 'Unknown error',
            error: err.message
          })
        }
      }
    )
}
