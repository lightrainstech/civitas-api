'use strict'
// External Dependencies
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const uniqueValidator = require('mongoose-unique-validator')

const LaunchSchema = new mongoose.Schema(
  {
    owner: {
      type: String,
      required: false
    },
    name: { type: String, default: 'NA' },
    projectId: { type: String, default: 'NA' },
    launchId: { type: String, required: true, unique: true },
    description: {
      type: String,
      default: 'NA'
    },
    tokenName: {
      type: String,
      required: true
    },
    tokenSymbol: {
      type: String,
      required: true
    },
    tokenAddress: {
      type: String,
      default: null
    },
    tokenPrice: {
      type: String,
      required: true
    },
    presaleAddress: {
      type: String,
      default: null
    },
    hardCap: {
      type: String,
      required: true
    },
    launchLogo: {
      path: {
        type: String,
        default: 'NA'
      },
      mimeType: {
        type: String,
        default: 'image/jpeg'
      }
    },
    chain: { type: String, default: 'NA' },
    startDate: {
      type: Date,
      default: Date.now()
    },
    endDate: {
      type: Date,
      default: Date.now()
    },
    status: {
      type: String,
      default: 'upcoming',
      enum: ['upcoming', 'active', 'closed', 'hold']
    },
    progress: {
      type: Number,
      default: 0
    },
    website: {
      type: String,
      default: 'NA'
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    isApproved: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
)

LaunchSchema.methods = {
  getLaunches: async function (args) {
    try {
      const { searchTerm, chain, page } = args
      let options = {
        criteria: {},
        page: page || 0
      }
      options.criteria = {
        ...(searchTerm && { name: { $regex: searchTerm, $options: 'i' } }),
        ...(chain && { chain })
      }
      const LaunchModel = mongoose.model('Launch')
      return await LaunchModel.list(options)
    } catch (error) {
      throw error
    }
  },
  getLauchDetails: async function (launchId) {
    try {
      const LaunchModel = mongoose.model('Launch')
      return await LaunchModel.findOne({ launchId })
    } catch (error) {
      throw error
    }
  },
  getLaunchsOwned: async function (owner) {
    try {
      const LaunchModel = mongoose.model('Launch')
      return await LaunchModel.find({ owner })
    } catch (error) {
      throw error
    }
  },
  updateLaunch: async function (launchId, cleanedUpdates) {
    try {
      const LaunchModel = mongoose.model('Launch')
      return await LaunchModel.findOneAndUpdate(
        { launchId },
        { $set: cleanedUpdates },
        { new: true, runValidators: true }
      )
    } catch (error) {
      throw error
    }
  },
  getAllLaunchesAdmin: async function (status) {
    const LaunchModel = mongoose.model('Launch')
    try {
      return await LaunchModel.find({
        status: { $in: status }
      })
    } catch (error) {
      throw error
    }
  },
  updatePresaleInfo: async function (args) {
    try {
      const { launchId, tokenAddress, presaleAddress } = args
      const LaunchModel = mongoose.model('Launch')
      return await LaunchModel.findOneAndUpdate(
        { launchId },
        {
          $set: {
            tokenAddress: tokenAddress,
            presaleAddress: presaleAddress
          }
        },
        { new: true }
      )
    } catch (error) {
      throw error
    }
  },
  approveLaunch: async function (args) {
    try {
      const { launchId, status } = args
      const LaunchModel = mongoose.model('Launch')
      return await LaunchModel.findOneAndUpdate(
        // { launchId, isApproved: false },
        { launchId },
        {
          $set: {
            isApproved: status
          }
        },
        { new: true }
      )
    } catch (error) {
      throw error
    }
  }
}

LaunchSchema.statics = {
  load: function (options, cb) {
    options.select =
      options.select || 'name description chain startDate endDate'
    return this.findOne(options.criteria).select(options.select).exec(cb)
  },

  list: function (options) {
    const criteria = options.criteria || {}
    const page = options.page === 0 ? 0 : options.page - 1
    const limit = parseInt(options.limit) || 12
    const select = options.select || '' // Return all fields if select is empty

    const query = this.find(criteria)
      .sort({ endDate: 1 })
      .limit(limit)
      .skip(limit * page)
      .lean()

    if (select) {
      query.select(select)
    }

    return query.exec()
  }
}

LaunchSchema.index(
  {
    launchId: 1,
    startDate: 1,
    endDate: 1
  },
  {
    unique: true,
    partialFilterExpression: { tokenAddress: { $type: 'string' } }
  },
  {
    unique: true,
    partialFilterExpression: { presaleAddress: { $type: 'string' } }
  }
)
LaunchSchema.plugin(uniqueValidator)

module.exports = mongoose.model('Launch', LaunchSchema)
