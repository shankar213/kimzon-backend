const express = require('express')
const router = express.Router()
const _ = require('lodash')
const sgMail = require('@sendgrid/mail')
const utils = require('../lib/utils')
const userRepository = require("../repositories/users.repo")
const httpStatusCode = require('http-status-codes').StatusCodes

const passport = require("passport")
const jwt = require('jsonwebtoken')

const config = require('../config/default')

sgMail.setApiKey(config[utils.configCons.FIELD_SEND_GRID][utils.configCons.FIELD_SENDGRID_API_KEY])

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
            response.email_sent = false
            response.message = "Email is already used with other account Please use different email address"
            return res.status(httpStatusCode.OK).send(utils.responseGenerators(response, httpStatusCode.OK, "Failed to Add new User"))
        }
        const newUser = prepareUserBody(userDetailsFromBody)
        const result = await userRepository.insertOne(newUser)
        utils.logger.debug(`Response from inserting user ${JSON.stringify(result)}`)

        if (result) {
            response.user_details = result
            try {
                const mailBody = `Congratulations! You have successfully signed up with Kimazon, you can now log into your account by clicking on the link below:<br/><br/>
                                   <a href="${config[utils.configCons.FIELD_WEB_PORTAL][utils.configCons.FIELD_ROOT_HOST]}">${config[utils.configCons.FIELD_WEB_PORTAL][utils.configCons.FIELD_ROOT_HOST]}</a>`
                await utils.sendEmail(result.email, 'Congratulations!, Registered Successfully', mailBody)
                response.email_sent = true
            } catch (err) {
                response.email_sent = false
                response.email_error = "Failed to send Email"
            }
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

const validateCredentials = async (req, res, next) => {
    try {
        passport.authenticate('login', async (err, user, info) => {
            try {
                if (err || !user) {
                    return res.status(httpStatusCode.OK).send(utils.errorsArrayGenrator("Invalid User Credentials", httpStatusCode.OK, 'Please check your user id and/or password', {valid: false}))
                }
                req.login(user, {session: false}, async (error) => {
                    if (error) return next(error)
                    const tokenData = {_id: user._id, email: user.email}
                    const token = jwt.sign({user: tokenData}, 'top_secret')

                    const response = {
                        valid: true,
                        token: token,
                        user_details: user,
                    }

                    return res.status(httpStatusCode.OK).send(utils.responseGenerators(response, httpStatusCode.OK, 'User Logged in Successfully'))

                })
            } catch (error) {
                utils.logger.error(`error while validating user credentials ${error}`)
                return next(error)
            }
        })(req, res, next)

    } catch (err) {
        utils.logger.error(`validateCredentials error ${err}`)
        res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send(utils.errorsArrayGenrator(err, httpStatusCode.INTERNAL_SERVER_ERROR, 'server error'))
    }
}


router.post('/register', addUser)
router.post('/login', validateCredentials)
module.exports = router;
