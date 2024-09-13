require('dotenv').config()
const { ethers } = require('ethers')
const vaultAbi = require('../../abi/vaultAbi.json')

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

module.exports = {
  fetchTotalStake
}
