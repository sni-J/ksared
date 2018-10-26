'use strict'

const express = require('express')
const db = require('../db');
const fileProcess = require('../fileProcess');
const fs = require('fs');

let router = express.Router()
var extractedText="";

const multer = require('multer');
const mkdirp = require('mkdirp');

router.post('/', fileProcess.uploadFile, (req, res) => {
    if(!req.AccPermission){
        res.send({Msg:"Permission Denied"});
        return;
    }else{
        console.log(`Permitted User ${req.session.stu_id} trying to upload`);
        extractText('/app/uploads/'+req.files['uploadFile'][0].path.split('/uploads/')[1], (result)=>{
            if (!result){
                res.send("Extracting Text Failed");
                fileProcess.deleteFile(req.files['uploadFile'][0].path);
                console.log("Failed, so removed file "+'/app/uploads/'+req.files['uploadFile'][0].path.split('/uploads/')[1]);
            }
            else{
                AWSUploader(req, (upl,ext)=>{
                    db.addResearch(req.body, upl, ext.join("|"), (result)=>{
                        res.send(result);
                    });
                })
                // if(req.files["extraFiles"]==undefined){
                //     db.addResearch(req.body, '/app/uploads/'+req.files['uploadFile'][0].path.split('/uploads/')[1], "", (result)=>{
                //         res.send(result);
                //     });
                // }else{
                //     db.addResearch(req.body, '/app/uploads/'+req.files['uploadFile'][0].path.split('/uploads/')[1], req.files["extraFiles"].map(a=>"/app/uploads/"+a.path.split("/uploads/")[1]).join("|"), (result)=>{
                //         res.send(result);
                //     });
                // }
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

    console.log(`Extracting Text from ${filepath.split('/').pop()}...`);
    pdfParser.loadPDF(filepath);
}

function AWSUploader(req, cb){
    console.log(req.files["uploadFile"].path);
    function uplUploader(callback){
        if(req.files["uploadFile"]==undefined){
            console.log("No uploadFile"); callback("");
        }else{
            fileProcess.AWSUpload(req.files["uploadFile"].path.split("/uploads/")[1],callback);
        }
    }
    function extUploader(callback){
        var extFilePaths= [];
        if(req.files["extraFiles"]==undefined){
            console.log("No extraFiles"); callback([]);
        }else{
            req.files["extraFiles"].map(a=>"/app/uploads/"+a.path.split("/uploads/")[1]).forEach(
                (filePath)=>{fileProcess.AWSUpload(filePath,(location)=>{
                    extFilePaths[extFilePaths.length] = location;
                });}
            );
            callback(extFilePaths);
        }
    }
    req.setTimeout(0);
    uplUploader((upl)=>{extUploader((ext)=>{console.log([upl, ext]); cb(upl, ext)})});
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
        AWSUploader(req, (upl, ext)=>{
            db.editResearch(req.body, upl, ext.join("|"), (result)=>{
                res.send(result);
                return;
            });
        })
        // if(req.files["uploadFile"]==undefined && req.files["extraFiles"]==undefined){
        //     db.editResearch(req.body, "", "", (result)=>{
        //         res.send(result);
        //         return;
        //     });
        // }else{
        //     if(req.files["uploadFile"]==undefined){
        //         db.editResearch(req.body, "", , (result)=>{
        //             res.send(result);
        //         });
        //     }else{
        //         extractText('/app/uploads/'+req.files['uploadFile'][0].path.split("/uploads/")[1], (result)=>{
        //             if (!result){
        //                 res.send("Extracting Text Failed");
        //                 fileProcess.deleteFile('/app/uploads/'+req.files['uploadFile'][0].path.split("/uploads/")[1]);
        //                 console.log("Failed, so removed folder "+'/app/uploads/'+req.files['uploadFile'][0].path.split("/uploads/")[1]);
        //             }
        //             else{
        //                 if(req.files["extraFiles"]==undefined){
        //                     db.editResearch(req.body, '/app/uploads/'+req.files['uploadFile'][0].path.split("/uploads/")[1], "", (result)=>{
        //                         res.send(result);
        //                     });
        //                 }else{
        //                     db.editResearch(req.body, '/app/uploads/'+req.files['uploadFile'][0].path.split("/uploads/")[1], req.files["extraFiles"].map(a=>"/app/uploads/"+a.path.split("/uploads/")[1]).join("|"), (result)=>{
        //                         res.send(result);
        //                     });
        //                 }
        //             }
        //         })
        //     }
        // }
    }
});

module.exports = router
