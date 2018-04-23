import {Router} from 'express'

import AccountController from "./AccountController";
import TxController from "./TxController";
import CronController from "./CronController";
import BlockController from "./BlockController";

const router = Router()

// Add USERS Routes
router.use( BlockController )
router.use( CronController )
router.use( AccountController )
router.use( TxController )

export default router
