require('dotenv').config()
const { ethers } = require('ethers')
const vaultAbi = require('../../abi/vaultAbi.json')
const erc20FactoryAbi = require('../../abi/erc20FactoryAbi.json')
const presaleFactoryAbi = require('../../abi/presaleFactoryAbi.json')
const DEPLOYER_WALLET_PRIV = process.env.DEPLOYER_WALLET_PRIV

const getAbiAddress = (chain, isLive = false) => {
  if (chain === 'ETH' && !isLive) {
    return {
      token: '0x33B444C40E76B7f884925ec4088EC1f96698Cf1c',
      preSale: '0x17Ac810B199a0d7116319002d8e0BfC5f4000329'
    }
  }
}

const setProvider = chain => {
  let provider = 'BSC_RPC'
  if (chain === 'ETH') {
    provider = 'ETH_RPC'
  }
  return new ethers.JsonRpcProvider(process.env[provider])
}

const parseEventReceipt = (receipt, eventName, contract) => {
  return receipt.logs
    .map(log => {
      try {
        return contract.interface.parseLog(log)
      } catch (e) {
        return null
      }
    })
    .find(decodedLog => decodedLog && decodedLog.name === eventName)
}

const fetchTotalStake = async args => {
  try {
    const { valutAddress, chain, tokenDecimal } = args
    const provider = setProvider(chain)
    const vaultInstance = new ethers.Contract(valutAddress, vaultAbi, provider)
    const stakes = await vaultInstance.queryTVL()
    console.log(ethers.formatUnits(stakes, tokenDecimal))
    return ethers.formatUnits(stakes, tokenDecimal)
  } catch (error) {
    console.log(error)
  }
}

const createERC20Token = async (args, chain) => {
  try {
    const provider = setProvider(chain)
    const wallet = new ethers.Wallet(DEPLOYER_WALLET_PRIV, provider)
    const ercFactortInstance = new ethers.Contract(
      getAbiAddress(chain).token,
      erc20FactoryAbi,
      wallet
    )

    const tx = await ercFactortInstance.createERC20Token(...Object.values(args))
    const receipt = await tx.wait()

    const event = parseEventReceipt(receipt, 'TokenCreated', ercFactortInstance)
    return event.args.tokenAddress
  } catch (error) {
    console.log(error)
    throw error
  }
}

const createPresale = async (args, chain) => {
  try {
    console.log(getAbiAddress(chain).preSale)

    const provider = setProvider(chain)
    const wallet = new ethers.Wallet(DEPLOYER_WALLET_PRIV, provider)
    const ercPresaleInstance = new ethers.Contract(
      getAbiAddress(chain).preSale,
      presaleFactoryAbi,
      wallet
    )

    const tx = await ercPresaleInstance.createPresale(...Object.values(args))
    const receipt = await tx.wait()

    const event = parseEventReceipt(
      receipt,
      'PresaleCreated',
      ercPresaleInstance
    )

    return event.args.presaleAddress
  } catch (error) {
    console.log(error)
    throw error
  }
}

module.exports = {
  fetchTotalStake,
  createERC20Token,
  createPresale,
  getAbiAddress
}
