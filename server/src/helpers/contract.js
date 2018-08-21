import axios from 'axios'
import db from '../models'

let ContractHelper = {
    async getVersions () {
        let { data } = await axios.get(
            'https://ethereum.github.io/solc-bin/bin/list.json')
        return Object.values(data.releases)
    },

    async insertOrUpdate (contractName, contractAddress, releaseVersion, sourceCode, optimization, ouput) {
        contractAddress = contractAddress.toLowerCase()
        let txCount = await db.Tx.find({ to: contractAddress }).count()

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
            txCount: txCount
        }

        let contract = await db.Contract.findOneAndUpdate({ hash: contractAddress },
            update,
            { upsert: true, new: true })
        return contract
    },

    async addNew (address, functionHash, functionName, obj) {
        let exist = await db.ContractEvent.findOne({ id: obj.id })
        if (exist) {
            return null
        }
        obj.address = address.toLowerCase()
        obj.functionHash = functionHash.toLowerCase()
        obj.functionName = functionName
        let event = await db.ContractEvent.create(obj)
        return event
    }
}

export default ContractHelper
