'use strict'
// External Dependencies
const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const tokenSchema = new mongoose.Schema({
  tokenName: {
    type: String,
    require: true
  },
  tokenSymbol: {
    type: String,
    require: true
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
})
const teamSchema = new mongoose.Schema({
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
})

const ProjectSchema = new mongoose.Schema(
  {
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
    roadMap: {
      type: String,
      default: 'NA'
    }
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
      return await ProjectModel.list(criteria)
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
    const select =
      options.select ||
      'name description image chain category tvl startDate endDate status -__v'
    return this.find(criteria)
      .select(select)
      .sort({ endDate: 1 })
      .limit(limit)
      .skip(limit * page)
      .lean()
      .exec()
  }
}

module.exports = mongoose.model('Project', ProjectSchema)
