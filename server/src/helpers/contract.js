const axios = require('axios')
const db = require('../models')

const ContractHelper = {
    async getVersions () {
        const { data } = await axios.get(
            'https://ethereum.github.io/solc-bin/bin/list.json')
        const releases = data.releases
        const result = []
        for (const key in releases) {
            const arr = key.split('.')
            if (parseInt(arr[1]) <= 4) {
                result.push(releases[key])
            }
        }
        return result
    },

    async insertOrUpdate (contractName, contractAddress, releaseVersion, sourceCode, optimization, ouput) {
        contractAddress = contractAddress.toLowerCase()
        const txCount = await db.Tx.countDocuments({
            $or: [
                { from: contractAddress },
                { to: contractAddress },
                { contractAddress: contractAddress }
            ]
        })

        const update = {
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

        const contract = await db.Contract.findOneAndUpdate({ hash: contractAddress },
            update,
            { upsert: true, new: true })
        return contract
    },

    async addNew (address, functionHash, functionName, obj) {
        const exist = await db.ContractEvent.findOne({ id: obj.id })
        if (exist) {
            return null
        }
        obj.address = address.toLowerCase()
        obj.functionHash = functionHash.toLowerCase()
        obj.functionName = functionName
        const event = await db.ContractEvent.create(obj)
        return event
    },
    async updateTxCount (hash) {
        // let txCount = await db.Tx.count({ $or: [{ from: hash }, { to: hash }, { contractAddress: hash }] })
        const fromCount = await db.Tx.countDocuments({ from: hash })
        const toCount = await db.Tx.countDocuments({ to: hash })
        const fromToCount = await db.Tx.countDocuments({ from: hash, to: hash })
        const contractCount = await db.Tx.countDocuments({ contractAddress: hash })

        const txCount = fromCount + toCount + contractCount - fromToCount
        await db.Contract.updateOne({ hash: hash },
            { txCount: txCount },
            { upsert: true, new: true })
        return txCount
    }
}

module.exports = ContractHelper
