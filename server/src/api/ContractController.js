import { Router } from 'express'
import solc from 'solc'
import md5 from 'blueimp-md5'
import db from '../models'
import { paginate } from '../helpers/utils'
import Web3Util from '../helpers/web3'
import _ from 'lodash'
import AccountHelper from '../helpers/account'
import ContractHelper from '../helpers/contract'

const ContractController = Router()

ContractController.get('/contracts', async (req, res, next) => {
    try {
        let data = await paginate(req, 'Contract',
            { query: {}, sort: { createdAt: -1 } })

        return res.json(data)
    } catch (e) {
        console.trace(e)
        console.log(e)
        return res.status(500).send()
    }
})

ContractController.get('/contracts/soljsons', async (req, res, next) => {
    try {
        const versions = await ContractHelper.getVersions()

        return res.json(versions)
    } catch (e) {
        console.trace(e)
        console.log(e)
        return res.status(500).send()
    }
})

ContractController.post('/contracts', async (req, res, next) => {
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
                    return res.sendStatus(500)
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
        console.trace(e)
        console.log(e)
        return res.status(500).send()
    }
})

ContractController.get('/contracts/:slug/events', async (req, res, next) => {
    try {
        let hash = req.params.slug
        hash = hash ? hash.toLowerCase() : hash
        let contract = await db.Contract.findOne({ hash: hash })
        if (!contract) {
            return res.status(404).send()
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
                        let tx = await web3.eth.getTransaction(
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
        console.trace(e)
        console.log(e)
        return res.status(500).send()
    }
})

ContractController.get('/contracts/:slug/read', async (req, res, nex) => {
    try {
        let hash = req.params.slug
        hash = hash ? hash.toLowerCase() : hash
        let contract = await db.Contract.findOne({ hash: hash })

        if (!contract) {
            return res.status(404).send()
        }

        let abiObject = JSON.parse(contract.abiCode)
        let contractFunctions = abiObject.filter((item) =>
            (item.type === 'function') &&
            (item.stateMutability !== 'nonpayable') &&
            (item.stateMutability !== 'payable'))

        let web3 = await Web3Util.getWeb3()
        let web3Contract = new web3.eth.Contract(abiObject, contract.hash) // eslint-disable-line no-unused-vars
        let results = []

        if (contractFunctions.length) {
            for (let i = 0; i < contractFunctions.length; i++) {
                let func = contractFunctions[i]

                if (func.constant && !func.inputs.length) {
                    var funcNameToCall = 'web3Contract.methods.' + func.name + '().call()'

                    try {
                        let rs = await eval(funcNameToCall) // eslint-disable-line no-eval
                        func.result = rs
                    } catch (e) {
                        console.trace(e)
                        console.log(e)
                    }
                }

                results.push(func)
            }
        }

        return res.json(results)
    } catch (e) {
        console.trace(e)
        console.log(e)
        return res.status(500).send()
    }
})

ContractController.get('/contracts/:slug/call/', async (req, res, nex) => {
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
        let web3Contract = new web3.eth.Contract(abiObject, contract.hash) // eslint-disable-line no-unused-vars

        let contractFunctions = abiObject.filter((item) =>
            (item.type === 'function') &&
      (item.stateMutability !== 'nonpayable') &&
      (item.stateMutability !== 'payable') &&
      (item.name === functionName) &&
      (item.signature) === signature)

        let funcNameToCall = 'web3Contract.methods.' + functionName + '(' + strParams + ').call()'

        let rs = await eval(funcNameToCall) // eslint-disable-line no-eval

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
        console.trace(e)
        console.log(e)
        result.push({
            name: 'Error',
            type: 'string',
            value: e.message
        })
    }

    return res.json(result)
})

ContractController.get('/contractCreator/:slug', async (req, res, next) => {
    try {
        let hash = req.params.slug
        hash = hash.toLowerCase()
        let account
        account = await db.Account.findOne({ hash: hash })

        return res.json(account)
    } catch (e) {
        console.trace(e)
        console.log(e)
        return res.status(404).send()
    }
})

export default ContractController
