'use strict'
require('../models/users.model')
const utils = require('../lib/utils')
const mongoose = require('mongoose')

const UsersRepo = mongoose.model(utils.dbCons.COLLECTION_USERS)

module.exports.insertOne = async (documentJSON) => {
    try {
        const newUser = new UsersRepo(documentJSON)
        newUser.setPassword(documentJSON.password)
        utils.logger.debug(`User Details Object Data to Add ${JSON.stringify(newUser)}`)

        return await newUser.save()
    } catch (e) {
        utils.logger.error("error while saving data to mongo db", e)
        throw new Error("Unable to add Users")
    }
}

module.exports.findOne = async (findQuery) => {

    try {
        const user = await UsersRepo.findOne(findQuery)
        utils.logger.debug(`user_detail with matching Query ${JSON.stringify(findQuery)}  =  ${user}`)
        if (!user) {
            return false
        } else
            return user
    } catch (e) {
        utils.logger.error(`error while finding data from collection : ${utils.dbCons.COLLECTION_USERS} for query ${findQuery}`, e)

        throw new Error("Error finding users for given query")
    }

}

module.exports.update = async (query, dataToUpdate) => {
    try {
        utils.logger.debug(`data to be updated : ${JSON.stringify(dataToUpdate)}`, `update query : ${JSON.stringify(query)}`)

        const result = await UsersRepo.findOneAndUpdate(query, {$set: dataToUpdate}, {new: true})
        utils.logger.debug("Users Object Data", result)
        return result
    } catch (e) {
        utils.logger.error("Error while updating  data to mongo db", e)
        throw new Error("Invalid Data")
    }
}


module.exports.updatePassword = async (query, password) => {
    try {
        utils.logger.debug(`Data to be updated : ${JSON.stringify(password)}`, `update query : ${JSON.stringify(query)}`)
        const user = await  UsersRepo.findOne(query)
        const newUser = new UsersRepo(user)

        newUser.setPassword(password)
        const dataToUpdate = {
            hash: newUser.hash,
            salt: newUser.salt
        }

        const result = await UsersRepo.findOneAndUpdate(query, {$set: dataToUpdate}, {new: true})
        utils.logger.debug("Users Object Data", result)
        return result

    } catch (e) {
        utils.logger.error("error while updating password data to mongo db", e)
        throw new Error("Invalid Data")
    }
}
