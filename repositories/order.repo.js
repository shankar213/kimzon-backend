'use strict'
require('../models/order.model')
const utils = require('../lib/utils')
const mongoose = require('mongoose')

const orderCollection = utils.dbCons.COLLECTION_ORDERS
const Order = mongoose.model(utils.dbCons.COLLECTION_ORDERS)

module.exports.insertOne = async (documentJSON) => {
    try {
        const newOrders = new Order(documentJSON)
        utils.logger.debug(`Order Details Object Data to Add ${JSON.stringify(newOrders)}`)
        return await newOrders.save()
    } catch (e) {
        utils.logger.error(`error while saving data to mongo db, collection : ${orderCollection}`, e)
        throw new Error("Unable to add Orders")
    }
}

module.exports.findOne = async (findQuery) => {
    try {
        utils.logger.debug(`query to find orders ${JSON.stringify(findQuery)}`)
        const result = await Order.findOne(findQuery)
        utils.logger.debug(`orders matching find query : ${JSON.stringify(result)}`)
        return result
    } catch (e) {
        utils.logger.error(`error while finding data from collection : ${utils.dbCons.COLLECTION_ORDERS} for query ${findQuery}`, e)
        throw new Error("Error finding orders for given query")
    }
}

module.exports.findAll = async (findQuery) => {
    try {
        utils.logger.debug(`query to find Order Details ${JSON.stringify(findQuery)}`)
        const result = await Order.find(findQuery)
        utils.logger.debug(`orders matching find query : ${JSON.stringify(result)}`)
        return result
    } catch (e) {
        utils.logger.error(`error while finding data from collection : ${utils.dbCons.COLLECTION_ORDERS} for query ${findQuery}`, e)
        throw new Error("Error finding orders for given query")
    }
}

module.exports.update = async (query, dataToUpdate) => {
    try {
        utils.logger.debug(`data to be updated : ${JSON.stringify(dataToUpdate)}`, `update query : ${JSON.stringify(query)}`)

        const result = await Order.update(query, { $set: dataToUpdate })
        utils.logger.debug('Orders Object Data', result)
        return result
    } catch (e) {
        utils.logger.error('Error while updating  data to mongo db', e)
        throw new Error('Invalid Data')
    }
}

module.exports.updateOrderById = async (orderID, dataToUpdate) => {
    try {
        utils.logger.debug("Order Object Data", dataToUpdate)
        dataToUpdate[utils.dbCons.COMMON_UPDATED_ON] = Date.now()

        const updateOrderQuery = {}
        updateOrderQuery[utils.dbCons.FIELD_ID] = orderID
        utils.logger.debug(`Query for update ${JSON.stringify(updateOrderQuery)}`, `data to update = ${JSON.stringify(dataToUpdate)}`)
        await Order.update(updateOrderQuery, dataToUpdate)
        return Order.find(updateOrderQuery)
    } catch (e) {
        utils.logger.error(`error while updating data to mongo db, collection : ${orderCollection} for order id ${orderID}`, e)
        return new Error("Invalid Data")
    }
}

module.exports.count = async (query) => {

    try {
        utils.logger.debug(`query to count Order ${JSON.stringify(query)}`)
        const count = await Order.find(query).count()
        utils.logger.debug(`orders count matching count query : ${JSON.stringify(count)}`)
        return count
    } catch (e) {
        utils.logger.error(`error while fetching count of order from mongo db with query ${JSON.stringify(query)}, collection : ${orderCollection} `, e)
        throw new Error("Error finding count of orders for given query")
    }
}
