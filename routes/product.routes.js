"use strict"
const express = require('express')
const utils = require('../lib/utils')
const router = express.Router()
const _ = require('lodash')
const productRepository = require("../repositories/product.repo")
const httpStatusCode = require('http-status-codes').StatusCodes
const config = require('../config/default')
const app = express()
const AWS = require('aws-sdk')
const multer = require('multer')
const multerS3 = require('multer-s3')
const fileUpload = require('express-fileupload')

// loads s3 configurations and credentials
const s3 = new AWS.S3(config[utils.configCons.FIELD_S3][utils.configCons.FIELD_S3_CLIENT_CONFIG])
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: config.s3.bucket_name,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: function (req, file, cb) {
            cb(null, {fieldName: file.fieldname})
        },
        key: function (req, file, cb) {
            cb(null, "images/" + Date.now().toString() + "-" + file.originalname)
        }
    })
})

// app.use(busboy());
app.use(fileUpload())

const addImageToProduct = async (req, res, next) => {
    try {
        const productID = req.params.product_id
        if (!productID) {
            res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send(utils.errorsArrayGenrator("Product ID not provided", httpStatusCode.INTERNAL_SERVER_ERROR, 'server error'))
            return
        }
        let dataToUpdate
        dataToUpdate = {
            $push: {images: req.file.location}
        }
        const result = await productRepository.updateProductById(productID, dataToUpdate)
        utils.logger.debug('Add Image to Product/Product Update Response', result)
        const response = {}
        response.updated_product = result

        utils.logger.debug(`Response from adding image to product details : ${JSON.stringify(result)}`)
        res.status(httpStatusCode.OK).send(utils.responseGenerators(response, httpStatusCode.OK, "Image Added successfully"))
    } catch (err) {
        utils.logger.error(err)
        res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send(utils.errorsArrayGenrator(err, httpStatusCode.INTERNAL_SERVER_ERROR, 'server error'))
    }
}


function prepareProductBody(dataFromBody, forEdit = false) {
    const product = _.cloneDeep(dataFromBody)
    if (forEdit) {
        delete product.images
        delete product.seller_id
        delete product.id
    }
    return product
}

const addProduct = async (req, res, next) => {
    try {
        utils.logger.info(`Request body contains : ${JSON.stringify(req.body)}`)
        const productDetailsFromBody = req.body.product

        const response = {}
        const newProduct = prepareProductBody(productDetailsFromBody)
        const result = await productRepository.insertOne(newProduct)
        utils.logger.debug(`Response from inserting product ${JSON.stringify(result)}`)

        if (result) {
            response.product = result
        } else {
            response.product = null
            response.error = "Failed to Add new Product"
        }
        res.status(httpStatusCode.OK).send(utils.responseGenerators(response, httpStatusCode.OK, "Product Added Successfully"))
    } catch (err) {
        utils.logger.error(`addProduct error : ${err}`)
        res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send(utils.errorsArrayGenrator(err.message, httpStatusCode.INTERNAL_SERVER_ERROR, err, err))
    }
}

const updateProduct = async (req, res, next) => {
    try {
        utils.logger.info(`Request body contains : ${JSON.stringify(req.body)}`)
        const productDetailsFromBody = req.body.product

        const productToUpdate = prepareProductBody(productDetailsFromBody, true)
        const productId = req.params.product_id
        if (!productId) {
            utils.logger.debug(`Can not find product id in url params : ${JSON.stringify(req.params)}`)
            res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send(utils.responseGenerators("Please provide Product id to edit", httpStatusCode.INTERNAL_SERVER_ERROR, "No Product Id found"))
            return
        }
        const result = await productRepository.updateProductById(+productId, productToUpdate)
        utils.logger.debug(`Response From Product Update  ${JSON.stringify(result)}`)
        let response = null;
        if (result) {
            response = {product : result[0]};
        }

        res.status(httpStatusCode.OK).send(utils.responseGenerators(response, httpStatusCode.OK, "Product Updated"))
    } catch (err) {
        utils.logger.error(`Update Product Error ${err}`)
        res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send(utils.errorsArrayGenrator(err, httpStatusCode.INTERNAL_SERVER_ERROR, 'server error'))
    }
}

const deleteProduct = async (req, res, next) => {
    try {


        const productId = req.params.product_id

        utils.logger.info(`Request to delete the product contains : ${JSON.stringify(productId)}`)
        if (!productId) {
            utils.logger.debug(`Can not find product id in url params : ${JSON.stringify(req.params)}`)
            res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send(utils.responseGenerators("Please provide Product id to delete", httpStatusCode.INTERNAL_SERVER_ERROR, "No Product Id found"))
            return
        }
        const response = await productRepository.updateProductById(+productId, {is_deleted: true})
        utils.logger.debug(`Response From Product Delete  ${JSON.stringify(response)}`)

        res.status(httpStatusCode.OK).send(utils.responseGenerators(response, httpStatusCode.OK, "Product Deleted"))
    } catch (err) {
        utils.logger.error(`Delete Product Error ${err}`)
        res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send(utils.errorsArrayGenrator(err, httpStatusCode.INTERNAL_SERVER_ERROR, 'server error'))
    }
}

const getProducts = async (req, res, next) => {
    try {
        const findQuery = {is_deleted: false}
        if (req.params.seller_id) {
            const sellerID = req.params.seller_id
            findQuery["seller_id"] = +sellerID
        }

        if (req.method === "POST") {
            findQuery.is_suspended = { $exists: false };
            if (req.body.category) findQuery.category = req.body.category
            if (req.body.price && (req.body.price.min || req.body.price.max)) {
                findQuery.price = {}
                if (req.body.price.min)
                    findQuery.price["$gte"] = req.body.price.min
                if (req.body.price.max)
                    findQuery.price["$lt"] = req.body.price.max
            }
            if(req.body.term) {
                findQuery.name = { "$regex": req.body.term, "$options": "i" }
            }
            if(req.body.condition) {
                if(req.body.condition === utils.enumCons.PRODUCT_CONDITION.USED){
                    findQuery.condition = utils.enumCons.PRODUCT_CONDITION.USED
                } else if(req.body.condition === utils.enumCons.PRODUCT_CONDITION.NEW){
                    findQuery.condition ={ $in: [utils.enumCons.PRODUCT_CONDITION.NEW, null] }
                }
            }
            if (req.body.ids && Array.isArray(req.body.ids)) {
                findQuery.id = {$in: req.body.ids}
            }

        }
        const products = await productRepository.findAll(findQuery)
        const totalProductsCount = await productRepository.count(findQuery)
        utils.logger.debug(`Products list : ${JSON.stringify(products)}`)

        const responseData = {products: products, product_count: products.length, total_count: totalProductsCount}
        res.status(httpStatusCode.OK).send(utils.responseGenerators(responseData, httpStatusCode.OK, "Products Fetched Successfully"))
    } catch
        (err) {
        utils.logger.error(err)
        res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send(utils.errorsArrayGenrator(err, httpStatusCode.INTERNAL_SERVER_ERROR, 'server error'))
    }
}
const getProductDetails = async (req, res, next) => {
    try {
        const findQuery = {is_deleted: false}
        const productId = req.params.product_id
        if (!productId || isNaN(productId)) {
            utils.logger.debug(`Can not find product id in url params : ${JSON.stringify(req.params)}`)
            res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send(utils.responseGenerators("Please provide Product id", httpStatusCode.INTERNAL_SERVER_ERROR, "No Product Id found"))
            return
        }
        findQuery["id"] = +productId

        let responseData = {}
        const product = await productRepository.findOne(findQuery)
        utils.logger.debug(`Product  : ${JSON.stringify(product)}`)
        if (!product) {
            responseData = null
            res.status(httpStatusCode.OK).send(utils.responseGenerators(responseData, httpStatusCode.INTERNAL_SERVER_ERROR, "Product does not exit"))
            return
        }
        responseData.product = product
        res.status(httpStatusCode.OK).send(utils.responseGenerators(responseData, httpStatusCode.OK, "Product Details Fetched Successfully"))
    } catch (err) {
        utils.logger.error(err)
        res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send(utils.errorsArrayGenrator(err, httpStatusCode.INTERNAL_SERVER_ERROR, 'server error'))
    }
}

router.post('/', addProduct)
router.put('/:product_id', updateProduct)
router.delete('/:product_id', deleteProduct)
router.get('/', getProducts)
router.get('/:product_id', getProductDetails)
router.post('/filter', getProducts)
router.post('/selectedids', getProducts)
router.get('/seller/:seller_id', getProducts)
router.post('/:product_id/image', upload.single('image'), addImageToProduct)

module.exports = router
