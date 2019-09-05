const Twitter = require('twitter')
const config = require('config')
const utils = require('./utils')
const BigNumber = require('bignumber.js')
const accountName = require('../contracts/accountName')
const logger = require('./logger')

const twitter = new Twitter({
    consumer_key: config.get('twitter.consumer_key'),
    consumer_secret: config.get('twitter.consumer_secret'),
    access_token_key: config.get('twitter.access_token_key'),
    access_token_secret: config.get('twitter.access_token_secret')
})
let TwitterHelper = {
    alertBigTransfer: async (txHash, from, to, amount) => {
        try {
            amount = new BigNumber(amount)
            amount = amount.dividedBy(10 ** 18).toNumber()
            let msg = `${utils.formatNumber(amount)} $TOMO transferred from ${utils.hiddenString(from, 5)} ` +
              `${accountName[from] ? '(' + accountName[from] + ')' : ''} to ${utils.hiddenString(to, 5)} ` +
              `${accountName[to] ? '(' + accountName[to] + ')' : ''} 
            
              tx: scan.tomochain.com/txs/${txHash}`

            await twitter.post('statuses/update', { status: msg })
        } catch (e) {
            logger.warn('tweet-alert-big-transfer error %s', e)
            console.error(e)
        }
    }
}

module.exports = TwitterHelper
