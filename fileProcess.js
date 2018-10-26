'use strict'

const db = require("./db");

var multer = require('multer'); // express에 multer모듈 적용 (for 파일업로드)
var fs = require('fs');
var mkdirp = require('mkdirp');
const aws = require('aws-sdk');
const s3 = new aws.S3();
const S3_BUCKET = process.env.S3_BUCKET_NAME;
aws.config.region = 'ap-northeast-2';

var fileProcess = this;

function timestamp(callback){
    var date = new Date();
    callback(("0"+date.getFullYear()).slice(-2)+("0"+(date.getMonth()+1)).slice(-2)
        +("0"+(date.getDate())).slice(-2)+("0"+(date.getHours())).slice(-2)
        +("0"+(date.getMinutes())).slice(-2)+("0"+date.getSeconds()).slice(-2));
}

// AWS
module.exports.AWSUpload = function(rId, filePath, cb){
    var params = {
        Bucket: S3_BUCKET,
        Body : fs.createReadStream(filePath),
        Key : filePath.split("/")[-2]+"/"+filePath.split("/")[-1],
        acl: 'private',
        serverSideEncryption: 'AES256'
    };

    // callback check

    s3.upload(params, function (err, data) {
        //handle error
        if (err) {
            console.log("Error", err);
            cb("");
        }

        //success
        if (data) {
            console.log("Uploaded in:", data.Location);
            cb(data.Location);
        }
    });
}
//

module.exports.timestamp = timestamp;

module.exports.deleteFile = function(path){
    try{
        fs.unlinkSync(path);
    }catch(e){
        console.log(e);
    }
}

module.exports.deleteEmptyFolderRecursive = function(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function(file, index){
            var curPath = path + '/' + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                fileProcess.deleteFolderIfSpecificOneLeft(curPath,"sentence.txt");
                fileProcess.deleteEmptyFolderRecursive(curPath);
            }
        });
        if(fs.readdirSync(path).length==0){
            fs.rmdirSync(path);
        }
    }
};

module.exports.deleteFolderIfSpecificOneLeft = function(path, fName){
    if (fs.existsSync(path)) {
        if(fs.readdirSync(path).length==1){
            if(fs.readdirSync(path)[0]+"" === fName){
                fs.unlinkSync(path+'/'+fName);
                fs.rmdirSync(path);
            }
        }
    }
}

module.exports.uploadFile = function(req, res, next){
    if(req.session.login){
        req.AccPermission = true;
        fileProcess.timestamp((timestamp)=>{
            var strg =
                multer.diskStorage({
                    destination: function (req, file, cb) {
                        mkdirp( '/app/uploads/'+timestamp);
                        console.log("FPUF : "+'/app/uploads/'+timestamp+"/"+file.originalname);
                        cb(null, '/app/uploads/'+timestamp+'/');
                    },
                    filename: function (req, file, cb) {
                        cb(null, file.originalname)
                    }
                });
            multer({storage:strg}).fields([{name:'uploadFile', maxCount: 1}, {name:'extraFiles'}])(req, res, next)
        })
    }else{
        req.AccPermission = false;
        next();
    }
}
