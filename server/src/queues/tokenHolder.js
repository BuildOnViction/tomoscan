'use strict'

const db = require('../models')
import BigNumber from 'bignumber.js'
import { convertHexToFloat } from '../helpers/utils'

const consumer = {}
consumer.name = 'TokenHolderProcess'
consumer.processNumber = 3
consumer.task = async function(job, done) {
    let token = JSON.parse(job.data.token)
    console.log('Process token holder: ')
    if (!token) { return false }

    // Add holder from.
    await updateQuality(token.from, token.address, -token.value)
    // Add holder to.
    await updateQuality(token.to, token.address, token.value)

    done()
}

async function updateQuality(hash, token, quantity) {
    let holder = await db.TokenHolder.findOne({ hash: hash, token: token })
    if (!holder) {
        // Create new.
        holder = await db.TokenHolder.create({
            hash: hash,
            token: token,
            quantity: 0
        })
    }

    // Convert number to hex.
    quantity = parseFloat(quantity).toString(16)
    let quantityCalc = convertHexToFloat(holder.quantity, 16) +
        convertHexToFloat(quantity, 16)
    let newQuantity = quantityCalc.toString(16)
    if (newQuantity.indexOf('-') >= 0) {
        newQuantity = newQuantity.replace('-', '')
        newQuantity = newQuantity.padStart(64, '0')
        newQuantity = '-' + newQuantity
    } else {
        newQuantity = newQuantity.padStart(64, '0')
    }
    holder.quantity = newQuantity
    holder.quantityNumber = quantityCalc
    holder.save()
}


async function formatItem(tokenHolder, totalSupply) {
    if (totalSupply) {
        totalSupply = new BigNumber(totalSupply)
        let quantity = new BigNumber(convertHexToFloat(tokenHolder.quantity, 16))
        let percentAge = quantity.div(totalSupply) * 100
        percentAge = percentAge.toFixed(4)
        percentAge = (percentAge.toString() === '0.0000') ? '0.0001' : percentAge
        tokenHolder.percentAge = percentAge
    }

    return tokenHolder
}

module.exports = consumer
