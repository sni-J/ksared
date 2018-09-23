'use strict'

const express = require('express')
let router = express.Router()

const i18n = require('../i18n');
router.use(i18n.translate);

router.get('/', (req, res) => {
    res.render('admin', {i18n:res});
})

module.exports = router
