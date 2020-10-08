'use strict'

module.exports = {
    configCons: require('../constants/config-constants'),
    dbCons: require('../constants/db-constants'),
    appCons: require('../constants/app-constants'),
    enumCons: require('../constants/enum-constants'),
    logger: require('./logger'),

    responseGenerators: function (responseData, responseStatusCode, responseStatusMsg, responseErrors) {
        const responseJson = {}
        responseJson['data'] = responseData
        responseJson['status_code'] = responseStatusCode
        responseJson['status_msg'] = responseStatusMsg

        // errors
        if (responseErrors === undefined) {
            responseJson['response_error'] = []
        } else {
            responseJson['response_error'] = responseErrors
        }

        return responseJson
    },


    errorsArrayGenrator: function (errorArray, code, msg, data) {
        const responseJson = {}
        if (typeof errorArray !== 'undefined' || errorArray.length > 0) {
            responseJson['errors'] = errorArray
        } else {
            responseJson['errors'] = []
        }

        // CODE
        if (typeof code === 'undefined') {
            responseJson['status_code'] = '500'
        } else {
            responseJson['status_code'] = code
        }

        // MSG
        if (typeof msg === 'undefined') {
            responseJson['status_message'] = 'server error'
        } else {
            responseJson['status_message'] = msg
        }

        // DATA
        if (typeof data === 'undefined') {
            responseJson['data'] = {}
        } else {
            responseJson['data'] = data
        }
        return responseJson
    }
}
