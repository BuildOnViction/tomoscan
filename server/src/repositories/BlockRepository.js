import Block from '../models/Block'
import Web3Util from '../helpers/web3'
import Tx from '../models/Tx'
import { getSigner, toAddress } from '../helpers/utils'
import AccountRepository from './AccountRepository'
import Account from '../models/Account'
import Follow from '../models/Follow'
import EmailService from '../services/Email'
import User from '../models/User'
import CrawlRepository from './CrawlRepository'

let BlockRepository = {
    addBlockByNumber: async (number) => {
        try {
            let block = await Block.findOne({ number: number, nonce: { $exists: true } })
            let countTx = await Tx.find({ blockNumber: number }).count()
            if (block && countTx === block.e_tx) {
                return block
            }

            let web3 = await Web3Util.getWeb3()
            let _block = await web3.eth.getBlock(number, true)
            if (!_block) {
                return false
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
            await CrawlRepository.add('address', signer)

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
                                tx.from = tx.from.toLowerCase()
                                tx.from_model = await AccountRepository.addAccountPending(
                                    tx.from)
                                // Insert crawl for address.
                                await CrawlRepository.add('address', tx.from)
                            }
                            if (tx.to !== null) {
                                tx.to = tx.to.toLowerCase()
                                tx.to_model = await AccountRepository.addAccountPending(tx.to)
                                // Insert crawl for address.
                                await CrawlRepository.add('address', tx.to)
                            }

                            delete tx['_id']

                            tx = await Tx.findOneAndUpdate({ hash: tx.hash }, tx,
                                { upsert: true, new: true })

                            // Insert crawl for tx.
                            await CrawlRepository.add('tx', tx.hash)

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

            return block
        } catch (e) {
            console.trace(e)
            console.log(e)
            return null
        }
    }
}

export default BlockRepository
