'use strict'
require('../models/product.model')
const utils = require('../lib/utils')
const mongoose = require('mongoose')

const productCollection = utils.dbCons.COLLECTION_PRODUCTS
const Product = mongoose.model(utils.dbCons.COLLECTION_PRODUCTS)

module.exports.insertOne = async (documentJSON) => {
    try {
        const newProduct = new Product(documentJSON)
        utils.logger.debug(`Product Details Object Data to Add ${JSON.stringify(newProduct)}`)
        return await newProduct.save()
    } catch (e) {
        utils.logger.error(`error while saving data to mongo db, collection : ${productCollection}`, e)
        throw new Error("Unable to add Products")
    }
}

module.exports.updateProductById = async (orderID, dataToUpdate) => {
    try {
        utils.logger.debug("Product Object Data", dataToUpdate)
        dataToUpdate[utils.dbCons.COMMON_UPDATED_ON] = Date.now()

        const updateProductQuery = {}
        updateProductQuery[utils.dbCons.FIELD_ID] = orderID
        utils.logger.debug(`query for update ${JSON.stringify(updateProductQuery)}`, `data to update = ${JSON.stringify(dataToUpdate)}`)
        await Product.update(updateProductQuery, dataToUpdate)
        return Product.find(updateProductQuery)
    } catch (e) {
        utils.logger.error(`error while updating data to mongo db, collection : ${productCollection} for order id ${orderID}`, e)
        return new Error("Invalid Data")
    }
}
