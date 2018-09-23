'use strict'

const express = require('express')
let router = express.Router()
const db = require('../db')

router.get('/', (req, res) => {
  db.searchWithInput(req, (htmlData)=>{
    // console.log(req.query);
    res.send(htmlData);
  })
})

router.get('/searchWord',(req,res)=>{
  db.getSearchAutoComplete(function(words){
      // console.log(words);
      res.send(words);
  });
})

module.exports = router
