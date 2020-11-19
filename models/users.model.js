'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const utils = require('../lib/utils')
const crypto = require('crypto')

let userDetailsSchema = new Schema({
    id: {
        type: Number,
        required: true
    },
    is_verified: {
        type: Boolean,
        default: false
    },
    is_suspended: {
        type: Boolean,
        default: false
    },
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: "CUSTOMER"
    },
    email: {
        type: String,
        required: true,
        index: {unique: true}
    },
    hash: {
        type: String,
        required: true
    },
    salt: {
        type: String,
        required: true
    },
    security_code: {
        type: String
    },
    is_deleted: {
        type: Boolean,
        default: false
    },
    updated_on: {
        type: Date,
        default: Date.now
    },
    created_on: {
        type: Date,
        default: Date.now
    },
    phone: {
        type: String
    },
    additional_attributes: [{
        name: {
            type: String,
            required: true
        },
        value: {
            type: String,
            required: true
        }
    }]
})

userDetailsSchema.plugin(global.db.autoIncrement, {
    model: utils.dbCons.COLLECTION_USERS,
    field: utils.dbCons.FIELD_ID,
    startAt: 1
})

userDetailsSchema.methods.setPassword = function (password) {
    this.salt = crypto.randomBytes(16).toString('hex')
    this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex')
}

userDetailsSchema.methods.validPassword = function (password) {
    const hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex')
    return this.hash === hash
}

module.exports = mongoose.model(utils.dbCons.COLLECTION_USERS, userDetailsSchema)
