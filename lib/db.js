'use strict'

const _ = require('lodash')
const mongoose = require('mongoose')
const {autoIncrement} = require('mongoose-plugin-autoinc')
const {auditLog} = require('mongoose-audit-log').plugin
mongoose.Promise = global.Promise
const utils = require('./utils')


/**
 * Return a middleware that generates Request ID and
 * sets in a header.
 *
 * @return {function} Express middleware.
 */
module.exports = (opts) => {
    utils.logger.debug('db_opts = ' + JSON.stringify(opts))
    this.opts = _.cloneDeep(opts)
    this.opts.host = this.opts.host || 'localhost:27017'
    utils.logger.debug('host = ' + this.opts.host)
    utils.logger.debug('defaultDbName=  ' + this.opts.defaultDbName)


    const connect = async (dbName) => {
        dbName = dbName || this.opts.defaultDbName

        const url = `mongodb+srv://${this.opts.credentials.user_id}:${this.opts.credentials.password}@${this.opts.host}/${dbName}?retryWrites=true&w=majority`
        utils.logger.debug(`connection url for mongo db  = ${url}`)

        try {
            await mongoose.connect(url, {useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true, useUnifiedTopology: true }).then(
                () => {
                    utils.logger.info("Successfully connected to Mongodb")
                },
                err => {throw err})
        } catch (e) {
            utils.logger.error("Couldn't connect to the  Mongo server", e)
        }
    }
    return {connect, autoIncrement, auditLog}
}
