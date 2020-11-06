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




function prepareUserBody(dataFromBody) {
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
                    //Sign the JWT token and populate the payload with the user email and id
                    const token = jwt.sign({user: tokenData}, 'top_secret')

                    //remove hash and salt from the user object for security purpose
                    const userData = _.cloneDeep(user)
                    delete userData.hash
                    delete userData.salt

                    const response = {
                        valid: true,
                        token: token,
                        user_details: userData,
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

const changePassword = async (req, res, next) => {
    try {
        const body = req.body
        const userWithGivenMail = await userRepository.findOne({email: body.email})

        let response = {}

        if (!userWithGivenMail) {
            response.status = false
            response.error_message = "This Email is not linked with any account, Or the account has been suspended"
            return res.status(httpStatusCode.OK).send(utils.errorsArrayGenrator(response, httpStatusCode.OK, response.error_message))
        }

        let result = await userRepository.updatePassword({email: body.email}, body.password)
        utils.logger.debug(`response from change password${JSON.stringify(result)}`)
        response = result
        return res.status(httpStatusCode.OK).send(utils.responseGenerators(response, httpStatusCode.OK, "Password changes email send successfully"))


    } catch (err) {
        utils.logger.error(`error sendResetPasswordMail ${err} ${JSON.stringify(err)}`)
        res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send(utils.errorsArrayGenrator(err, httpStatusCode.INTERNAL_SERVER_ERROR, 'server error'))
    }
}

const sendSendSecurityCode = async (req, res, next) => {
    try {
        const body = req.body
        const email = body.email
        if (!email) {
            res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send(utils.errorsArrayGenrator('No Email Id Found', httpStatusCode.INTERNAL_SERVER_ERROR, 'server error'))
        }

        const userWithGivenMail = await userRepository.findOne({email: email})

        const response = {}
        if (!userWithGivenMail) {
            response.status = false
            response.error_message = "Provided Email is not linked with any account, Please check you email address"
            return res.status(httpStatusCode.OK).send(utils.errorsArrayGenrator(response, httpStatusCode.OK, "Email is not linked with any account, Please check you email address"))
        }

        const securityCode = Math.floor(100000 + Math.random() * 900000)
        const mailBody = `Your One time Security code is ${securityCode} </a><br/>`
        try {
            utils.logger.debug(`Sending security code in email with body : ${mailBody}`)
            await utils.sendEmail(email, 'Here is your Security Code(OTP)', mailBody)
            response.email_sent = true
            response.mail_body = mailBody
            response.security_code = securityCode
            await userRepository.update({email: email}, {security_code: securityCode})

            return res.status(httpStatusCode.OK).send(utils.responseGenerators(response, httpStatusCode.OK, "Security Code mail sent successfully"))
        } catch (err) {
            utils.logger.error(`error while sending email error ${err}`)
            response.email_sent = false
            response.email_error = "Fail to send Email"
            return res.status(httpStatusCode.OK).send(utils.responseGenerators(response, httpStatusCode.OK, "Failed to send email for  Security Code"))
        }
    } catch (err) {
        utils.logger.error(`error sendSendSecurityCode ${err} ${JSON.stringify(err)}`)
        res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send(utils.errorsArrayGenrator(err, httpStatusCode.INTERNAL_SERVER_ERROR, 'Server Error'))
    }
}

const sendResetPasswordMail = async (req, res, next) => {
    try {
        const body = req.body
        const email = body.email

        const userWithGivenMail = await userRepository.findOne({email: email})
        const response = {}

        if (!userWithGivenMail) {
            response.status = false
            response.error_message = "Email is not linked with any account, Please check you email address"
            return res.status(httpStatusCode.OK).send(utils.errorsArrayGenrator(response, httpStatusCode.OK, "Email is not linked with any account, Please check you email address"))
        }

        // characters to generate password from
        const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
        const string_length = 8
        let randomString = ''
        for (let i = 0; i < string_length; i++) {
            const rNum = Math.floor(Math.random() * chars.length)
            randomString += chars.substring(rNum, rNum + 1)
        }

        await userRepository.updatePassword({email: email}, randomString)
        const mailBody = `You have requested to reset your password <br/> <br/>
                          The temporary password is : <b>${randomString}</b> </a><br/>`

        try {
            utils.logger.debug(`Sending password reset email with body : ${mailBody}`)
            await utils.sendEmail(email, 'Password Reset', mailBody)
            response.email_sent = true
            response.mail_body = mailBody
            return res.status(httpStatusCode.OK).send(utils.responseGenerators(response, httpStatusCode.OK, "Password Reset mail sent successfully"))
        } catch (err) {
            utils.logger.error(`error while sending email error ${err}`)
            response.email_sent = false
            response.email_error = "Failed to send Email"
            return res.status(httpStatusCode.OK).send(utils.responseGenerators(response, httpStatusCode.OK, "Failed to send email to reset password"))
        }
    } catch (err) {
        utils.logger.error(`error sendResetPasswordMail ${err} ${JSON.stringify(err)}`)
        res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send(utils.errorsArrayGenrator(err, httpStatusCode.INTERNAL_SERVER_ERROR, 'server error'))
    }
}

router.post('/register', addUser)
router.post('/login', validateCredentials)
router.post('/change-password', changePassword)
router.post('/send-security-code', sendSendSecurityCode)
router.post('/password-change-request', sendResetPasswordMail)
module.exports = router;
