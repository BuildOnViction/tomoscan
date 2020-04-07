const dbDex = require('./models/dex')
const Web3Util = require('./helpers/web3')
const BigNumber = require('bignumber.js')
const logger = require('./helpers/logger')
const TomoToken = '0x0000000000000000000000000000000000000001'
const q = require('./queues')

const decimalFunction = '0x313ce567'

async function getSaveTime (date) {
    const min = date.getMinutes()
    let newMin
    if (min < 15) {
        newMin = 15
    } else if (min < 30) {
        newMin = 30
    } else if (min < 45) {
        newMin = 45
    } else {
        newMin = 0
    }
    const newTime = date
    if (newMin === 0) {
        newTime.setMinutes(0)
        newTime.setHours(newTime.getHours() + 1)
        newTime.setSeconds(0)
        newTime.setMilliseconds(0)
    } else {
        newTime.setMinutes(newMin)
        newTime.setSeconds(0)
        newTime.setMilliseconds(0)
    }
    return newTime
}

function getNumberOfWeek (date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

async function run () {
    const web3 = await Web3Util.getWeb3()
    dbDex.Trade.watch().on('change', async (data) => {
        logger.info('new trade %s', data.fullDocument.hash)
        const makerExchange = data.fullDocument.makerExchange
        const takerExchange = data.fullDocument.takerExchange
        const pairName = data.fullDocument.pairName
        const baseToken = data.fullDocument.baseToken
        const quoteToken = data.fullDocument.quoteToken
        let amount = data.fullDocument.amount
        let makeFee = data.fullDocument.makeFee
        let takeFee = data.fullDocument.takeFee
        let price = data.fullDocument.pricepoint
        const taker = data.fullDocument.taker
        const maker = data.fullDocument.maker
        const takerOrderSide = data.fullDocument.takerOrderSide
        const tradeAt = data.fullDocument.createdAt

        let buyer, seller
        if (takerOrderSide.toUpperCase() === 'SELL') {
            seller = taker.toLowerCase()
            buyer = maker.toLowerCase()
        } else {
            buyer = taker.toLowerCase()
            seller = maker.toLowerCase()
        }

        q.create('TokenHolderProcess', {
            token: JSON.stringify({
                from: seller,
                to: buyer,
                address: baseToken.toLowerCase(),
                value: amount
            })
        })
            .priority('normal').removeOnComplete(true)
            .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()

        let quoteDecimal
        if (quoteToken === TomoToken) {
            quoteDecimal = 18
        } else {
            const token = await dbDex.Token.findOne({ contractAddress: quoteToken })
            if (token) {
                quoteDecimal = token.decimals
            } else {
                const decimals = await web3.eth.call({ to: quoteToken, data: decimalFunction })
                quoteDecimal = await web3.utils.hexToNumber(decimals)
            }
        }
        let baseDecimal
        if (baseToken === TomoToken) {
            baseDecimal = 18
        } else {
            const token = await dbDex.Token.findOne({ contractAddress: baseToken })
            if (token) {
                baseDecimal = token.decimals
            } else {
                const decimals = await web3.eth.call({ to: baseToken, data: decimalFunction })
                baseDecimal = await web3.utils.hexToNumber(decimals)
            }
        }

        price = new BigNumber(price)
        price = price.dividedBy(10 ** quoteDecimal).toNumber()

        amount = new BigNumber(amount)
        amount = amount.dividedBy(10 ** baseDecimal)

        makeFee = new BigNumber(makeFee)
        makeFee = makeFee.dividedBy(10 ** quoteDecimal)

        takeFee = new BigNumber(takeFee)
        takeFee = takeFee.dividedBy(10 ** quoteDecimal)

        const volume = amount.multipliedBy(price).toNumber()

        if (makerExchange === takerExchange) {
            await dbDex.HistoryStatistic.updateOne({
                exchangeAddress: makerExchange,
                baseToken: baseToken,
                quoteToken: quoteToken,
                pairName: pairName,
                date: new Date(tradeAt.getFullYear(), tradeAt.getMonth(), tradeAt.getDate())
            },
            {
                $inc: {
                    volume24h: volume,
                    tradeNumber: 1,
                    totalFee: makeFee.plus(takeFee).toNumber()
                }
            }, { upsert: true, new: true })

            await dbDex.Statistic.updateOne({
                exchangeAddress: makerExchange,
                baseToken: baseToken,
                quoteToken: quoteToken,
                pairName: pairName,
                date: await getSaveTime(tradeAt)
            },
            {
                $inc: {
                    volume: volume,
                    tradeNumber: 1,
                    totalFee: makeFee.plus(takeFee).toNumber()
                }
            }, { upsert: true, new: true })

            await dbDex.WeeklyStatistic.updateOne({
                exchangeAddress: makerExchange,
                baseToken: baseToken,
                quoteToken: quoteToken,
                pairName: pairName,
                year: tradeAt.getFullYear(),
                week: getNumberOfWeek(tradeAt)
            },
            {
                $inc: {
                    volume: volume,
                    tradeNumber: 1,
                    totalFee: makeFee.plus(takeFee).toNumber()
                }
            }, { upsert: true, new: true })

            await dbDex.MonthlyStatistic.updateOne({
                exchangeAddress: makerExchange,
                baseToken: baseToken,
                quoteToken: quoteToken,
                pairName: pairName,
                year: (tradeAt).getFullYear(),
                month: (tradeAt).getMonth()
            },
            {
                $inc: {
                    volume: volume,
                    tradeNumber: 1,
                    totalFee: makeFee.plus(takeFee).toNumber()
                }
            }, { upsert: true, new: true })
        } else {
            await dbDex.HistoryStatistic.updateOne({
                exchangeAddress: makerExchange,
                baseToken: baseToken,
                quoteToken: quoteToken,
                pairName: pairName,
                date: new Date(tradeAt.getFullYear(), tradeAt.getMonth(), tradeAt.getDate())
            },
            {
                $inc: {
                    volume24h: volume,
                    tradeNumber: 1,
                    totalFee: makeFee.toNumber()
                }
            }, { upsert: true, new: true })

            await dbDex.Statistic.updateOne({
                exchangeAddress: makerExchange,
                baseToken: baseToken,
                quoteToken: quoteToken,
                pairName: pairName,
                date: await getSaveTime(tradeAt)
            },
            {
                $inc: {
                    volume: volume,
                    tradeNumber: 1,
                    totalFee: makeFee.toNumber()
                }
            }, { upsert: true, new: true })

            await dbDex.HistoryStatistic.updateOne({
                exchangeAddress: takerExchange,
                baseToken: baseToken,
                quoteToken: quoteToken,
                pairName: pairName,
                date: new Date(tradeAt.getFullYear(), tradeAt.getMonth(), tradeAt.getDate())
            },
            {
                $inc: {
                    volume24h: volume,
                    tradeNumber: 1,
                    totalFee: takeFee.toNumber()
                }
            }, { upsert: true, new: true })

            await dbDex.Statistic.updateOne({
                exchangeAddress: takerExchange,
                baseToken: baseToken,
                quoteToken: quoteToken,
                pairName: pairName,
                date: await getSaveTime(tradeAt)
            },
            {
                $inc: {
                    volume: volume,
                    tradeNumber: 1,
                    totalFee: takeFee.toNumber()
                }
            }, { upsert: true, new: true })

            await dbDex.WeeklyStatistic.updateOne({
                exchangeAddress: makerExchange,
                baseToken: baseToken,
                quoteToken: quoteToken,
                pairName: pairName,
                year: tradeAt.getFullYear(),
                week: getNumberOfWeek(tradeAt)
            },
            {
                $inc: {
                    volume: volume,
                    tradeNumber: 1,
                    totalFee: makeFee.toNumber()
                }
            }, { upsert: true, new: true })

            await dbDex.MonthlyStatistic.updateOne({
                exchangeAddress: makerExchange,
                baseToken: baseToken,
                quoteToken: quoteToken,
                pairName: pairName,
                year: tradeAt.getFullYear(),
                month: tradeAt.getMonth()
            },
            {
                $inc: {
                    volume: volume,
                    tradeNumber: 1,
                    totalFee: makeFee.toNumber()
                }
            }, { upsert: true, new: true })

            await dbDex.WeeklyStatistic.updateOne({
                exchangeAddress: takerExchange,
                baseToken: baseToken,
                quoteToken: quoteToken,
                pairName: pairName,
                year: tradeAt.getFullYear(),
                week: getNumberOfWeek(tradeAt)
            },
            {
                $inc: {
                    volume: volume,
                    tradeNumber: 1,
                    totalFee: takeFee.toNumber()
                }
            }, { upsert: true, new: true })

            await dbDex.MonthlyStatistic.updateOne({
                exchangeAddress: takerExchange,
                baseToken: baseToken,
                quoteToken: quoteToken,
                pairName: pairName,
                year: tradeAt.getFullYear(),
                month: tradeAt.getMonth()
            },
            {
                $inc: {
                    volume: volume,
                    tradeNumber: 1,
                    totalFee: takeFee.toNumber()
                }
            }, { upsert: true, new: true })
        }
    })
}

run()
