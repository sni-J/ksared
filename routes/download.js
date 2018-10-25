'use strict'

const express = require('express')
const db = require('../db');
const fileProcess = require('../fileProcess');
const fs = require('fs');

let router = express.Router()
var extractedText="";

const multer = require('multer');
const mkdirp = require('mkdirp');

var date = new Date();

router.get('/',(req, res) => {
    res.send("이제 해야지");
});

module.exports = router
