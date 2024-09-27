'use strict'
const Project = require('@models/projectModel.js')
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
    async (vaultAddress, eventName, tvl, wallet, amount) => {
      try {
        console.log(
          '---------Inside---------',
          vaultAddress,
          eventName,
          tvl,
          wallet,
          amount
        )
        let tvlValue = ethers.formatUnits(tvl, 18)
        const projectModel = new Project()
        const update = await projectModel.updateStakeByVault({
          vault: vaultAddress,
          stakes: tvlValue,
          chain: 'BSC',
          tvl: tvlValue
        })
      } catch (error) {
        console.log(error)
      }
    }
  )
}

module.exports = fp(eventListenerForBsc)
