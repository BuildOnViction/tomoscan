import { Router } from 'express'
import solc from 'solc'
import ContractRepository from '../repositories/ContractRepository'
import AccountRepository from '../repositories/AccountRepository'

const ContractController = Router()

ContractController.get('/contracts/soljsons', async (req, res, next) => {
  try {
    const versions = await ContractRepository.getVersions()

    return res.json({versions})
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
    const originalCode = AccountRepository.getCode(contractAddress)
    let versionRelease = versions[version]
    versionRelease = versionRelease.replace('soljson-', '')
    versionRelease = versionRelease.replace('.js', '')

    solc.loadRemoteVersion(versionRelease,
      async (err, snapshot) => {
        if (err) {
          return res.sendStatus(500)
        }
        const output = snapshot.compile(sourceCode, optimization)
        // Check name valid.
        if (typeof output.contracts[':' + contractName] === 'undefined') {
          return res.json({errors: ['Contract Name invalid!']})
        }
        console.log('0x' +
          output.contracts[':' + contractName].runtimeBytecode.length, '0x' +
          output.contracts[':' + contractName].runtimeBytecode)
        console.log(originalCode.length, originalCode)
        if ('0x' + output.contracts[':' + contractName].runtimeBytecode !==
          originalCode) {
          return res.json({errors: ['Bytecode runtime invalid!']})
        }

        let contract = await ContractRepository.insertOrUpdate(contractName,
          contractAddress,
          versionRelease, sourceCode, output)

        return res.json({contract})
      })
  }
  catch (e) {
    console.log(e)
    return res.sendStatus(403)
  }
})

export default ContractController