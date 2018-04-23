import { Router } from 'express'
import Web3Util from '../helpers/web3'
import CronTab from '../services/CronTab'

const CronController = Router()

CronController.get('/cron/blocks', async (req, res) => {
  try {
    CronTab.getBlocks().then((blocks) => {
      return res.json({blocks: blocks})
    }).catch((e) => {
      res.status(500).send(e.message)
    })
  }
  catch (e) {
    console.log(e)
    throw e
  }
})

CronController.get('/cron/blocks/:slug', async (req, res) => {
  try {
    let web3 = await Web3Util.getWeb3()
    let result = await web3.eth.getBlock(req.params.slug)

    return res.json(result)
  }
  catch (e) {
    console.log(e)
    throw e
  }
})

CronController.get('/cron/txs', async (req, res) => {
  try {
    CronTab.getTransactions().then((txs) => {
      return res.json({txs: txs})
    }).catch((e) => {
      res.status(500).send(e.message)
    })
  }
  catch (e) {
    console.log(e)
    throw e
  }
})

CronController.get('/cron/accounts', async (req, res) => {
  try {
    CronTab.getAccounts().then((accounts) => {
      return res.json({accounts: accounts})
    }).catch((e) => {
      res.status(500).send(e.message)
    })
  }
  catch (e) {
    console.log(e)
    throw e
  }
})

CronController.get('/test', async (req, res) => {
  try {
//    var tokenInfoFunctionMap = {"decimals": "0x313ce567",//hex to decimal
//      "symbol": "0x95d89b41", //hex to ascii
//      "totalSupply": "0x18160ddd",
//      "name": "0x06fdde03",
//      "version": "54fd4d50"//not working
//    }
//    let web3 = await Web3Util.getWeb3()
//    let name = web3.utils.hexToAscii(await web3.eth.call(
//      {to: '0x29317b796510afc25794e511e7b10659ca18048b', data: '0x06fdde03'}))
//    let tx = await web3.eth.getTransaction(
//      '0xcd4553564ae4df86695678980dc664af6cdefcaadd472a032c828e08429079cc')
//    let receipt = await web3.eth.getTransactionReceipt(
//      '0xcd4553564ae4df86695678980dc664af6cdefcaadd472a032c828e08429079cc')
//    let symbol = web3.utils.hexToAscii(await web3.eth.call(
//      {to: '0x29317b796510afc25794e511e7b10659ca18048b', data: '0x95d89b41'}))
//    let totalSupply = web3.utils.hexToNumberString(await web3.eth.call(
//      {to: '0x29317b796510afc25794e511e7b10659ca18048b', data: '0x18160ddd'}))
//
//    console.log(name, symbol, totalSupply)
//    return res.json({
//      name: name,
//      tx: tx,
//      receipt: receipt,
//      symbol: symbol,
//      totalSupply: totalSupply,
//    })
  }
  catch (e) {
    console.log(e)
    throw e
  }
})

export default CronController