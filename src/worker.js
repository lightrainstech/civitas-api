'use strict'
require('dotenv').config()
const { Agenda } = require('@hokify/agenda')
const MongoClient = require('mongodb').MongoClient
const mongoose = require('mongoose')
const agenda = new Agenda({ lockLimit: 1, defaultLockLimit: 0 })
// When mongoose is connected to MongoDB
mongoose
  .connect(process.env.MONGO_CONN)
  .then(() => {
    console.log('Mongoose connected')
    agenda.mongo(mongoose.connection.db, 'agendaJobs')

    agenda.on('ready', async function () {
      console.log('Agenda is ready')
      try {
        // await agenda.db.collection.updateMany(
        //   {
        //     lockedAt: { $ne: null }
        //   },
        //   {
        //     $unset: {
        //       lockedAt: undefined,
        //       lastModifiedBy: undefined,
        //       lastRunAt: undefined
        //     },
        //     $set: {
        //       nextRunAt: new Date()
        //     }
        //   }
        // )

        const jobTypes = process.env.JOB_TYPES
          ? process.env.JOB_TYPES.split(',')
          : []
        jobTypes.forEach(type => {
          require('./jobs/' + type)(agenda)
          console.log('Loaded job type:', type)
        })

        if (jobTypes.length) {
          await agenda.start()
          console.log('Agenda started')
        }
      } catch (err) {
        console.error('Error in Agenda setup:', err)
      }
    })
  })
  .catch(err => {
    console.error('Mongoose connection error:', err)
  })

// Handle unhandled rejections globally
process.on('unhandledRejection', error => {
  console.error('Unhandled Rejection:', error)
  process.exit(1)
})
