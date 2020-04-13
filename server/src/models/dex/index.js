const mongoose = require('mongoose')
const config = require('config')
const Schema = mongoose.Schema
const db = {}

const conn = mongoose.createConnection(config.get('MONGODB_DEX_URI'))
const Order = conn.model('Order', new Schema({
    hash: { type: String, index: true },
    txHash: { type: String, index: true },
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
    pairName: String
}))
db.Order = Order

const Trade = conn.model('Trade', new Schema({
    hash: { type: String, index: true },
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
    makeFee: String,
    takeFee: String,
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
    pairName: { type: String, index: true },
    date: { type: Date, index: true },
    volume24h: Number,
    tradeNumber: Number,
    totalFee: Number
}))
db.HistoryStatistic = HistoryStatistic

const WeeklyStatistic = conn.model('WeeklyStatistic', new Schema({
    exchangeAddress: { type: String, index: true },
    baseToken: { type: String, index: true },
    quoteToken: { type: String, index: true },
    pairName: { type: String, index: true },
    year: Number,
    week: Number,
    volume: Number,
    tradeNumber: Number,
    totalFee: Number
}))
db.WeeklyStatistic = WeeklyStatistic

const MonthlyStatistic = conn.model('MonthlyStatistic', new Schema({
    exchangeAddress: { type: String, index: true },
    baseToken: { type: String, index: true },
    quoteToken: { type: String, index: true },
    pairName: { type: String, index: true },
    year: Number,
    month: Number,
    volume: Number,
    tradeNumber: Number,
    totalFee: Number
}))
db.MonthlyStatistic = MonthlyStatistic

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

const LendingRepay = conn.model('lending_repay', new Schema({
    quantity: String,
    interest: String,
    side: String,
    type: String,
    lendingToken: { type: String, index: true },
    collateralToken: { type: String, index: true },
    autoTopUp: { type: Boolean, index: true },
    filledAmount: String,
    status: { type: String, index: true },
    relayer: { type: String, index: true },
    term: String,
    userAddress: { type: String, index: true },
    hash: { type: String, index: true },
    txHash: { type: String, index: true },
    lendingId: { type: String, index: true },
    tradeId: { type: String, index: true },
    extraData: String

}))
db.LendingRepay = LendingRepay

const LendingTopup = conn.model('lending_topup', new Schema({
    quantity: String,
    interest: String,
    side: String,
    type: String,
    lendingToken: { type: String, index: true },
    collateralToken: { type: String, index: true },
    autoTopUp: { type: Boolean, index: true },
    filledAmount: String,
    status: { type: String, index: true },
    relayer: { type: String, index: true },
    term: String,
    userAddress: { type: String, index: true },
    hash: { type: String, index: true },
    txHash: { type: String, index: true },
    lendingId: { type: String, index: true },
    tradeId: { type: String, index: true },
    extraData: String

}))
db.LendingTopup = LendingTopup

const LendingRecall = conn.model('lending_recall', new Schema({
    quantity: String,
    interest: String,
    type: String,
    lendingToken: { type: String, index: true },
    collateralToken: { type: String, index: true },
    autoTopUp: { type: Boolean, index: true },
    filledAmount: String,
    status: { type: String, index: true },
    relayer: { type: String, index: true },
    term: String,
    userAddress: { type: String, index: true },
    hash: { type: String, index: true },
    txHash: { type: String, index: true },
    lendingId: { type: String, index: true },
    tradeId: { type: String, index: true },
    extraData: String
}))
db.LendingRecall = LendingRecall

const LendingItem = conn.model('lending_items', new Schema({
    quantity: String,
    interest: String,
    side: String,
    type: String,
    lendingToken: { type: String, index: true },
    collateralToken: { type: String, index: true },
    autoTopUp: { type: Boolean, index: true },
    filledAmount: String,
    status: { type: String, index: true },
    relayer: { type: String, index: true },
    term: String,
    userAddress: { type: String, index: true },
    hash: { type: String, index: true },
    txHash: { type: String, index: true },
    lendingId: { type: String, index: true },
    tradeId: { type: String, index: true },
    extraData: String

}))
db.LendingItem = LendingItem

const LendingTrade = conn.model('lending_trades', new Schema({
    hash: { type: String, index: true },
    amount: String,
    autoTopUp: { type: Boolean, index: true },
    borrower: { type: String, index: true },
    borrowingFee: String,
    borrowingOrderHash: { type: String, index: true },
    borrowingRelayer: { type: String, index: true },
    collateralLockedAmount: String,
    collateralPrice: String,
    collateralToken: { type: String, index: true },
    depositRate: String,
    extraData: String,
    interest: String,
    investingFee: String,
    investingOrderHash: { type: String, index: true },
    investingRelayer: { type: String, index: true },
    investor: { type: String, index: true },
    lendingToken: { type: String, index: true },
    liquidationPrice: String,
    liquidationTime: String,
    makerOrderType : { type: String, index: true },
    status: { type: String, index: true },
    takerOrderSide : { type: String, index: true },
    takerOrderType: { type: String, index: true },
    term: String,
    tradeId: String,
    txHash: { type: String, index: true }
}))
db.LendingTrade = LendingTrade

const Relayer = conn.model('relayers', new Schema({
    rid: { type: Number, index: true },
    owner: { type: String, index: true },
    deposit: String,
    address: { type: String, index: true },
    domain: { type: String, index: true },
    makeFee: String,
    takeFee: String,
    lendingFee: String,
    lockTime: Number,
    resign: { type: Boolean, index: true }
}))
db.Relayer = Relayer

module.exports = db
