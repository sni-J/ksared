var i18n = require('i18n');

i18n.configure({
    // where to store json files - defaults to './locales' relative to modules directory
    directory: __dirname + '/locales',
    defaultLocale: 'en',
});

module.exports.extractLocale = function(req){
    // console.log(req);
    var accLang = req.headers['accept-language']||req.headers['Accept-Language'];
    var langList = accLang.split(",");
    var suppLangList = i18n.getLocales();
    for(var i=0;i<langList.length;i++){
        if(suppLangList.includes(langList[i].split(';')[0])){
            return langList[i].split(';')[0];
        }
    }
    return 'en';
}

module.exports.translate = function(req, res, next) {
    i18n.init(req, res);
    res.locals.__ = res.__;

    var current_locale = i18n.getLocale();

    return next();
};

module.exports.__ = function(word){
    i18n.setLocale(word.locale||"en");
    return i18n.__(word.phrase);
}
