'use strict'

const express = require('express')
let router = express.Router()
const db = require('../db');

const i18n = require('../i18n');
router.use(i18n.translate);

router.get('/', (req, res) => {
    res.render('info',{i18n:res, gtag_id:process.env.gtag_id});
})

router.get('/getInfo', (req, res) => {
    db.getInfo(req, req.query.id, (research)=>{
        if(research!=""){
            research['perm'] = db.checkPermission(req.session, (research.researcher||"").match(/(\d{2}-\d{3})/g));
            research['admin'] = db.checkPermission(req.session, "");
        }
        res.send(research);
    });
});

router.post('/getAll',(req, res)=>{
    db.getAll(req, (researches)=>{
        res.send(researches);
    })
})

router.post('/changeState',(req, res)=>{
    if(req.session.admin!='admin'){
        res.send("Permission Denied");
    }
    else{
        db.changeResearchState(req.session, req.body.id, req.body.hidden, (result)=>{
            res.send(result);
        });
    }
})

router.get('/delete',(req, res)=>{
    var rsch;
    db.getInfo(req, req.query.research_id, (research)=>{
        del(research||{researcher:""},"research_table");
    })
    function del(research,table){
        if(!db.checkPermission(req.session, "")){
            res.send("Permission Denied");
        }else{
            db.deleteById(req.query, "", (status)=>{
                res.send(status);
            });
        }
    }
})

module.exports = router;
