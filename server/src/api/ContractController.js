import { Router } from 'express'
import solc from 'solc'
import md5 from 'blueimp-md5'
import ContractRepository from '../repositories/ContractRepository'
import AccountRepository from '../repositories/AccountRepository'
import Contract from '../models/Contract'
import { paginate } from '../helpers/utils'
import Web3Util from '../helpers/web3'
import ContractEvent from '../models/ContractEvent'
import _ from 'lodash'

const ContractController = Router()

ContractController.get('/contracts', async (req, res, next) => {
  try {
    let data = await paginate(req, 'Contract',
      {query: {}})

    return res.json(data)
  }
  catch (e) {
    console.log(e)
    throw e
  }
})

ContractController.get('/contracts/soljsons', async (req, res, next) => {
  try {
    const versions = await ContractRepository.getVersions()

    return res.json(versions)
  }
  catch (e) {
    console.log(e)
    throw e
  }
})

ContractController.post('/contracts', async (req, res, next) => {
  try {
    const versions = await ContractRepository.getVersions()
    const sourceCode = req.body.sourceCode
    const optimization = req.body.optimization
    const version = req.body.version
    const contractAddress = req.body.contractAddress
    let contractName = req.body.contractName
    contractName = contractName ? contractName.replace(' ', '') : ''

    // Check exists and return.
    let exist = await Contract.findOne({hash: contractAddress})
    if (exist) {
      // return res.json({errors: ['This contract is validated']})
    }

    const originalCode = await AccountRepository.getCode(contractAddress)
    let versionRelease = versions[version]
    versionRelease = versionRelease.replace('soljson-', '')
    versionRelease = versionRelease.replace('.js', '')

    solc.loadRemoteVersion(versionRelease,
      async (err, snapshot) => {
        if (err) {
          return res.sendStatus(500)
        }
        const output = snapshot.compile(sourceCode, optimization)

        if(_.isEmpty(output.contracts)) {
          return res.json({errors: ['Unable to Verify Contract source code']})
        }
        // Check name valid.
        if (typeof output.contracts[':' + contractName] === 'undefined') {
          return res.json({errors: ['Contract Name invalid!']})
        }

        let contracts = [];
        
        Object.keys(output.contracts).forEach(contract => {
          contracts.push(contract.substr(1, contract.length - 1))
        })

        let runtimeBytecode = '0x' +
          output.contracts[':' + contractName].runtimeBytecode
        if (md5(runtimeBytecode.slice(0, -100)) !==
          md5(originalCode.slice(0, -100))) {
          return res.json({errors: [
            `Contract names found: ${contracts.join(', ')}`,
            'Bytecode runtime invalid!'
          ]})
        }

        let contract = await ContractRepository.insertOrUpdate(contractName,
          contractAddress,
          versionRelease, sourceCode, optimization, output)

        return res.json(contract)
      })
  }
  catch (e) {
    console.log(e)
    return res.sendStatus(403)
  }
})

ContractController.get('/contracts/:slug/events', async (req, res, next) => {
  try {
    let hash = req.params.slug
    hash = hash ? hash.toLowerCase() : hash
    let contract = await Contract.findOne({hash: hash})
    if (!contract) {
      return res.status(404).send()
    }

    let abiObject = JSON.parse(contract.abiCode)
    let contractEvents = abiObject.filter((item) => item.type === 'event')

    let web3 = await Web3Util.getWeb3()
    let web3Contract = new web3.eth.Contract(abiObject,
      contract.hash)

    let pastEvents = await ContractEvent.find(
      {address: hash}).
      sort({blockNumber: -1}).lean()
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
          toBlock: 'latest',
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

            let contractEvent = await ContractRepository.addNew(hash,
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
  }
  catch (e) {
    console.log(e)
    return res.sendStatus(500)
  }
})

export default ContractController