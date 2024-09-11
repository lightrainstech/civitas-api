'use strict'
// External Dependencies
const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const UserSchema = new mongoose.Schema(
  {
    userIdRef: {
      type: String,
      required: true,
      unique: true
    },
    wallet: {
      type: String,
      unique: true
    },
    name: { type: String, default: '--' },
    isVerified: { type: Boolean, default: false },
    profileImage: {
      path: {
        type: String,
        default: 'NA'
      },
      mimeType: {
        type: String,
        default: 'image/jpeg'
      }
    }
  },
  {
    timestamps: true
  }
)

UserSchema.methods = {
  getUserById: async function (id) {
    const User = mongoose.model('User')
    let query = { _id: id }
    const options = {
      criteria: query
    }
    return User.load(options)
  },
  getUserByuserIdRef: async function (userIdRef) {
    const User = mongoose.model('User')
    let query = { userIdRef }
    const options = {
      criteria: query
    }
    return User.load(options)
  },
  getUserByWalet: async function (wallet) {
    const User = mongoose.model('User')
    let query = { wallet }
    const options = {
      criteria: query
    }
    return User.load(options)
  },
  updateUser: async function (wallet, updates) {
    const User = mongoose.model('User')
    return await User.findOneAndUpdate(
      { wallet },
      { $set: updates },
      { new: true, runValidators: true }
    )
  }
}

UserSchema.statics = {
  load: function (options, cb) {
    options.select = options.select || 'userIdRef wallet name isVerified'
    return this.findOne(options.criteria).select(options.select).exec(cb)
  },

  list: function (options) {
    const criteria = options.criteria || {}
    const page = options.page - 1
    const limit = parseInt(options.limit) || 12
    const select = options.select || 'userIdRef name createdAt -__v'
    return this.find(criteria)
      .select(select)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(limit * page)
      .lean()
      .exec()
  }
}

UserSchema.index({ userIdRef: 1 }, { wallet: 1 }, { unique: true })

UserSchema.plugin(uniqueValidator)

module.exports = mongoose.model('User', UserSchema)
