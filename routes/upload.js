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

router.post('/', fileProcess.uploadFile, (req, res) => {
    if(!req.AccPermission){
        res.send({Msg:"Permission Denied"});
        return;
    }else{
        console.log(`Permitted User ${req.session.stu_id} trying to upload`);
        var date = new Date();
        extractText(req.files['uploadFile'][0].path, (result)=>{
            if (!result){
                res.send("Extracting Text Failed");
                fileProcess.deleteFile(req.files['uploadFile'][0].path);
                console.log("Failed, so removed file "+req.files['uploadFile'][0].path);
            }
            else{
                if(req.files["extraFiles"]==undefined){
                    db.addResearch(req.body, req.files['uploadFile'][0].path, "", (result)=>{
                        res.send(result);
                    });
                }else{
                    db.addResearch(req.body, req.files['uploadFile'][0].path, req.files["extraFiles"].map(a=>a.path.join("|"), (result)=>{
                        res.send(result);
                    });
                }
            }
        });
    }
});

function extractText(filepath, callback){
    let PDFParser = require("pdf2json");
    let pdfParser = new PDFParser(this, 1);

    pdfParser.on("pdfParser_dataError", errData => {
        console.error(errData);
        callback(false);
    });
    pdfParser.on("pdfParser_dataReady", pdfData => {
        var txt=pdfParser.getRawTextContent();
        fs.writeFile(filepath.slice(0,-4)+".txt", txt);
        console.log("Extracting complete");
        callback(true);
    });

    // console.log(`Extracting Text from ${filepath.split('/').pop()}...`);
    pdfParser.loadPDF(filepath);
}

router.post('/edit', fileProcess.uploadFile, (req, res) => {
    var rsch;
    var table;
    if(!req.AccPermission){
        res.send({Msg:"Permission Denied"});
        return;
    }else{
        console.log(`Permitted User ${req.session.stu_id} trying to edit`);
        db.getInfo(req, req.body.research_id, (research)=>{
            edit(research||{researcher:""}, "researh_table");
        })
    }
    function edit(research, table){
        req.body.hidden = research.hidden;
        if(req.files["uploadFile"]==undefined && req.files["extraFiles"]==undefined){
            db.editResearch(req.body, "", "", (result)=>{
                res.send(result);
                return;
            });
        }else{
            if(req.files["uploadFile"]==undefined){
                db.editResearch(req.body, "", req.files["extraFiles"].map(a=>a.path), (result)=>{
                    res.send(result);
                });
            }else{
                extractText(req.files['uploadFile'][0].path, (result)=>{
                    if (!result){
                        res.send("Extracting Text Failed");
                        fileProcess.deleteFile(req.files['uploadFile'][0].path);
                        console.log("Failed, so removed folder "+req.files['uploadFile'][0].path);
                    }
                    else{
                        if(req.files["extraFiles"]==undefined){
                            db.editResearch(req.body, req.files['uploadFile'][0].path, "", (result)=>{
                                res.send(result);
                            });
                        }else{
                            db.editResearch(req.body, req.files['uploadFile'][0].path, req.files["extraFiles"].map(a=>a.path).join("|"), (result)=>{
                                res.send(result);
                            });
                        }
                    }
                })
            }
        }
    }
});

module.exports = router
