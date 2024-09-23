'use strict'
// External Dependencies
const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')
const ObjectId = mongoose.Types.ObjectId

const socialSchema = {
  url: { type: String },
  mediaType: { type: String }
}
const tokenSchema = {
  tokenName: {
    type: String,
    require: true
  },
  tokenSymbol: {
    type: String,
    require: true
  },
  tokenAddress: {
    type: String,
    require: false,
    default: 'NA'
  },
  tokenGenDate: {
    type: Date,
    require: true
  },
  tokenLogo: {
    path: {
      type: String,
      default: 'NA'
    },
    mimeType: {
      type: String,
      default: 'image/jpeg'
    }
  }
}
const teamSchema = {
  name: {
    type: String,
    require: true
  },
  role: {
    type: String,
    require: true
  },
  socialMedia: {
    type: String,
    default: 'NA'
  },
  displayPic: {
    path: {
      type: String,
      default: 'NA'
    },
    mimeType: {
      type: String,
      default: 'image/jpeg'
    }
  }
}

const vaultSchema = {
  name: {
    type: String,
    require: true
  },
  depositTokenAddress: {
    type: String,
    require: true
  },
  depositTokenDecimals: {
    type: Number
  },
  vaultAddress: {
    type: String,
    require: true
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high']
  },
  apy: {
    type: String,
    default: 'NA'
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'closed', 'hold']
  },
  tvl: { type: Number, default: 0 },
  staked: { type: Number, default: 0 },
  displayPic: {
    path: {
      type: String,
      default: 'NA'
    },
    mimeType: {
      type: String,
      default: 'image/jpeg'
    }
  }
}

const ProjectSchema = new mongoose.Schema(
  {
    owner: {
      type: String,
      required: true
    },
    projectId: { type: String, required: true, unique: true },
    name: { type: String, default: 'NA' },
    description: {
      type: String,
      default: 'NA'
    },
    projectLogo: {
      path: {
        type: String,
        default: 'NA'
      },
      mimeType: {
        type: String,
        default: 'image/jpeg'
      }
    },
    projectBanner: {
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
    category: { type: String, default: 'NA' },
    tvl: { type: Number, default: 0 },
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
      default: 'active',
      enum: ['active', 'closed', 'hold']
    },
    tokenInfo: tokenSchema,
    teamInfo: [teamSchema],
    vaultInfo: [vaultSchema],
    roadMap: {
      type: String,
      default: 'NA'
    },
    whitePaper: {
      type: String,
      default: 'NA'
    },
    website: {
      type: String,
      default: 'NA'
    },
    social: [socialSchema],
    isLaunched: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
)

ProjectSchema.methods = {
  getProjects: async function (args) {
    try {
      const { searchTerm, chain, category, page } = args
      let options = {
        criteria: {},
        page: page || 0
      }

      options.criteria = {
        ...(searchTerm && { name: { $regex: searchTerm, $options: 'i' } }),
        ...(chain && { chain }),
        ...(category && { category })
      }
      const ProjectModel = mongoose.model('Project')
      return await ProjectModel.list(options)
    } catch (error) {
      throw error
    }
  },
  getProjectDetails: async function (projectId) {
    try {
      const ProjectModel = mongoose.model('Project')
      return await ProjectModel.findOne({ projectId })
    } catch (error) {
      throw error
    }
  },
  getProjectsOwned: async function (owner) {
    try {
      const ProjectModel = mongoose.model('Project')
      return await ProjectModel.find({ owner })
    } catch (error) {
      throw error
    }
  },
  updatedProject: async function (projectId, cleanedUpdates) {
    const ProjectModel = mongoose.model('Project')
    return await ProjectModel.findOneAndUpdate(
      { projectId },
      { $set: cleanedUpdates },
      { new: true, runValidators: true }
    )
  },
  getProjectWithoutPagination: async function () {
    try {
      const ProjectModel = mongoose.model('Project')
      const data = await ProjectModel.find({ status: 'active' })
      return data
    } catch (error) {
      throw error
    }
  },
  updateProductLaunch: async function (filter, updateData) {
    const ProjectModel = mongoose.model('Project')
    try {
      const options = { new: true }
      return await ProjectModel.findOneAndUpdate(filter, updateData, options)
    } catch (error) {
      console.error('Error in upsert operation:', error)
      throw error
    }
  },
  getIsOwned: async function (projectId, owner) {
    const ProjectModel = mongoose.model('Project')
    try {
      return await ProjectModel.findOne({ projectId, owner })
    } catch (error) {
      console.error('Error', error)
      throw error
    }
  },
  updateStake: async function (args) {
    try {
      const { pId, vault, stakes, chain, tvl } = args
      const ProjectModel = mongoose.model('Project')
      await ProjectModel.findOneAndUpdate(
        {
          _id: pId,
          'vaultInfo.vaultAddress': vault,
          chain: chain
        },
        {
          $set: {
            'vaultInfo.$.staked': Number(stakes),
            'vaultInfo.$.tvl': Number(tvl)
          }
        },
        { new: true }
      )
    } catch (error) {
      throw error
    }
  }
}

ProjectSchema.statics = {
  load: function (options, cb) {
    options.select =
      options.select || 'name description chain category tvl startDate endDate '
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

ProjectSchema.index({
  owner: 1
})

module.exports = mongoose.model('Project', ProjectSchema)
