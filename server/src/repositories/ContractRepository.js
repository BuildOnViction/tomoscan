import axios from 'axios'
import Contract from '../models/Contract'

let ContractRepository = {
  async getVersions () {
    let {data} = await axios.get(
      'https://ethereum.github.io/solc-bin/bin/list.json')
    let versions = Object.values(data.releases)

    return versions
  },

  async insertOrUpdate (
    contractName, contractAddress, releaseVersion, sourceCode, ouput) {
    let update = {
      hash: contractAddress,
      contractName: contractName,
      compiler: releaseVersion,
      sourceCode: sourceCode,
      abiCode: ouput.contracts[':' + contractName].interface,
      functionHashes: ouput.contracts[':' + contractName].functionHashes,
      opcodes: ouput.contracts[':' + contractName].opcodes,
      bytecode: ouput.contracts[':' + contractName].bytecode,
    }

    return await Contract.findOneAndUpdate({hash: contractAddress},
      update,
      {upsert: true, new: true}).lean()
  },
}

export default ContractRepository