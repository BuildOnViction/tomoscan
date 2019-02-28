const { Router } = require('express')
const db = require('../models')
const Web3Util = require('../helpers/web3')
const config = require('config')
const uuidv4 = require('uuid/v4')
const logger = require('../helpers/logger')
const urlJoin = require('url-join')

const SignMessageController = Router()

SignMessageController.post('/verifySignedMess', async (req, res) => {
    try {
        const web3 = await Web3Util.getWeb3()
        const signedMessage = req.body.message || ''
        const signature = req.body.signature || ''
        const hash = req.body.hash || ''

        const acc = await db.Account.findOne({ hash: hash })

        if (!acc) {
            return res.status(404).send()
        }
        const result = await web3.eth.accounts.recover(signedMessage, signature)

        if (acc.contractCreation === result.toLowerCase()) {
            res.send('OK')
        } else {
            res.send({
                error: {
                    message: 'Not match'
                }
            })
        }
    } catch (e) {
        logger.warn(e)
        return res.status(400).send()
    }
})

SignMessageController.post('/verifyScanedMess', async (req, res) => {
    try {
        const hash = req.body.hash || ''
        const messId = req.body.messId || ''

        const acc = await db.Account.findOne({ hash: hash })

        if (!acc) {
            return res.status(404).send()
        }
        const signature = await db.Signature.findOne({ signedAddress: acc.contractCreation })
        // let result = await web3.eth.accounts.recover(signedMessage, signature)

        if (signature && acc.contractCreation === signature.signedAddress.toLowerCase() &&
            messId === signature.signedAddressId) {
            res.json({
                signHash: signature.signature,
                message: signature.message
            })
        } else {
            res.send({
                error: {
                    message: 'Not match'
                }
            })
        }
    } catch (e) {
        logger.warn(e)
        return res.status(400).send()
    }
})

SignMessageController.post('/generateSignMess', async (req, res) => {
    try {
        const address = req.body.address || ''

        const message = '[Tomoscan ' + (new Date().toLocaleString().replace(/['"]+/g, '')) + ']' +
            ' I, hereby verify that the information provided is accurate and ' +
            'I am the owner/creator of the token contract address ' +
            '[' + address + ']'

        res.send({
            message,
            url: urlJoin(config.get('BASE_URL'), 'api/signMessage/verify?id='),
            id: uuidv4()
        })
    } catch (e) {
        logger.warn(e)
        return res.status(400).send()
    }
})

SignMessageController.post('/signMessage/verify', async (req, res) => {
    try {
        const web3 = await Web3Util.getWeb3()
        const message = req.body.message
        const signature = req.body.signature
        const id = req.query.id
        let signer = req.body.signer

        if (!message || !signature || !id || !signer) {
            return res.status(406).send('id, message, signature and signer are required')
        }
        signer = signer.toLowerCase()

        const signedAddress = await web3.eth.accounts.recover(message, signature).toLowerCase()

        if (signer !== signedAddress) {
            return res.status(401).send('The Signature Message Verification Failed')
        }

        // Store id, address, msg, signature
        let sign = await db.Signature.findOne({ signedAddress: signedAddress })
        if (!sign) {
            sign = {}
        }
        sign.signedAddressId = id
        sign.message = message
        sign.signature = signature

        await db.Signature.updateOne({ signedAddress: signedAddress }, sign, { upsert: true, new: true })

        res.send('Done')
    } catch (e) {
        logger.warn(e)
        return res.status(404).send(e)
    }
})

module.exports = SignMessageController
