const express = require('express')
const { USE_CLERK } = require('../config')

const { authGuard } = USE_CLERK ? require('../auth/clerk') : require('../auth/devStub')

const router = express.Router()
router.use(express.static('dist', { index: false }))

router.get('/', authGuard, (_, res) => res.sendFile('index.html', { root: 'dist' }))

module.exports = router
