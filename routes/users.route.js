const express = require('express')
const router = express.Router()
const _ = require('lodash')
const utils = require('../lib/utils')
const userRepository = require("../repositories/users.repo")
const httpStatusCode = require('http-status-codes').StatusCodes


/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});




function prepareUserBody(dataFromBody, forEdit = false) {
    const user = _.cloneDeep(dataFromBody)
        if (!user.role) {
            user.role = utils.enumCons.ROLES.CUSTOMER
        }
    return user
}

async function checkUserExistence(email) {
    return await userRepository.findOne({email})
}


const addUser = async (req, res, next) => {
    try {
        utils.logger.info(`Request body contains : ${JSON.stringify(req.body)}`)
        const userDetailsFromBody = req.body.user_details

        const response = {}

        const isExist = await checkUserExistence(userDetailsFromBody.email)
        if (isExist) {
            const response = {}
            response.error = true
            response.message = "This Email is already used with other account Please use different email address"
            return res.status(httpStatusCode.OK).send(utils.responseGenerators(response, httpStatusCode.OK, "Failed to Add new User"))
        }
        const newUser = prepareUserBody(userDetailsFromBody)
        const result = await userRepository.insertOne(newUser)
        utils.logger.debug(`Response from inserting user ${JSON.stringify(result)}`)

        if (result) {
            response.user_details = result
        } else {
            response.user_details = null
            response.error = "Failed to Register User"
        }
        res.status(httpStatusCode.OK).send(utils.responseGenerators(response, httpStatusCode.OK, "User Registered Successfully"))
    } catch (err) {
        utils.logger.error(`addUser error ${err}`)
        res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send(utils.errorsArrayGenrator(err.message, httpStatusCode.INTERNAL_SERVER_ERROR, err, err))
    }
}

router.post('/register', addUser)
module.exports = router;
