'use strict'
require('../models/users.model')
const utils = require('../lib/utils')
const mongoose = require('mongoose')

const userCollection = utils.dbCons.COLLECTION_USERS
const User = mongoose.model(utils.dbCons.COLLECTION_USERS)

module.exports.insertOne = async (documentJSON) => {
    try {
        const newUser = new User(documentJSON)
        newUser.setPassword(documentJSON.password)
        utils.logger.debug(`User Details Object Data to Add ${JSON.stringify(newUser)}`)

        return await newUser.save()
    } catch (e) {
        utils.logger.error('error while saving data to mongo db', e)
        throw new Error('Unable to add Users')
    }
}

module.exports.findOne = async (findQuery) => {
    try {
        const user = await User.findOne(findQuery)
        utils.logger.debug(`user_detail with matching Query ${JSON.stringify(findQuery)}  =  ${JSON.stringify(user)}`)
        if (!user) {
            return false
        } else
            return user
    } catch (e) {
        utils.logger.error(`error while finding data from collection : ${utils.dbCons.COLLECTION_USERS} for query ${findQuery}`, e)

        throw new Error('Error finding users for given query')
    }

}

module.exports.updateUserById = async (userID, dataToUpdate) => {
    try {
        utils.logger.debug('User Object Data', dataToUpdate)
        dataToUpdate[utils.dbCons.COMMON_UPDATED_ON] = Date.now()
        const updateUserQuery = {}
        updateUserQuery[utils.dbCons.FIELD_ID] = userID
        utils.logger.debug(`Query for update ${JSON.stringify(updateUserQuery)}`, `data to update = ${JSON.stringify(dataToUpdate)}`)
        await User.update(updateUserQuery, dataToUpdate)
        return User.find(updateUserQuery)
    } catch (e) {
        utils.logger.error(`error while updating data to mongo db, collection : ${userCollection} for user id ${userID}`, e)
        return new Error('Invalid Data')
    }
}

module.exports.update = async (query, dataToUpdate) => {
    try {
        utils.logger.debug(`data to be updated : ${JSON.stringify(dataToUpdate)}`, `update query : ${JSON.stringify(query)}`)

        const result = await User.findOneAndUpdate(query, { $set: dataToUpdate }, { new: true })
        utils.logger.debug('Users Object Data', result)
        return result
    } catch (e) {
        utils.logger.error('Error while updating  data to mongo db', e)
        throw new Error('Invalid Data')
    }
}

module.exports.updatePassword = async (query, password) => {
    try {
        utils.logger.debug(`Data to be updated : ${JSON.stringify(password)}`, `update query : ${JSON.stringify(query)}`)
        const user = await User.findOne(query)
        const newUser = new User(user)

        newUser.setPassword(password)
        const dataToUpdate = {
            hash: newUser.hash, salt: newUser.salt,
        }

        const result = await User.findOneAndUpdate(query, { $set: dataToUpdate }, { new: true })
        utils.logger.debug('Users Object Data', result)
        return result

    } catch (e) {
        utils.logger.error('error while updating password data to mongo db', e)
        throw new Error('Invalid Data')
    }
}

module.exports.findAll = async (findQuery) => {
    try {
        utils.logger.debug(`query to find User Details ${JSON.stringify(findQuery)}`)
        const result = await User.find(findQuery)
        utils.logger.debug(`users matching find query : ${JSON.stringify(result)}`)
        return result
    } catch (e) {
        utils.logger.error(`error while finding data from collection : ${utils.dbCons.COLLECTION_USERS} for query ${findQuery}`, e)
        throw new Error('Error finding users for given query')
    }
}

module.exports.count = async (query) => {
    try {
        utils.logger.debug(`query to count User ${JSON.stringify(query)}`)
        const count = await User.find(query).count()
        utils.logger.debug(`users count matching count query : ${JSON.stringify(count)}`)
        return count
    } catch (e) {
        utils.logger.error(`error while fetching count of user from mongo db with query ${JSON.stringify(query)}, collection : ${userCollection} `, e)
        throw new Error('Error finding count of users for given query')
    }
}

