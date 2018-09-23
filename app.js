const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const bodyParser = require('body-parser');
const cookieSession = require('express-session');

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use(cookieSession({
    name: 'session'
    , secret: 'KSARED'
    , cookie: {
        maxAge: 1000*60*60
        , httpOnly: false
    }
    , resave: false
    , saveUninitialized: true
}));

var serveIndex = require('serve-index')

app.use(express.static('public'));
app.use('/main', require('./routes/main'))
app.use('/admin', require('./routes/admin'))
app.use('/account', require('./routes/account'))
app.use('/info', require('./routes/info'))
app.use('/i18n', require('./routes/i18n'))
app.use('/edit', require('./routes/edit'))
app.use('/search', require('./routes/search'))
app.use('/upload', require('./routes/upload'))
app.use('/uploadFiles', express.static('uploads'),serveIndex('./uploads'))

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

app.get('/', function(req, res){
    res.redirect('/main')
});

app.listen(port, function(){
    console.log(`Server running on port ${port}`)
})

process.on('uncaughtException', (err) => {
    console.log((new Date()).toString() + err);
    var nodemailer = require('nodemailer');
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'wonjoonlee200316@gmail.com',
            pass: 'madebigbang'
        }
    });

    var mailOptions = {
        from: 'wonjoonlee200316@gmail.com',
        to: 'wjl0316@naver.com',
        subject: 'KSAReD Error Notice Email',
        text: (new Date()).toString() + err
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log("Email Error : "+error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
});

process.on('exit',(code)=>{
    console.log("Exited With " +code);
})
