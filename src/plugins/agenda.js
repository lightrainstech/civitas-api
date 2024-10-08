'use strict'
const fp = require('fastify-plugin')
const { Agenda } = require('@hokify/agenda')

// Connect to DB
async function agendaConnect(fastify, options) {
  try {
    const mongoConnectionString = process.env.MONGO_CONN
    const agenda = new Agenda({
      db: {
        address: mongoConnectionString,
        collection: 'agendaJobs'
      }
    })

    if (agenda) {
      agenda.on('fail', function (err, job) {
        let extraMessage = ''

        if (job.attrs.failCount >= options.maxAttempts) {
          extraMessage = format('too many failures, giving up')
        } else if (shouldRetry(err)) {
          job.attrs.nextRunAt = secondsFromNowDate(options.retryDelaySeconds)

          extraMessage = format(
            'will retry in %s seconds at %s',
            options.retryDelaySeconds,
            job.attrs.nextRunAt.toISOString()
          )

          job.save()
        }

        if (process.env.NODE_ENV !== 'test') {
          console.error(
            'Agenda job [%s] %s failed with [%s] %s failCount:%s',
            job.attrs.name,
            job.attrs._id,
            err.message || 'Unknown error',
            extraMessage,
            job.attrs.failCount
          )
        }
      })
      fastify.decorate('agenda', agenda)
    } else {
      console.log('Error initializing agenda')
      fastify.decorate('agenda', '')
    }
  } catch (err) {
    console.log(err)
  }
}
module.exports = fp(agendaConnect)
