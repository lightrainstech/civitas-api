const { Agenda } = require('@hokify/agenda')
require('dotenv').config()

const connectionOpts = {
  db: { address: process.env.MONGO_CONN, collection: 'agendaJobs' }
}

const agenda = new Agenda(connectionOpts)

const jobTypes = process.env.JOB_TYPES ? process.env.JOB_TYPES.split(',') : []

jobTypes.forEach(type => {
  require('./jobs/' + type)(agenda)
  console.log('Loaded job type:', type)
})

if (jobTypes.length) {
  agenda.start()
  agenda.every('60 minutes', 'Update:StakeInfo', {
    uId: 'CALLIN60'
  })
  console.log('Defined')
}

async function main() {}
// Handle unhandled rejections globally
process.on('unhandledRejection', error => {
  console.error('Unhandled Rejection:', error)
  process.exit(1)
})
