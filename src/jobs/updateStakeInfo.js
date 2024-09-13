'use strict'
const Project = require('@models/projectModel.js')
const { fetchTotalStake } = require('../utils/contractUtils.js')
module.exports = async function (agenda) {
  agenda.define('Update:StakeInfo', async (job, done) => {
    try {
      const projectModel = new Project()
      const projects = await projectModel.getProjectWithoutPagination()
      for await (const project of projects) {
        let chain = project?.chain || null,
          valuts = projectModel?.vault || []
        if (vault.length > 0) {
          for await (const vault of valuts) {
            if (chain && vault?.status === 'active') {
              let stakes = await fetchTotalStake({
                valutAddress: vault.vaultAddress,
                chain
              })
              //update stakes
            }
          }
        }
      }
      done()
    } catch (e) {
      console.log('--------ERROR UPDATING STAKING INFO--------')
      done()
    }
  })
}
