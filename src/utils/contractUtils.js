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
    const {
      name,
      symbol,
      owner,
      totalSupply,
      presaleAddress,
      marketMakingAddress,
      idoAddress
    } = args

    const provider = setProvider(chain)
    const wallet = new ethers.Wallet(DEPLOYER_WALLET_PRIV, provider)
    const ercFactortInstance = new ethers.Contract(
      getAbiAddress(chain).token,
      erc20FactoryAbi,
      wallet
    )

    const tx = await ercFactortInstance.createERC20Token(
      name,
      symbol,
      owner,
      totalSupply,
      presaleAddress,
      marketMakingAddress,
      idoAddress
    )
    const receipt = await tx.wait()

    const receiptx = await ethers.getTransactionReceipt(receipt.hash)

    const iface = new ethers.Interface(erc20FactoryAbi)
    let log = iface.parseLog(receiptx.logs[2])
    console.log('log:', tx, log)

    // const event = receipt.events.find(event => event.event === 'TokenCreated')
    // console.log(event)

    // console.log(receipt)
    return receipt
  } catch (error) {
    console.log(error)
    throw error
  }
}

module.exports = {
  fetchTotalStake,
  createERC20Token,
  getAbiAddress
}
