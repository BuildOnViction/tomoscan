const { Router } = require('express')
const solc = require('solc')
const md5 = require('blueimp-md5')
const db = require('../models')
const { paginate } = require('../helpers/utils')
const Web3Util = require('../helpers/web3')
const _ = require('lodash')
const AccountHelper = require('../helpers/account')
const ContractHelper = require('../helpers/contract')

const TransactionHelper = require('../helpers/transaction')
const logger = require('../helpers/logger')
const { check, validationResult } = require('express-validator/check')

const ContractController = Router()

ContractController.get('/contracts', [
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('page').optional().isInt().withMessage('Require page is number')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    try {
        let data = await paginate(req, 'Contract',
            { query: {}, sort: { createdAt: -1 } })

        return res.json(data)
    } catch (e) {
        logger.warn('Error get list contract %s', e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

ContractController.get('/contracts/:slug', [
    check('slug').exists().isLength({ min: 42, max: 42 }).withMessage('Contract address is incorrect.')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    try {
        let hash = req.params.slug
        hash = hash ? hash.toLowerCase() : hash
        let contract = await db.Contract.findOne({ hash: hash })
        if (!contract) {
            return res.status(404).json({ errors: { message: 'Contract was not found!' } })
        }

        return res.json(contract)
    } catch (e) {
        logger.warn('Error get contract detail %s', e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

ContractController.get('/soljsons', async (req, res) => {
    try {
        const versions = await ContractHelper.getVersions()

        return res.json(versions)
    } catch (e) {
        logger.warn(e)
        return res.status(400).send()
    }
})

ContractController.post('/contracts', [
    check('sourceCode').exists().withMessage('Missing source code params'),
    check('optimization').exists().withMessage('Missing optimization params'),
    check('version').exists().withMessage('Missing version params'),
    check('contractAddress').exists().withMessage('Missing contract address params'),
    check('contractName').exists().withMessage('Missing contract name params')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    try {
        const versions = await ContractHelper.getVersions()
        const sourceCode = req.body.sourceCode
        const optimization = req.body.optimization
        const version = req.body.version
        const contractAddress = req.body.contractAddress.toLowerCase()
        let contractName = req.body.contractName
        contractName = contractName ? contractName.replace(' ', '') : ''

        // Check exists and return.
        let exist = await db.Contract.findOne({ hash: contractAddress })
        if (exist) {
            return res.json({ errors: ['This contract was validated'] })
        }

        const originalCode = await AccountHelper.getCode(contractAddress)
        let versionRelease = versions[version]
        versionRelease = versionRelease.replace('soljson-', '')
        versionRelease = versionRelease.replace('.js', '')

        solc.loadRemoteVersion(versionRelease,
            async (err, snapshot) => {
                if (err) {
                    return res.status(400).json({ errors: { message: 'Cannot load remote version' } })
                }
                const output = snapshot.compile(sourceCode, optimization)

                if (_.isEmpty(output.contracts)) {
                    return res.json({ errors: ['Unable to Verify Contract source code'] })
                }

                let outputContract = output.contracts[contractName]

                if (typeof outputContract === 'undefined') {
                    outputContract = output.contracts[':' + contractName]
                }

                // Check name valid.
                if (typeof outputContract === 'undefined') {
                    return res.json({ errors: ['Contract Name invalid!'] })
                }

                let contracts = []

                Object.keys(output.contracts).forEach(contract => {
                    if (contract.startsWith(':')) {
                        contracts.push(contract.substr(1, contract.length - 1))
                    } else {
                        contracts.push(contract.substr(0, contract.length))
                    }
                })

                let runtimeBytecode = '0x' + outputContract.runtimeBytecode

                // TODO: this hard-code to verify built-in smart contracts
                // if (md5(runtimeBytecode.slice(0, -100)) !== md5(originalCode.slice(0, -100))) {
                if ((contractAddress !== '0x0000000000000000000000000000000000000088' ||
                    contractAddress !== '0x0000000000000000000000000000000000000089' ||
                    contractAddress !== '0x0000000000000000000000000000000000000090') &&
                    (md5(runtimeBytecode.slice(0, -100)) !== md5(originalCode.slice(0, -100)))) {
                    return res.json({ errors: [
                        `Contract names found: ${contracts.join(', ')}`,
                        'Bytecode runtime invalid!',
                        `Tips: Try to ${req.body.optimization ? 'disable' : 'enable'} the 'Optimization' option`
                    ] })
                }

                let contract = await ContractHelper.insertOrUpdate(contractName,
                    contractAddress,
                    versionRelease, sourceCode, optimization, output)

                return res.json(contract)
            })
    } catch (e) {
        logger.warn('Error verify contract %s', e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

ContractController.get('/contracts/:slug/events', [
    check('slug').exists().isLength({ min: 42, max: 42 }).withMessage('Contract address is incorrect.')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let hash = req.params.slug
    try {
        hash = hash ? hash.toLowerCase() : hash
        let contract = await db.Contract.findOne({ hash: hash })
        if (!contract) {
            return res.status(404).json({ errors: { message: 'Contract was not found' } })
        }

        let abiObject = JSON.parse(contract.abiCode)
        let contractEvents = abiObject.filter((item) => item.type === 'event')

        let web3 = await Web3Util.getWeb3()
        let web3Contract = new web3.eth.Contract(abiObject, contract.hash)

        let pastEvents = await db.ContractEvent.find(
            { address: hash })
            .sort({ blockNumber: -1 }).lean()
        let fromBlock = 0
        let events = []
        if (pastEvents.length) {
            fromBlock = pastEvents[0].blockNumber
            events = events.concat(pastEvents)
        }

        if (contractEvents.length) {
            for (let i = 0; i < contractEvents.length; i++) {
                let event = contractEvents[i]
                let results = await web3Contract.getPastEvents(event.name, {
                    fromBlock: fromBlock,
                    toBlock: 'latest'
                })
                if (results.length) {
                    for (let j = 0; j < results.length; j++) {
                        // Get tx relate.
                        let tx = await TransactionHelper.getTransaction(
                            results[j].transactionHash)

                        let functionHash = tx.input.substring(0, 10)
                        functionHash = functionHash.replace('0x', '')
                        let functionName = _.findKey(contract.functionHashes,
                            (o) => o === functionHash)

                        let contractEvent = await ContractHelper.addNew(hash,
                            functionHash, functionName,
                            results[j])

                        if (contractEvent) {
                            events.push(contractEvent)
                        }
                    }
                }
            }
        }

        return res.json(events)
    } catch (e) {
        logger.warn('Error get contract %s events %s', hash, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

ContractController.get('/contracts/:slug/read', [
    check('slug').exists().isLength({ min: 42, max: 42 }).withMessage('Contract address is incorrect.')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let hash = req.params.slug
    try {
        hash = hash ? hash.toLowerCase() : hash
        let contract = await db.Contract.findOne({ hash: hash })

        if (!contract) {
            return res.status(404).json({ errors: { message: 'Contract was not found' } })
        }

        let abiObject = JSON.parse(contract.abiCode)
        let contractFunctions = abiObject.filter((item) =>
            (item.type === 'function') &&
            (item.stateMutability !== 'nonpayable') &&
            (item.stateMutability !== 'payable'))

        let web3 = await Web3Util.getWeb3()
        let web3Contract = new web3.eth.Contract(abiObject, contract.hash)
        let results = []

        if (contractFunctions.length) {
            for (let i = 0; i < contractFunctions.length; i++) {
                let func = contractFunctions[i]

                if (func.constant && !func.inputs.length) {
                    try {
                        func.result = await web3Contract.methods[func.name]().call()
                    } catch (e) {
                        logger.warn(e)
                    }
                }

                results.push(func)
            }
        }

        return res.json(results)
    } catch (e) {
        logger.warn('Error get contract %s events %s', hash, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

ContractController.get('/contracts/:slug/call/', async (req, res) => {
    let result = []
    try {
        let functionName = req.query.functionName
        let signature = req.query.signature
        let strParams = req.query.strParams
        let hash = req.params.slug
        hash = hash ? hash.toLowerCase() : hash
        let contract = await db.Contract.findOne({ hash: hash })

        if (!contract) {
            return res.status(404).send()
        }

        let abiObject = JSON.parse(contract.abiCode)
        let web3 = await Web3Util.getWeb3()
        let web3Contract = new web3.eth.Contract(abiObject, contract.hash)

        let contractFunctions = abiObject.filter((item) =>
            (item.type === 'function') &&
      (item.stateMutability !== 'nonpayable') &&
      (item.stateMutability !== 'payable') &&
      (item.name === functionName) &&
      (item.signature) === signature)

        let rs = await web3Contract.methods[functionName](...strParams.split(',')).call()

        for (let i = 0; i < contractFunctions[0].outputs.length; i++) {
            let output = contractFunctions[0].outputs[i]
            let outputRs = output
            let value = ''

            if (typeof rs === 'object') {
                value = _.get(rs, output.name)

                if (value !== 'undefined') {
                    value = _.get(rs, i)
                }
            } else {
                value = rs
            }

            if (output.type === 'address') {
                if (value === 0) {
                    value = '0x0000000000000000000000000000000000000000'
                }

                value = value.toLowerCase()
            }

            outputRs.value = value

            result.push(outputRs)
        }
    } catch (e) {
        logger.warn(e)
        result.push({
            name: 'Error',
            type: 'string',
            value: e.message
        })
    }

    return res.json(result)
})

ContractController.get('/contractCreator/:slug', async (req, res) => {
    try {
        let hash = req.params.slug
        hash = hash.toLowerCase()
        let account
        account = await db.Account.findOne({ hash: hash })

        return res.json(account)
    } catch (e) {
        logger.warn(e)
        return res.status(404).send()
    }
})

module.exports = ContractController
