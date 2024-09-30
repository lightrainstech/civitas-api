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
  },
  getStakes: async function (args) {
    try {
      const { wallet } = args
      const TransactionModel = mongoose.model('Transaction')
      const result = await TransactionModel.aggregate([
        {
          $match: {
            wallet: wallet
          }
        },
        {
          $group: {
            _id: '$vaultAddress',
            totalAmount: {
              $sum: {
                $cond: [
                  { $eq: ['$transactionType', 'deposit'] },
                  { $toDouble: '$amount' },
                  { $multiply: [-1, { $toDouble: '$amount' }] }
                ]
              }
            },
            wallet: { $first: '$wallet' },
            vaultAddress: { $first: '$vaultAddress' },
            projectId: { $first: '$projectId' }
          }
        },
        {
          $lookup: {
            from: 'projects',
            localField: 'projectId',
            foreignField: '_id',
            as: 'projectInfo'
          }
        },
        {
          $unwind: {
            path: '$projectInfo',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            wallet: 1,
            totalAmount: 1,
            vaultAddress: 1,
            projectId: '$projectInfo.projectId',
            projectName: '$projectInfo.name',
            vaultInfo: '$projectInfo.vaultInfo',
            displayPic: '$projectInfo.displayPic',
            status: '$projectInfo.status'
          }
        }
      ])

      return result
    } catch (error) {
      throw error
    }
  }
}

TransactionSchema.index({ wallet: 1 })

module.exports = mongoose.model('Transaction', TransactionSchema)
