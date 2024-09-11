module.exports = async function (agenda) {
  agenda.define('Update:StakeInfo', async (job, done) => {
    try {
      console.log('here')
      job.remove()
      done()
    } catch (e) {
      console.log('--------ERROR UPDATING STAKING INFO--------')
      done()
    }
  })
}
