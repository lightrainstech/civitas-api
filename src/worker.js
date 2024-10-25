const { Agenda } = require('@hokify/agenda')
require('dotenv').config()
const mongoose = require('mongoose')

mongoose
  .connect(process.env.MONGO_CONN, {
    serverSelectionTimeoutMS: 30000
  })
  .then(() => {
    console.log('MongoDB connected')
    const agenda = new Agenda({
      db: { address: process.env.MONGO_CONN, collection: 'agendaJobs' },
      ensureIndex: true,
      defaultLockLifetime: 1000 * 60 * 3
    })
    const jobTypes = process.env.JOB_TYPES
      ? process.env.JOB_TYPES.split(',')
      : []

    jobTypes.forEach(type => {
      require('./jobs/' + type)(agenda)
      console.log('Loaded job type:', type)
    })
    if (jobTypes.length) {
      agenda.start()
      agenda.every('15 minutes', 'Update:StakeInfo', {
        uId: 'CALLIN60'
      })
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err)
  })

// Handle unhandled rejections globally
process.on('unhandledRejection', error => {
  console.error('Unhandled Rejection:', error)
  process.exit(1)
})
