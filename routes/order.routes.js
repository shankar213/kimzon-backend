const express = require('express')
const router = express.Router()
const _ = require('lodash')
const utils = require('../lib/utils')
const orderRepository = require("../repositories/order.repo")
const httpStatusCode = require('http-status-codes').StatusCodes

function prepareOrderBody(orderDetailsFromBody) {
    const orderBody = _.cloneDeep(orderDetailsFromBody)
    let subtotal = 0
    if (Array.isArray(orderBody.items)) {
        orderBody.items.forEach((item) => {
            console.log(item)
            if (!item.unit_price || !item.qty) throw new Error("Items details in order is incomplete")
            item.subtotal = item.unit_price * item.qty
            subtotal += item.subtotal
        })
    }
    orderBody.subtotal = subtotal
    orderBody.taxes = subtotal * 0.13
    orderBody.total = subtotal + orderBody.taxes + (orderBody.shipping_charges || 0)
    return orderBody
}

const createOrder = async (req, res, next) => {
    try {
        utils.logger.info(`Request body contains : ${JSON.stringify(req.body)}`)
        const orderDetailsFromBody = req.body.order_details
        const response = {}
        const newOrder = prepareOrderBody(orderDetailsFromBody)
        const result = await orderRepository.insertOne(newOrder)
        utils.logger.debug(`Response from inserting order ${JSON.stringify(result)}`)

        if (result) {
            response.order_details = result
            try {
                const mailBody = `Order has been placed Successfully`
                await utils.sendEmail(result.email, 'Congratulations!, Order Received', mailBody)
                response.email_sent = true
            } catch (err) {
                response.email_sent = false
                response.email_error = "Failed to send Email"
            }
        } else {
            response.order_details = null
            response.error = "Failed to Create an Order"
        }
        res.status(httpStatusCode.OK).send(utils.responseGenerators(response, httpStatusCode.OK, "Order Created Successfully"))
    } catch (err) {
        utils.logger.error(`createOrder error ${err}`)
        res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send(utils.errorsArrayGenrator(err.message, httpStatusCode.INTERNAL_SERVER_ERROR, err, err))
    }
}


router.post('/', createOrder)
module.exports = router
