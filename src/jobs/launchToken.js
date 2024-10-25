'use strict'

const Launch = require('../models/launchModel.js')

const { createERC20Token, createPresale } = require('../utils/contractUtils.js')

module.exports = async function (agenda) {
  agenda.define('launch_token', async (job, done) => {
    try {
      const launchModel = new Launch()
      const {
        args,
        chain,
        launchId,
        hardCap,
        startTime,
        endTime,
        tokenPrice,
        fundWallet
      } = job.attrs.data
      console.log(`launching token: ${launchId}`)
      // const launch = await launchModel.getLauchDetails(launchId)
      let tokenAddress = await createERC20Token(args, chain)

      console.log(`launching presale: ${launchId}`)
      let presaleAddress = await createPresale(
        {
          token: tokenAddress,
          fundWallet,
          hardCap,
          startTime,
          endTime,
          tokenPrice
        },
        chain
      )

      await launchModel.updateLaunch(launchId, {
        tokenAddress,
        presaleAddress: presaleAddress,
        status: 'active',
        isApproved: true
      })
      console.log(
        `Addresses for ${launchId}: ${tokenAddress}, ${presaleAddress}`
      )

      done()
    } catch (e) {
      console.log('error launching')
      console.log(e)
    }
  })
}
