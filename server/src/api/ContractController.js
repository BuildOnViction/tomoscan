import { Router } from 'express'
import solc from 'solc'
import axios from 'axios'

const ContractController = Router()

ContractController.get('/contracts/soljsons', async (req, res, next) => {
  try {
    let {data} = await axios.get(
      'https://ethereum.github.io/solc-bin/bin/list.json')

    let versions = []
    if (data) {
      versions = data.builds.map((item) => item.longVersion)
    }
    versions.reverse()

    return res.json(versions)
  }
  catch (e) {
    console.log(e)
    throw e
  }
})

ContractController.post('/contracts', async (req, res, next) => {
  try {
    const sourceCode = req.body.sourceCode
    let version = req.body.version
    version = version ? version : 'latest'
    solc.loadRemoteVersion(version,
      (err, snapshot) => {
        const output = snapshot.compile(sourceCode, 1)

        return res.json({output})
      })
  }
  catch (e) {
    console.log(e)
    throw e
  }
})

export default ContractController