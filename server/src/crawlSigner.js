'use strict'

const db = require('./models')
import Web3Util from './helpers/web3'

const ABI = [
    {
        "constant": true,
        "inputs": [],
        "name": "epochNumber",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "name": "_epochNumber",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "name": "_signer",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "_blockNumber",
                "type": "uint256"
            },
            {
                "indexed": false,
                "name": "_blockHash",
                "type": "bytes32"
            }
        ],
        "name": "Sign",
        "type": "event"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_blockNumber",
                "type": "uint256"
            },
            {
                "name": "_blockHash",
                "type": "bytes32"
            }
        ],
        "name": "sign",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "_blockHash",
                "type": "bytes32"
            }
        ],
        "name": "getSigners",
        "outputs": [
            {
                "name": "",
                "type": "address[]"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
]

const ADDRESS = '0x0000000000000000000000000000000000000089'


async function watchBlockSigner () {
    const web3 = await Web3Util.getWeb3Socket()
    // const provider = await new Web3.providers.HttpProvider(config.get('WEB3_URI'))
    // const web3 = await new Web3(provider)
    const BlockSigner = new web3.eth.Contract(ABI, ADDRESS)
    
    const blockNumber = 0
    console.info('BlockSigner %s - Listen events from block number %s ...', ADDRESS, blockNumber)
    const allEvents = BlockSigner.events.allEvents(
        {fromBlock: blockNumber, toBlock: 'latest'},
        function (err, res) {
            if (err || !(res || {}).args) {
                console.error(err, res)
                return false
            }
            console.info('BlockSigner - New event %s from block %s', res.event, res.blockNumber)
            let signer = res.args._signer
            let tx = res.transactionHash
            let bN = String(res.args._blockNumber)

            return db.BlockSigner.update({
                smartContractAddress: ADDRESS,
                blockNumber: bN
            }, {
                $set: {
                    smartContractAddress: ADDRESS,
                    blockNumber: bN
                },
                $addToSet: {
                    signers: {
                        signer: signer,
                        tx: tx
                    }
                }
            }, { upsert: true })
        }
    )

}

try {
    watchBlockSigner()
} catch (e) {
    console.error(e)
}
