'use strict'

const debug = require('debug')('logger')
const config = require('config')
const bunyan = require('bunyan')

const appConfig = config.get('app')
const logsConfig = config.get('logs')
debug('logsConfig=%s', JSON.stringify(logsConfig))

const name = appConfig.name
debug('name=%s', name)
const configs = {
    name,
    streams: []
}

const logLevel = logsConfig.level

configs.streams.push({
    type: 'stream',
    stream: process.stdout,
    level: logLevel
})

debug('Creating logger instance')
const logger = bunyan.createLogger(configs)

module.exports = logger
