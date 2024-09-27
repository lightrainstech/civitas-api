'use strict'
const Project = require('@models/projectModel.js')
const Transaction = require('@models/transactionModel.js')
require('dotenv').config()
const fp = require('fastify-plugin')
const { ethers } = require('ethers')
const fs = require('fs')
const Web3 = require('web3')
const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC)

async function eventListenerForBsc(fastify, options) {
  console.log('----------Listening-------')
  const abiJson = fs.readFileSync('abi/factoryContractAbi.json')
  const abi = JSON.parse(abiJson)
  const contractInstance = new ethers.Contract(
    process.env.FACTORY_CONTRACT_BSC,
    abi,
    provider
  )
  contractInstance.on(
    'VaultEvent',
    async (vaultAddress, eventName, tvl, wallet, amount, event) => {
      try {
        let tvlValue = ethers.formatUnits(tvl, 18)
        const projectModel = new Project()
        const update = await projectModel.updateStakeByVault({
          vault: Web3.utils.toChecksumAddress(vaultAddress),
          stakes: tvlValue,
          chain: 'BSC',
          tvl: tvlValue
        })
        let project = await projectModel.getProjectByVault({
          vault: Web3.utils.toChecksumAddress(vaultAddress),
          chain: 'BSC'
        })
        if (eventName === 'deposit' || eventName === 'withdraw') {
          if (project.length > 0) {
            const transactionModel = new Transaction()
            await transactionModel.addRecord({
              vault: Web3.utils.toChecksumAddress(vaultAddress),
              amount: amount.toString(),
              chain: 'BSC',
              wallet: Web3.utils.toChecksumAddress(wallet),
              transactionType: eventName,
              transactionHash: event.log.transactionHash,
              projectId: project[0]._id
            })
          }
        }
      } catch (error) {
        console.log(error)
      }
    }
  )
}

module.exports = fp(eventListenerForBsc)
