import axios from 'axios'
import Contract from '../models/Contract'
import ContractEvent from '../models/ContractEvent'
import _ from 'lodash'

let ContractRepository = {
  async getVersions () {
    let {data} = await axios.get(
      'https://ethereum.github.io/solc-bin/bin/list.json')
    let versions = Object.values(data.releases)

    return versions
  },

  async insertOrUpdate (
    contractName, contractAddress, releaseVersion, sourceCode, optimization,
    ouput) {
    let update = {
      hash: contractAddress,
      contractName: contractName,
      compiler: releaseVersion,
      sourceCode: sourceCode,
      abiCode: ouput.contracts[':' + contractName].interface,
      functionHashes: ouput.contracts[':' + contractName].functionHashes,
      opcodes: ouput.contracts[':' + contractName].opcodes,
      bytecode: ouput.contracts[':' + contractName].bytecode,
      optimization: optimization,
    }

    return await Contract.findOneAndUpdate({hash: contractAddress},
      update,
      {upsert: true, new: true}).lean()
  },

  async addNew (address, functionHash, functionName, obj) {
    let exist = await ContractEvent.findOne({id: obj.id})
    if (exist) {
      return null
    }
    obj.address = address
    obj.functionHash = functionHash
    obj.functionName = functionName
    return await ContractEvent.create(obj)
  },
}

export default ContractRepository