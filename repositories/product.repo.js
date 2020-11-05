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

module.exports.findOne = async (findQuery) => {
    try {
        utils.logger.debug(`query to find products ${JSON.stringify(findQuery)}`)
        const result = await Product.findOne(findQuery)
        utils.logger.debug(`products matching find query : ${JSON.stringify(result)}`)
        return result
    } catch (e) {
        utils.logger.error(`error while finding data from collection : ${utils.dbCons.COLLECTION_USERS} for query ${findQuery}`, e)
        throw new Error("Error finding products for given query")
    }
}

module.exports.findAll = async (findQuery) => {
    try {
        utils.logger.debug(`query to find Product Details ${JSON.stringify(findQuery)}`)
        const result = await Product.find(findQuery)
        utils.logger.debug(`products matching find query : ${JSON.stringify(result)}`)
        return result
    } catch (e) {
        utils.logger.error(`error while finding data from collection : ${utils.dbCons.COLLECTION_USERS} for query ${findQuery}`, e)
        throw new Error("Error finding products for given query")
    }
}

module.exports.updateProductById = async (productID, dataToUpdate) => {
    try {
        utils.logger.debug("Product Object Data", dataToUpdate)
        dataToUpdate[utils.dbCons.COMMON_UPDATED_ON] = Date.now()

        const updateProductQuery = {}
        updateProductQuery[utils.dbCons.FIELD_ID] = productID
        utils.logger.debug(`Query for update ${JSON.stringify(updateProductQuery)}`, `data to update = ${JSON.stringify(dataToUpdate)}`)
        await Product.update(updateProductQuery, dataToUpdate)
        return Product.find(updateProductQuery)
    } catch (e) {
        utils.logger.error(`error while updating data to mongo db, collection : ${productCollection} for product id ${productID}`, e)
        return new Error("Invalid Data")
    }
}


module.exports.count = async (query) => {

    try {
        utils.logger.debug(`query to count Product ${JSON.stringify(query)}`)
        const count = await Product.find(query).count()
        utils.logger.debug(`products count matching count query : ${JSON.stringify(count)}`)
        return count
    } catch (e) {
        utils.logger.error(`error while fetching count of product from mongo db with query ${JSON.stringify(query)}, collection : ${productCollection} `, e)
        throw new Error("Error finding count of products for given query")
    }
}
