'use strict'

const express = require('express')
const db = require('../db');
const fileProcess = require('../fileProcess');
const fs = require('fs');

let router = express.Router()
var extractedText="";

const multer = require('multer');
const mkdirp = require('mkdirp');

function extractText(filepath, callback){
    let PDFParser = require("pdf2json");
    let pdfParser = new PDFParser(this, 1);

    pdfParser.on("pdfParser_dataError", errData => {
        console.log("pdfParser error "+errData);
        callback(false);
    });
    pdfParser.on("pdfParser_dataReady", pdfData => {
        var txt=pdfParser.getRawTextContent();
        var fname = filepath.slice(0,-4)+".txt";
        fs.writeFile(fname, txt, (err)=>{if(err){console.log("write file error " + err); callback(false); return;}});
        console.log("Extracting complete");
        callback(true);
    });

    console.log(`Extracting Text from ${filepath.split('/').pop()}...`);
    pdfParser.loadPDF(filepath);
}

function AWSUploader(req, cb){
    var cbresult = "Done";
    function uplUploader(callback){
        if(req.files["uploadFile"]==undefined){
            console.log("No uploadFile"); callback("");
        }else{
            fileProcess.AWSUpload("/app/uploads/"+req.files["uploadFile"][0].path.split("/uploads/")[1],callback);
        }
    }
    function extUploader(callback){
        function uploadEachFiles(files, extFilePaths, cb){
            if(files.length == 0){
                cb(extFilePaths);
                return;
            }
            var filePath = files.pop();
            console.log(filePath);
            fileProcess.AWSUpload(filePath,(location)=>{
                extFilePaths[extFilePaths.length] = location;
                uploadEachFiles(files, extFilePaths, cb);
            });
        }
        if(req.files["extraFiles"]==undefined){
            console.log("No extraFiles"); callback([]);
        }else{
            uploadEachFiles(req.files["extraFiles"].map((a)=>{return "/app/uploads/"+a.path.split("/uploads/")[1]}), [], callback);
        }
    }
    req.setTimeout(0);
    uplUploader((upl)=>{
        if(upl!=""){
            extractText('/app/uploads/'+req.files['uploadFile'][0].path.split('/uploads/')[1], (result)=>{
                console.log("Extracting Text Result of "+ '/app/uploads/'+req.files['uploadFile'][0].path.split('/uploads/')[1]+ ' is '+ result);
                if (!result){
                    cbresult = "Extracting Text Failed";
                    fileProcess.deleteFile(req.files['uploadFile'][0].path);
                    console.log("Failed, so removed file "+'/app/uploads/'+req.files['uploadFile'][0].path.split('/uploads/')[1]);
                    cb("",[], cbresult);
                }else{
                    extUploader((ext)=>{
                        console.log([upl, ext]); cb(upl, ext, cbresult);
                    });
                }
            });
        }else{
            extUploader((ext)=>{
                console.log([upl, ext]); cb(upl, ext, cbresult);
            });
        }
    });
}

router.post('/', fileProcess.uploadFile, (req, res) => {
    if(!req.AccPermission){
        res.send({Msg:"Permission Denied"});
        return;
    }else{
        console.log(`Permitted User ${req.session.stu_id} trying to upload`);
        AWSUploader(req, (upl,ext, cbres)=>{
            if(cbres!="Done"){res.send({Msg:cbres}); console.log("Upload Failed"); return;}
            db.addResearch(req.body, req.session.stu_id, upl, ext.join("|"), (result)=>{
                res.send(result);
                return;
            });
        });
    }
});

router.post('/edit', fileProcess.uploadFile, (req, res) => {
    if(!req.AccPermission){
        res.send({Msg:"Permission Denied"});
        return;
    }else{
        console.log(`Permitted User ${req.session.stu_id} trying to edit`);
        AWSUploader(req, (upl, ext,cbres)=>{
            if(cbres!="Done"){res.send({Msg:cbres}); console.log("Edit failed");return;}
            db.editResearch(req.body, req.session.stu_id, upl, ext.join("|"), (result)=>{
                res.send(result);
                return;
            });
        })
    }
});

module.exports = router
