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

export default CronController