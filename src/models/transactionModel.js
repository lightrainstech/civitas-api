'use strict'
// External Dependencies
const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')
const ObjectId = mongoose.Types.ObjectId
const TransactionSchema = new mongoose.Schema(
  {
    wallet: {
      type: String,
      required: true
    },
    amount: {
      type: String,
      required: true
    },
    transactionType: {
      type: String,
      required: true
    },
    vaultAddress: {
      type: String,
      required: true
    },
    projectId: {
      type: ObjectId,
      ref: 'Project'
    },
    transactionHash: {
      type: String,
      unique: true
    },
    chain: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
)

TransactionSchema.methods = {
  addRecord: async function (args) {
    try {
      const {
        vault,
        amount,
        chain,
        wallet,
        transactionType,
        transactionHash,
        projectId
      } = args
      const TransactionModel = mongoose.model('Transaction')
      let transaction = new TransactionModel()
      transaction.wallet = wallet
      transaction.amount = amount
      transaction.transactionType = transactionType
      transaction.vaultAddress = vault
      transaction.transactionHash = transactionHash
      transaction.chain = chain
      transaction.projectId = projectId
      await transaction.save()
    } catch (error) {
      throw error
    }
  }
}

TransactionSchema.index({ wallet: 1 })

module.exports = mongoose.model('Transaction', TransactionSchema)
