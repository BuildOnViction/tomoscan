'use strict'

import Block from '../models/Block'
import Web3Util from '../helpers/web3'
import Tx from '../models/Tx'
import { getSigner, toAddress } from '../helpers/utils'
import Account from '../models/Account'
import Follow from '../models/Follow'
import EmailService from '../services/Email'
import User from '../models/User'

const consumer = {}
consumer.name = 'BlockProcess'
consumer.processNumber = 2
consumer.task = async function(job, done) {
    let blockNumber = job.data.block
    console.log('Process block: ', blockNumber)
    let block = Block.findOne({number: blockNumber, nonce: {$exists: true}})
    let countTx = await Tx.find({blockNumber: blockNumber}).count()
    if (block && countTx === block.e_tx) {
        done()
        return
    }

    let web3 = await Web3Util.getWeb3()
    let _block = await web3.eth.getBlock(blockNumber, true)
    if (!_block) {
        done()
        return
    }

    // Get signer.
    let signer = toAddress(getSigner(_block), 100)

    // Update end tx count.
    let endTxCount = await web3.eth.getBlockTransactionCount(_block.hash)
    _block.timestamp = _block.timestamp * 1000
    _block.e_tx = endTxCount
    _block.signer = signer
    let txs = _block.transactions
    delete _block['transactions']
    _block.status = true

    // Update address signer.
    await Account.findOneAndUpdate({ hash: signer }, { hash: signer })

    // Insert crawl for signer.
    const q = require('./index')
    console.log('Queue account: ', signer)
    await q.create('AccountProcess', {address: signer})
        .priority('low').removeOnComplete(true).save()

    delete _block['_id']

    block = await Block.findOneAndUpdate({ number: _block.number }, _block,
        { upsert: true, new: true })

    // Sync txs.
    let txCount = Tx.find({ blockNumber: block.number }).count()
    if (txCount !== block.e_tx) {
        // Insert transaction before.
        for (let i = 0; i < txs.length; i++) {
            let tx = txs[i]

            if (tx.hash) {
                if (block) {
                    tx.block = block
                }
                if (tx && tx.hash) {
                    if (tx.from !== null) {
                        let accountFrom = await Account.findOneAndUpdate(
                            {hash: tx.from},
                            {hash: tx.from, status: false},
                            { upsert: true, new: true }
                        )
                        tx.from = tx.from.toLowerCase()
                        tx.from_model = accountFrom
                        // Insert crawl for address.
                        console.log('Queue account: ', tx.from)
                        await q.create('AccountProcess', {address: tx.from})
                            .priority('low').removeOnComplete(true).save()
                    }
                    if (tx.to !== null) {
                        let accountTo = await Account.findOneAndUpdate(
                            {hash: tx.to},
                            {hash: tx.to, status: false},
                            { upsert: true, new: true }
                        )
                        tx.to = tx.to.toLowerCase()
                        tx.to_model = accountTo
                        // Insert crawl for address.
                        console.log('Queue account: ', tx.to)
                        await q.create('AccountProcess', {address: tx.to})
                            .priority('low').removeOnComplete(true).save()
                    }

                    delete tx['_id']

                    tx = await Tx.findOneAndUpdate({ hash: tx.hash }, tx,
                        { upsert: true, new: true })

                    // Insert crawl for tx.
                    console.log('Queue Transaction: ', tx.hash)
                    await q.create('TransactionProcess', {hash: tx.hash})
                        .priority('critical').removeOnComplete(true).save()

                    // Send email to follower.
                    let followers = await Follow.find({
                        startBlock: { $lte: tx.blockNumber },
                        sendEmail: true,
                        $or: [{ address: tx.from }, { address: tx.to }]
                    })

                    if (followers.length) {
                        let email = new EmailService()
                        for (let i = 0; i < followers.length; i++) {
                            let follow = followers[i]
                            let user = await User.findOne({ _id: follow.user })
                            if (user) {
                                if (follow.notifySent && follow.address === tx.from) {
                                    // isSent email template.
                                    email.followAlert(user, tx, follow.address, 'sent')
                                } else if (follow.notifyReceive && follow.address === tx.to) {
                                    // isReceive email template.
                                    email.followAlert(user, tx, follow.address, 'received')
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    done()
}

module.exports = consumer
