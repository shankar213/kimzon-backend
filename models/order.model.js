'use strict'
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const utils = require('../lib/utils')

let orderSchema = new Schema({
    id: {
        type: Number,
        required: true
    },
    customer_id: {
        type: String,
        required: true
    },
    shipping: {
        address: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        province: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        },
        delivery_notes: String,
    },
    items: [{
        product_id: {
            type: Number,
            required: true
        },
        unit_price: {
            type: Number,
            required: true
        },
        qty: {
            type: Number,
            required: true,
            default: 1
        },
        subtotal: {
            type: Number,
            required: true
        }
    }],
    subtotal: {
        type: Number,
        required: true
    },
    shipping_charges: {
        type: Number,
        required: true,
        default: 0
    },
    taxes: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
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
    }
})

orderSchema.plugin(global.db.autoIncrement, {
    model: utils.dbCons.COLLECTION_ORDERS,
    field: utils.dbCons.FIELD_ID,
    startAt: 1
})
module.exports = mongoose.model(utils.dbCons.COLLECTION_ORDERS, orderSchema)


