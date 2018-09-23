'use strict'

const express = require('express')
let router = express.Router()
const i18n = require('../i18n');

router.get('/words', (req, res) => {
    var words=req.query.words.split("|");
    var TDWords = {};
    words.forEach(word=>{
        TDWords[word] = i18n.__({phrase:word, locale:(i18n.extractLocale(req)||"")});
        // console.log(word, req.headers['accept-language'], (i18n.extractLocale(req)||""), TDWords[word]);
    })
    res.send(TDWords);
})

module.exports = router
