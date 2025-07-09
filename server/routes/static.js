const express = require('express')

const router = express.Router()
router.use(express.static('dist'))

module.exports = router
