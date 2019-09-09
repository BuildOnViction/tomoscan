const { Router } = require('express')
const db = require('../models')
const TransactionHelper = require('../helpers/transaction')
const { paginate } = require('../helpers/utils')
const Web3Util = require('../helpers/web3')
const TokenTransactionHelper = require('../helpers/tokenTransaction')
const utils = require('../helpers/utils')
const redisHelper = require('../helpers/redis')

const contractAddress = require('../contracts/contractAddress')
const accountName = require('../contracts/accountName')
const logger = require('../helpers/logger')
const { check, validationResult } = require('express-validator/check')
const TomoIssuer = require('../contracts/abi/TomoIssuer')
const config = require('config')

const TxController = Router()

TxController.get('/txs', [
    check('limit').optional().isInt({ max: 100 }).withMessage('Limit is less than 101 items per page'),
    check('page').optional().isInt({ max: 500 }).withMessage('Require page is number'),
    check('address').optional().isLength({ min: 42, max: 42 }).withMessage('Account address is incorrect.'),
    check('block').optional().isInt().withMessage('Require page is number'),
    check('type').optional().isString().withMessage('type = signTxs|otherTxs|pending'),
    check('tx_account').optional().isString().withMessage('type = in|out. if equal null return all')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    let params = { sort: { blockNumber: -1 }, query: {} }
    let start = new Date()
    try {
        let perPage = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 25
        let page = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        let offset = page > 1 ? (page - 1) * perPage : 0

        let blockNumber = !isNaN(req.query.block) ? req.query.block : null
        let address = req.query.address
        let specialAccount = null
        let total = null
        let type = req.query.type
        let txAccount = req.query.tx_account
        let isBlock = false

        if (typeof address !== 'undefined') {
            address = address.toLowerCase()
            if (txAccount === 'in') {
                params.query = Object.assign({}, params.query, { to: address })
            } else if (txAccount === 'out') {
                params.query = Object.assign({}, params.query, { from: address })
            } else {
                txAccount = 'all'
                params.query = Object.assign({}, params.query, { $or: [{ from: address }, { to: address }] })
            }
            /*
            if (page === 1) {
                let cache = await redisHelper.get(`txs-${txAccount}-${address}`)
                if (cache !== null) {
                    let r = JSON.parse(cache)
                    logger.info('load %s txs of address %s from cache', txAccount, address)
                    return res.json(r)
                }
            }
            */
        } else if (blockNumber) {
            params.query = Object.assign({}, params.query, { blockNumber: blockNumber })
            isBlock = true
        } else if (type) {
            let condition
            specialAccount = await db.SpecialAccount.findOne({ hash: 'transaction' })
            if (type === 'signTxs') {
                total = specialAccount ? specialAccount.sign : 0
                condition = { to: contractAddress.BlockSigner, isPending: false }
            } else if (type === 'otherTxs') {
                total = specialAccount ? specialAccount.other : 0
                condition = { to: { $nin: [contractAddress.BlockSigner, contractAddress.TomoRandomize] },
                    isPending: false }
            } else if (type === 'pending') {
                total = specialAccount ? specialAccount.pending : 0
                condition = { isPending: true }
                params.sort = { createdAt: -1 }
            } else if (type === 'all') {
                total = specialAccount ? specialAccount.total : 0
                params.query = Object.assign({}, params.query, { isPending: false })
            }

            params.query = Object.assign({}, params.query, condition || {})
        } else {
            specialAccount = await db.SpecialAccount.findOne({ hash: 'transaction' })
            total = specialAccount ? specialAccount.total : 0
            params.query = Object.assign({}, params.query, { isPending: false })
        }

        if (total === null) {
            let sa = await db.Account.findOne({ hash: address })
            if (sa) {
                if (txAccount === 'in') {
                    total = sa.inTxCount || 0
                } else if (txAccount === 'out') {
                    total = sa.outTxCount || 0
                } else {
                    total = sa.totalTxCount || 0
                }
            }
        }
        let end = new Date() - start
        logger.info(`Txs preparation execution time: %dms`, end)
        start = new Date()
        if (total === null) {
            total = 0 // await db.Tx.countDocuments(params.query)
            end = new Date() - start
            logger.info(`Txs count execution time: %dms query %s`, end, JSON.stringify(params.query))
        }
        start = new Date()

        const web3 = await Web3Util.getWeb3()
        let data = {}
        let getOnChain = false
        if (isBlock) {
            let block = await db.Block.findOne({ number: blockNumber })
            if (block === null || block.e_tx > total) {
                getOnChain = true

                const _block = await web3.eth.getBlock(blockNumber)

                const trans = _block.transactions
                let countTx = trans.length
                const items = []
                let txids = []
                for (let i = offset; i < (offset + perPage); i++) {
                    if (i < trans.length) {
                        txids.push(trans[i])
                    } else {
                        break
                    }
                }
                let map = txids.map(async function (tx) {
                    items.push(await TransactionHelper.getTransaction(tx))
                })
                await Promise.all(map)
                const pages = Math.ceil(trans.length / perPage)
                data = {
                    total: countTx,
                    perPage: perPage,
                    currentPage: page,
                    pages: pages,
                    items: items
                }
            }
        }
        end = new Date() - start
        logger.info(`Txs isBlock execution time: %dms`, end)
        start = new Date()

        if (getOnChain === false) {
            let pages = Math.ceil(total / perPage)

            let items = await db.Tx.find(params.query)
                .maxTimeMS(20000)
                .sort(params.sort)
                .skip(offset).limit(perPage)
                .lean().exec()

            if (pages > 500) {
                pages = 500
            }

            data = {
                total: total,
                perPage: perPage,
                currentPage: page,
                pages: pages,
                items: items
            }
            end = new Date() - start
            logger.info(`Txs getOnChain === false execution time: %dms address %s query %s sort %s %s %s`,
                end, address,
                JSON.stringify(params.query),
                JSON.stringify(params.sort),
                offset, perPage)
            start = new Date()
        }

        let listAddress = []
        for (let i = 0; i < data.items.length; i++) {
            let item = data.items[i]
            if (!listAddress.includes(item.from)) {
                listAddress.push(item.from)
            }
            if (item.to && !listAddress.includes(item.to)) {
                listAddress.push(item.to)
            }
        }
        if (listAddress) {
            let newItem = []
            let accounts = await db.Account.find({ hash: { $in: listAddress } })
            let map1 = data.items.map(async function (d) {
                let map2 = accounts.map(async function (ac) {
                    ac = ac.toJSON()
                    ac.accountName = accountName[ac.hash] || null
                    if (d.from === ac.hash) {
                        d.from_model = ac
                    }
                    if (d.to === ac.hash) {
                        d.to_model = ac
                    }
                })
                await Promise.all(map2)
                newItem.push(d)
            })
            await Promise.all(map1)
            data.items = newItem
        }
        let status = []
        for (let i = 0; i < data.items.length; i++) {
            if (!data.items[i].hasOwnProperty('status')) {
                status.push({ hash: data.items[i].hash })
            }
        }
        if (status.length > 0) {
            let map = status.map(async function (s) {
                let receipt = await TransactionHelper.getTransactionReceipt(s.hash)
                if (receipt) {
                    let status
                    if (typeof receipt.status === 'boolean') {
                        status = receipt.status
                    } else {
                        status = web3.utils.hexToNumber(receipt.status)
                    }
                    s.status = status
                } else {
                    s.status = null
                }
            })
            await Promise.all(map)
            for (let i = 0; i < status.length; i++) {
                for (let j = 0; j < data.items.length; j++) {
                    if (status[i].hash === data.items[j].hash) {
                        data.items[j].status = status[i].status
                    }
                }
            }
        }
        end = new Date() - start
        logger.info(`Txs getOnChain execution time: %dms address %s`, end, address)
        if (page === 1 && address && data.items.length > 0) {
            redisHelper.set(`txs-${txAccount}-${address}`, JSON.stringify(data))
        }
        return res.json(data)
    } catch (e) {
        logger.warn('cannot get list tx with query %s. Error', JSON.stringify(params.query), e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

TxController.get('/txs/listByType/:type', [
    check('limit').optional().isInt({ max: 100 }).withMessage('Limit is less than 101 items per page'),
    check('page').optional().isInt({ max: 500 }).withMessage('Page is less than or equal 500'),
    check('type').exists().isString().withMessage('type is require.')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let type = req.params.type
    let total = null
    let params = { sort: { blockNumber: -1 } }
    let specialAccount = await db.SpecialAccount.findOne({ hash: 'transaction' })
    if (type === 'signTxs') {
        total = specialAccount ? specialAccount.sign : 0
        params.query = { to: contractAddress.BlockSigner, isPending: false }
    } else if (type === 'normalTxs') {
        total = specialAccount ? specialAccount.other : 0
        params.query = { to: { $nin: [contractAddress.BlockSigner, contractAddress.TomoRandomize] },
            isPending: false }
    } else if (type === 'pending') {
        total = specialAccount ? specialAccount.pending : 0
        params.query = { isPending: true }
        params.sort = { createdAt: -1 }
        delete params.sort.blockNumber
    } else {
        total = specialAccount ? specialAccount.total : 0
        params.query = Object.assign({}, params.query, { isPending: false })
    }
    let data = await paginate(req, 'Tx', params, total)
    for (let i = 0; i < data.items.length; i++) {
        if (data.items[i].from_model) {
            data.items[i].from_model.accountName = accountName[data.items[i].from] || null
        } else {
            data.items[i].from_model = { accountName: accountName[data.items[i].from] || null }
        }
        if (data.items[i].to_model) {
            data.items[i].to_model.accountName = accountName[data.items[i].to] || null
        } else {
            data.items[i].to_model = { accountName: accountName[data.items[i].to] || null }
        }
    }
    if (data.pages > 500) {
        data.pages = 500
    }

    return res.json(data)
})

TxController.get('/txs/listByAccount/:address', [
    check('limit').optional().isInt({ max: 100 }).withMessage('Limit is less than 101 items per page'),
    check('page').optional().isInt({ max: 500 }).withMessage('Page is less than or equal 500'),
    check('address').exists().isLength({ min: 42, max: 42 }).withMessage('Account address is incorrect.'),
    check('tx_type').optional().isString().withMessage('tx_type = in|out. if equal null return all'),
    check('filterAddress').optional().isLength({ min: 42, max: 42 }).isString().withMessage('Filter address incorrect')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let address = req.params.address
    address = address ? address.toLowerCase() : address
    let page = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
    let txType = req.query.tx_type

    let account = await db.Account.findOne({ hash: address })
    let total = null

    if (page === 1 && account.hasManyTx) {
        let cache = await redisHelper.get(`txs-${txType}-${address}`)
        if (cache !== null) {
            let r = JSON.parse(cache)
            logger.info('load %s txs of address %s from cache', txType, address)
            return res.json(r)
        }
    }

    let params = { sort: { blockNumber: -1 } }
    if (txType === 'in') {
        params.query = { to: address }
        if (account) {
            total = account.inTxCount
        }
    } else if (txType === 'out') {
        params.query = { from: address }
        if (account) {
            total = account.outTxCount
        }
    } else {
        params.query = { $or: [{ from: address }, { to: address }] }
        if (account) {
            total = account.totalTxCount
        }
    }
    if (!account.hasManyTx) {
        total = null
    }

    if (req.query.filterAddress) {
        if (txType === 'in') {
            params.query = Object.assign({}, params.query, { from: req.query.filterAddress })
        } else if (txType === 'out') {
            params.query = Object.assign({}, params.query, { to: req.query.filterAddress })
        }
    }
    let data = await paginate(req, 'Tx', params, total)
    for (let i = 0; i < data.items.length; i++) {
        if (data.items[i].from_model) {
            data.items[i].from_model.accountName = accountName[data.items[i].from] || null
        } else {
            data.items[i].from_model = { accountName: accountName[data.items[i].from] || null }
        }
        if (data.items[i].to_model) {
            data.items[i].to_model.accountName = accountName[data.items[i].to] || null
        } else {
            data.items[i].to_model = { accountName: accountName[data.items[i].to] || null }
        }
    }
    if (page === 1 && account.hasManyTx && data.items.length > 0) {
        redisHelper.set(`txs-${txType}-${address}`, JSON.stringify(data))
    }
    if (data.pages > 500) {
        data.pages = 500
    }
    return res.json(data)
})

TxController.get('/txs/listByBlock/:blockNumber', [
    check('limit').optional().isInt({ max: 100 }).withMessage('Limit is less than 101 items per page'),
    check('page').optional().isInt({ max: 500 }).withMessage('Page is less than or equal 500'),
    check('blockNumber').exists().isInt().withMessage('Require blockNumber is number.')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let blockNumber = req.params.blockNumber

    let block = await db.Block.findOne({ number: blockNumber })
    let isGetOnChain = false
    if (block) {
        let countTx = await db.Tx.countDocuments({ blockNumber: blockNumber })
        if (countTx < block.e_tx) {
            isGetOnChain = true
        }
    } else {
        isGetOnChain = true
    }
    let params = { sort: { blockNumber: -1 }, query: { blockNumber: blockNumber } }

    let data
    if (!isGetOnChain) {
        data = await paginate(req, 'Tx', params, block.e_tx)
    } else {
        let startGet = new Date()
        const web3 = await Web3Util.getWeb3()
        const _block = await web3.eth.getBlock(blockNumber, true)
        let endGet = new Date()
        logger.info('Get block %s on chain in %s ms', blockNumber, endGet - startGet)
        data = {
            total: _block.transactions.length,
            perPage: _block.transactions.length,
            currentPage: 1,
            pages: 1,
            items: _block.transactions
        }

        let status = []
        for (let i = 0; i < data.items.length; i++) {
            if (!data.items[i].hasOwnProperty('status')) {
                status.push({ hash: data.items[i].hash })
            }
        }
        if (status.length > 0) {
            let map = status.map(async function (s) {
                let receipt = await TransactionHelper.getTransactionReceipt(s.hash)
                if (receipt) {
                    let status
                    if (typeof receipt.status === 'boolean') {
                        status = receipt.status
                    } else {
                        status = web3.utils.hexToNumber(receipt.status)
                    }
                    s.status = status
                } else {
                    s.status = null
                }
            })
            await Promise.all(map)
            for (let i = 0; i < status.length; i++) {
                for (let j = 0; j < data.items.length; j++) {
                    if (status[i].hash === data.items[j].hash) {
                        data.items[j].status = status[i].status
                    }
                }
            }
        }
    }
    for (let i = 0; i < data.items.length; i++) {
        if (data.items[i].from_model) {
            data.items[i].from_model.accountName = accountName[data.items[i].from] || null
        } else {
            data.items[i].from_model = { accountName: accountName[data.items[i].from] || null }
        }
        if (data.items[i].to_model) {
            data.items[i].to_model.accountName = accountName[data.items[i].to] || null
        } else {
            data.items[i].to_model = { accountName: accountName[data.items[i].to] || null }
        }
    }
    if (data.pages > 500) {
        data.pages = 500
    }

    return res.json(data)
})

TxController.get(['/txs/:slug', '/tx/:slug'], [
    check('slug').exists().isLength({ min: 66, max: 66 }).withMessage('Transaction hash is incorrect.')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let hash = req.params.slug
    hash = hash ? hash.toLowerCase() : hash
    try {
        let tx
        try {
            tx = await TransactionHelper.getTxDetail(hash)
        } catch (e) {
            logger.warn('cannot get tx detail. Error', e)
            return res.status(404).json({ errors: { message: 'Transaction is not found!' } })
        }
        if (!tx) {
            return res.status(404).json({ errors: { message: 'Transaction is not found!' } })
        }
        tx.from_model = await db.Account.findOne({ hash: tx.from.toLowerCase() })
        let toModel
        if (tx.to) {
            toModel = await db.Account.findOne({ hash: tx.to.toLowerCase() })
        } else {
            toModel = await db.Account.findOne({ hash: tx.contractAddress.toLowerCase() })
        }
        tx.to_model = toModel

        let trc20Txs = await db.TokenTx.find({ transactionHash: tx.hash }).maxTimeMS(20000)
        trc20Txs = await TokenTransactionHelper.formatTokenTransaction(trc20Txs)
        tx.trc20Txs = trc20Txs

        let trc21Txs = await db.TokenTrc21Tx.find({ transactionHash: tx.hash }).maxTimeMS(20000)
        trc21Txs = await TokenTransactionHelper.formatTokenTransaction(trc21Txs)
        tx.trc21Txs = trc21Txs

        let trc21FeeFund = -1
        if (trc21Txs.length > 0) {
            try {
                let web3 = await await Web3Util.getWeb3()
                let contract = new web3.eth.Contract(TomoIssuer, config.get('TOMOISSUER'))
                let listToken = await contract.methods.tokens().call()
                let isRegisterOnTomoIssuer = false
                for (let i = 0; i < listToken.length; i++) {
                    if (listToken[i].toLowerCase() === tx.to.toLowerCase()) {
                        isRegisterOnTomoIssuer = true
                        break
                    }
                }
                if (isRegisterOnTomoIssuer) {
                    trc21FeeFund = await contract.methods.getTokenCapacity(tx.to).call()
                } else {
                    trc21FeeFund = -1
                }
            } catch (e) {
                logger.warn(e)
            }
        }
        tx.trc21FeeFund = trc21FeeFund

        let trc721Txs = await db.TokenNftTx.find({ transactionHash: tx.hash }).maxTimeMS(20000)
        trc721Txs = await TokenTransactionHelper.formatTokenTransaction(trc721Txs)
        tx.trc721Txs = trc721Txs

        let web3 = await Web3Util.getWeb3()
        let blk = await web3.eth.getBlock('latest')
        tx.latestBlockNumber = (blk || {}).number || tx.blockNumber
        let input = tx.input
        if (input !== '0x') {
            let method = input.substr(0, 10)
            let stringParams = input.substr(10, input.length - 1)
            let params = []
            let paramsType = []
            for (let i = 0; i < stringParams.length / 64; i++) {
                params.push(stringParams.substr(i * 64, 64))
            }
            let inputData = ''
            if (tx.to && (toModel || {}).isContract) {
                let dbContract = await db.Contract.findOne({ hash: tx.to.toLowerCase() })
                let functionString = ''
                if (dbContract) {
                    inputData += 'Function: '
                    let functionHashes = dbContract.functionHashes
                    let abiCode = JSON.parse(dbContract.abiCode)
                    Object.keys(functionHashes).map(function (key) {
                        if (method === '0x' + functionHashes[key]) {
                            let methodName = key.indexOf('(') < 0 ? key : key.split('(')[0]
                            functionString += methodName + '('
                            abiCode.map(function (fnc) {
                                if (fnc.name === methodName) {
                                    for (let i = 0; i < fnc.inputs.length; i++) {
                                        let input = fnc.inputs[i]
                                        if (i === 0) {
                                            functionString += `${input.type} ${input.name}`
                                        } else {
                                            functionString += `, ${input.type} ${input.name}`
                                        }
                                        paramsType.push(input.type)
                                    }
                                }
                            })
                            functionString += ')'
                        }
                    })
                } else {
                    if (method === '0xa9059cbb') {
                        functionString = 'Function: transfer(address _to, uint256 _value) ***'
                    }
                }
                inputData += functionString === '' ? '' : functionString + '\n'
            }

            if (tx.to !== null) {
                inputData += 'MethodID: ' + method
                for (let i = 0; i < params.length; i++) {
                    let decodeValue = ''
                    let uint = ['uint', 'uint8', 'uint8', 'uint16', 'uint32', 'uint64', 'uint128', 'uint256']
                    if (uint.includes(paramsType[i])) {
                        decodeValue = web3.utils.hexToNumberString(params[i])
                    } else if (paramsType[i] === 'address') {
                        decodeValue = params[i].replace('000000000000000000000000', '0x')
                    } else {
                        decodeValue = params[i]
                    }
                    inputData += `\n[${i}]: ${decodeValue}`
                }
                tx.inputData = inputData
            }
        }
        let extraInfo = await db.TxExtraInfo.find({ transactionHash: hash })
        tx.extraInfo = extraInfo

        return res.json(tx)
    } catch (e) {
        logger.warn('cannot get list tx %s detail. Error %s', hash, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

TxController.get('/txs/internal/:address', [
    check('limit').optional().isInt({ max: 100 }).withMessage('Limit is less than 101 items per page'),
    check('page').optional().isInt({ max: 500 }).withMessage('Page is less than or equal 500'),
    check('address').exists().isLength({ min: 42, max: 42 }).withMessage('Account address is incorrect.'),
    check('fromBlock').optional().isInt().withMessage('Require fromBlock is number'),
    check('toBlock').optional().isInt().withMessage('Require toBlock is number')

], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let address = req.params.address
    address = address ? address.toLowerCase() : address
    try {
        let params = { query: { $or: [{ from: address }, { to: address }] }, sort: { blockNumber: -1 } }
        let bln = {}
        if (req.query.fromBlock) {
            bln = Object.assign({}, bln, { $gte: req.query.fromBlock })
        }
        if (req.query.toBlock) {
            bln = Object.assign({}, bln, { $lte: req.query.toBlock })
        }
        if (Object.keys(bln).length > 0) {
            params.query = Object.assign({}, params.query, { blockNumber: bln })
        }
        let data = await utils.paginate(req, 'InternalTx', params)
        if (data.pages > 500) {
            data.pages = 500
        }
        return res.json(data)
    } catch (e) {
        logger.warn('cannot get list internal tx of address %s. Error %s', address, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

TxController.get('/txs/combine/:address', [
    check('limit').optional().isInt({ max: 20 }).withMessage("'limit' should than 20 items per page"),
    check('page').optional().isInt({ max: 50 }).withMessage("'page' should less than 50"),
    check('address').exists().withMessage('Address is require')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const address = req.params.address.toLowerCase()
    try {
        let limit = (req.query.limit) ? parseInt(req.query.limit) : 20
        const page = (req.query.page) ? parseInt(req.query.page) : 1
        let skip
        skip = (req.query.page) ? limit * (req.query.page - 1) : 1
        let timestamp = (req.query.timestamp) ? parseInt(req.query.timestamp) : new Date().getTime()

        // get latest sent tx
        const latestTxTo = await db.Tx.findOne({
            to: address,
            timestamp: {
                $lte: new Date(timestamp)
            }
        }).sort({ blockNumber: -1 }).lean().exec() || {}
        const latestTxFrom = await db.Tx.findOne({
            from: address,
            timestamp: {
                $lte: new Date(timestamp)
            }
        }).sort({ blockNumber: -1 }).lean().exec() || {}

        const blockNumber = (latestTxFrom.blockNumber || 0) > (latestTxTo.blockNumber || 0)
            ? latestTxFrom.blockNumber : latestTxTo.blockNumber

        // account's txs
        const txsAccount1 = db.Tx.find({
            $or: [{ to: address }, { from: address }],
            timestamp: {
                $lte: new Date(timestamp)
            }
        }).sort({ blockNumber: -1 }).limit(limit * page).lean().exec() || []

        // get internal tx by account
        const internalTx1 = db.InternalTx.find({
            $or: [{ to: address }, { from: address }],
            blockNumber: { $lte: blockNumber }
        }).sort({ blockNumber: -1 }).limit(limit * page).lean().exec() || []

        // get token trc20 tx by account
        const token20Txs1 = db.TokenTx.find({
            $or: [{ to: address }, { from: address }],
            blockNumber: { $lte: blockNumber }
        }).sort({ blockNumber: -1 }).limit(limit * page).lean().exec() || []

        // get token trc21 tx by account
        const token21Txs1 = db.TokenTrc21Tx.find({
            $or: [{ to: address }, { from: address }],
            blockNumber: { $lte: blockNumber }
        }).sort({ blockNumber: -1 }).limit(limit * page).lean().exec() || []

        const token721Txs1 = db.TokenNftTx.find({
            $or: [{ to: address }, { from: address }],
            blockNumber: { $lte: blockNumber }
        }).sort({ blockNumber: -1 }).limit(limit * page).lean().exec() || []

        const promises2 = await Promise.all([
            (await txsAccount1).map(tx => {
                tx.txType = 'normalTx'
                return tx
            }),
            (await internalTx1).map(tx => {
                tx.txType = 'internalTx'
                return tx
            }),
            (await token20Txs1).map(tx => {
                tx.txType = 'trc20Tx'
                return tx
            }),
            (await token21Txs1).map(tx => {
                tx.txType = 'trc21Tx'
                return tx
            }),
            (await token721Txs1).map(tx => {
                tx.txType = 'trc721Tx'
                return tx
            })
        ])

        // combine
        const array = [
            ...promises2[0],
            ...promises2[1],
            ...promises2[2],
            ...promises2[3],
            ...promises2[4]
        ]
        const sortedArray = array.sort((a, b) => {
            return b.blockNumber - a.blockNumber
        })

        // get model

        const map = await Promise.all(sortedArray.map(async tx => {
            const promises = await Promise.all([
                db.Account.findOne({ hash: tx.from }),
                db.Account.findOne({ hash: tx.to })
            ])

            const fromModel = promises[0]
            const toModel = promises[1]
            fromModel.code = ''
            toModel.code = ''

            tx.from_model = fromModel
            tx.to_model = toModel
            return tx
        }))
        const from = (skip - 1) > 0 ? skip : 0
        const to = (limit + skip) - 1

        return res.json({
            items: map.slice(from, to)
        })
    } catch (e) {
        logger.warn('cannot get list tx of address %s. Error %s', address, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

module.exports = TxController
