'use strict'
const Project = require('../models/projectModel.js')
const { fetchTotalStake } = require('../utils/contractUtils.js')
module.exports = async function (agenda) {
  agenda.define('Update:StakeInfo', async (job, done) => {
    try {
      console.log('---------Inside jobs-----------')
      const projectModel = new Project()
      const projects = await projectModel.getProjectWithoutPagination()
      for await (const project of projects) {
        let chain = project?.chain || null,
          valuts = project?.vaultInfo || []
        if (valuts.length > 0) {
          for await (const vault of valuts) {
            if (chain && vault?.status === 'active') {
              let stakes = await fetchTotalStake({
                valutAddress: vault.vaultAddress,
                chain,
                tokenDecimal: vault.depositTokenDecimals
              })
              await projectModel.updateStake({
                pId: project._id,
                vault: vault.vaultAddress,
                stakes: stakes,
                chain: chain,
                tvl: stakes
              })
            }
          }
        }
      }
      done()
    } catch (e) {
      console.log('--------ERROR UPDATING STAKING INFO--------', e)
      done()
    }
  })
}
