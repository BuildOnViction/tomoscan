import { Router } from 'express'
import axios from 'axios'
import urlJoin from 'url-join'
import config from 'config'
const logger = require('../helpers/logger')

const MasternodeController = Router()

MasternodeController.get('/masternodes', async (req, res) => {
    try {
        const tomomasterUrl = config.get('TOMOMASTER_API_URL')
        const { data } = await axios.get(urlJoin(tomomasterUrl, '/api/candidates'))
        return res.json(data)
    } catch (e) {
        logger.warn(e)
        return res.status(500).send()
    }
})

export default MasternodeController
