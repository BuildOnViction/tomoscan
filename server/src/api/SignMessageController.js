import { Router } from 'express'
import db from '../models'
import Web3Util from '../helpers/web3'

const SignMessageController = Router()

SignMessageController.post('/verifySignedMess', async (req, res, next) => {
    try {
        let web3 = await Web3Util.getWeb3()
        const signedMessage = req.body.message || ''
        const signature = req.body.signature || ''
        const hash = req.body.hash || ''

        let acc = await db.Account.findOne({ hash: hash })

        if (!acc) {
            return res.status(404).send()
        }

        let result = await web3.eth.accounts.recover(signedMessage, signature)

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
        console.trace(e)
        console.log(e)
        return res.status(500).send()
    }
})

SignMessageController.post('/generateId', async (req, res, next) => {
    try {
        let web3 = await Web3Util.getWeb3()

        const message = req.body.message || ''
        const id = await web3.utils.sha3(message)
        res.send(id)
    } catch (e) {
        console.trace(e)
        console.log(e)
        return res.status(500).send()
    }
})

export default SignMessageController
