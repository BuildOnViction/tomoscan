const mongoose = require('mongoose')
const config = require('config')
const Schema = mongoose.Schema
const db = {}

const conn = mongoose.createConnection(config.get('MONGODB_DEX_URI'))
const Order = conn.model('Order', new Schema({
    exchangeAddress: { type: String, index: true },
    baseToken: { type: String, index: true },
    quoteToken: { type: String, index: true },
    userAddress: { type: String, index: true },

    status: { type: String, index: true },
    side: { type: String, index: true },
    type: { type: String, index: true },

    quantity: String,
    price: String,
    filledAmount: String,
    makeFee: String,
    takeFee: String,
    pairName: String
}))
db.Order = Order

const Trade = conn.model('Trade', new Schema({
    taker: { type: String, index: true },
    maker: { type: String, index: true },
    baseToken: { type: String, index: true },
    quoteToken: { type: String, index: true },
    txHash: { type: String, index: true },
    makerExchange: { type: String, index: true },
    takerExchange: { type: String, index: true },
    takerOrderHash: { type: String, index: true },
    makerOrderHash: { type: String, index: true },
    pairName: String,
    amount: String,
    pricepoint: String,
    status: { type: String, index: true }
}))
db.Trade = Trade

const Token = conn.model('Token', new Schema({
    contractAddress: { type: String, index: true },
    symbol: { type: String, index: true },
    name: String,
    decimals: Number
}))
db.Token = Token

const HistoryStatistic = conn.model('HistoryStatistic', new Schema({
    exchangeAddress: { type: String, index: true },
    baseToken: { type: String, index: true },
    quoteToken: { type: String, index: true },
    pairName: String,
    date: { type: Date, index: true },
    volume24h: Number,
    tradeNumber: Number,
    totalFee: Number
}))
db.HistoryStatistic = HistoryStatistic

const Statistic = conn.model('Statistic', new Schema({
    exchangeAddress: { type: String, index: true },
    baseToken: { type: String, index: true },
    quoteToken: { type: String, index: true },
    pairName: { type: String, index: true },
    date: { type: Date, index: true },
    volume: Number,
    tradeNumber: Number,
    totalFee: Number
}))
db.Statistic = Statistic

module.exports = db
