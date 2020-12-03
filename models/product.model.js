'use strict'
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const utils = require('../lib/utils')

let productSchema = new Schema({
    id: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    brand: {
        type: String,
        required: true
    },
    seller_id: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    condition: {
        type: String,
        required: true,
        default: utils.enumCons.PRODUCT_CONDITION.NEW
    },
    images: [{
        type: String,
        required: true
    }],
    qty: {
        type: Number,
        required: true
    },
    is_deleted: {
        type: Boolean,
        default: false
    },
    is_suspended: {
        type: Boolean,
        default: false
    },
    updated_on: {
        type: Date,
        default: Date.now
    },
    category :{
        type: String
    },
    created_on: {
        type: Date,
        default: Date.now
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

productSchema.plugin(global.db.autoIncrement, {
    model: utils.dbCons.COLLECTION_PRODUCTS,
    field: utils.dbCons.FIELD_ID,
    startAt: 1
})
module.exports = mongoose.model(utils.dbCons.COLLECTION_PRODUCTS, productSchema)


