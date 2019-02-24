'use strict'

const express = require('express')
let router = express.Router()
const db = require('../db');
const i18n = require('../i18n');

router.post('/login', (req, res) => {
    db.login(req,(r)=>{
        if(r=="failed"){
            res.send(
                `<script>
                    window.alert('${i18n.__({phrase:'Log-In', locale:(i18n.extractLocale(req)||"")})+" "+i18n.__({phrase:'Failed',locale:(i18n.extractLocale(req)||"")})}');
                    window.location.href='${req.query.redirect||"/main"}';
                </script>`
            );
            return;
        }else{
            var session = req.session;
            session.stu_id=r[0].stu_id;
            session.login=true;
            session.admin = r[0].admin;
            req.session.save(function(){
                res.redirect(req.query.redirect||"/main");
            })
        }
    });
})

router.get('/logout', (req, res) => {
    var session = req.session;
    session.stu_id="";
    session.login=false;
    session.admin="";
    // res.send(req.session);
    req.session.save(function(){
        res.redirect(req.query.redirect||"/main");
    })
})

router.get('/info', (req, res)=>{
    res.send({stu_id:req.session.stu_id, login: req.session.login, admin: req.session.admin});
    // res.send(req.session);
})

router.post('/update', (req, res)=>{
    db.updateAccount(req, (r)=>{
        res.send(
        `<script>
            alert('${r}');
            window.location.href="/main#manage";
        </script>`
        );
    });
})

router.post('/admin', (req, res)=>{
    if(req.session.admin){
        db.accountTableByAdmin((r)=>{
            res.send(r);
        })
    }
})

router.get('/resetPassword', (req, res)=>{
    if(req.session.admin){
        db.resetPassword(req.query, (r)=>{
            res.send(
                `<script>alert("${r}");window.location.href="/admin"</script>`
            );
        });
    }else{
        res.send(
            `<script>alert("${r}");window.location.href="/admin"</script>`);
    }
})

router.get('/restoreAccounts', (req, res)=>{
    if(req.session.admin && req.query.DevCode==process.env.DEVCODE){
        db.restoreAccounts((r)=>{
            res.send(`<script>alert("${r}");window.location.href="/admin"</script>`);
        });
    }else{
        res.send(`<script>alert("Permission Denied");window.location.href="/admin"</script>`);
    }
})

module.exports = router;
