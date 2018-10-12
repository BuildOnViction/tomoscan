import { Router } from 'express'
import db from '../models'
import Web3Util from '../helpers/web3'

const SignMessageController = Router()

SignMessageController.get('/verifySignedMess', async (req, res, next) => {
    try {
        let web3 = await Web3Util.getWeb3()
        const signedMessage = req.query.message || ''
        const signature = req.query.signature || ''
        const hash = req.query.hash || ''

        let acc = await db.Account.findOne({ hash: hash })

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

export default SignMessageController
