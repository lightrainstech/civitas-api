const fp = require('fastify-plugin')
require('dotenv').config()

const { createThirdwebClient } = require('thirdweb')
const { privateKeyToAccount } = require('thirdweb/wallets')
const { createAuth } = require('thirdweb/auth')

async function thirdwebClient(fastify, options) {
  try {
    const secretKey = process.env.THIRDWEB_SECRET_KEY
    const thirdwebClient = createThirdwebClient({ secretKey })

    const thirdwebAuth = createAuth({
      domain: process.env.CLIENT_DOMAIN,
      client: thirdwebClient,
      adminAccount: privateKeyToAccount({
        client: thirdwebClient,
        privateKey: process.env.ADMIN_PRIVATE_KEY
      })
    })

    fastify.decorate('thirdwebAuth', thirdwebAuth)
  } catch (err) {
    fastify.decorate('thirdwebAuth', null)
    console.log(err)
  }
}
module.exports = fp(thirdwebClient)
