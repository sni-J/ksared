'use strict'

const fileProcess = require('./fileProcess');
const i18n = require('./i18n');
const db = this;
const {PythonShell} = require('python-shell');

let mysql = require('mysql');
var db_config = {
    host     : 'us-cdbr-iron-east-01.cleardb.net',
    user     : process.env.DB_user,
    password : process.env.DB_pw,
    database : process.env.DB_database
};

var pyOptions = {
    mode: 'text',
    pythonPath: '/usr/bin/python3',
    pythonOptions: ['-u'],
    scriptPath: './python',
    args: ['title', 'researcher', 'path_of_txt']
};

var connection;

function handleDisconnect() {
    connection = mysql.createConnection(db_config); // Recreate the connection, since
                                                    // the old one cannot be reused.

    connection.connect(function(err) {              // The server is either down
        if(err) {                                   // or restarting (takes a while sometimes).
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
        }else{                                  // to avoid a hot loop, and to allow our node script to
            console.log("DB connected");
        }
    });                                     // process asynchronous requests in the meantime.
    // If you're also serving http, display a 503 error.
    connection.on('error', function(err) {
        console.log('db error '+(new Date()).toString() , err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            console.log("ReConnecting to database..")
            handleDisconnect();                         // lost due to either server restart, or a
        } else {                                      // connnection idle timeout (the wait_timeout
            throw err;                                   // server variable configures this)
        }
    });
}

handleDisconnect();

function escapeRS(string) {
  return string.toString().replace(/[;'"&^!@#%+-.*+?^${}()|\[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function pstringify(data, type, callback){
    switch(type){
        case "keyword":
            callback(data.keyword);
            break;
        case "advisor":
            if(data.name==""){
                callback("");
                break;
            }
            callback(
                "Advisor : "+data.name
                +(data.institute=="" ? "" : "("+data.institute+")")
            );
            break;
    }
}

function AutoSQLQueryR(columns, table_name, type, wordList, divider, callback){
    connection.query('select '+columns.shift().toString()+' from '+table_name.shift()+";", function(error, results, fields){
        if (error) console.log(error);
        var typenow = type.shift();
        for(var i=0;i<results.length;i++){
            pstringify(results[i], typenow, (pstring)=>{
                if(pstring!="")
                    wordList[wordList.length] = pstring;
            });
        }
        if(!(divider==="")) wordList[wordList.length]="<hr>";
        // console.log(wordList);
        if (columns.length!=0) AutoSQLQueryR(columns, table_name, type, wordList, divider, (wL)=>{callback(wL);});
        else callback(wordList);
    });
}

module.exports.getSearchAutoComplete = function(cb){
    var columns = [["keyword"],["name","institute"]];
    var table_name = ["keyword_table","advisor_table"];
    var type = ["keyword", "advisor"]
    var wordList=[];
    var divider = "<hr>"
    AutoSQLQueryR(columns, table_name, type, wordList, divider, (wL)=>{
        cb(wL);
    });
}

function createAdvList(data, idx, adv, emailB, formed, cb){
    var res = data[idx];
    connection.query("select * from advisor_table where advisor_id = "+res+";"
                            ,(err, result, fields)=>{
    if(err) throw err;
    if(result[0].name!=undefined){
        if(formed) {
            if(result[0].name!=""){
                adv[adv.length] =
                    result[0].name
                    + (result[0].institute == "" ? "" :
                        "(" + result[0].institute
                            + (emailB ? " ; " + result[0].email : "")
                        + ")"
                    );
            }
        }
        else adv[adv.length] = result[0];
    }else{ adv[adv.length]=""; }
    if(data.length-1==idx){cb(adv);}
    else{createAdvList(data, idx+1, adv, emailB, formed, (advv)=>{cb(advv);})}
    });
}

module.exports.searchWithInput = function(req, callback){
    var query = req.query;
    var sess = req.session;
    function searchWordAnalysis(searchWord, cb){
        var keywordList=[];
        var advList = [];
        if(searchWord.toString() === ""){cb("",keywordList, advList);}
        else{
            var wL = searchWord.split(",");
            var keyword = "";
            var advisor = "";
            for(var i=0;i<wL.length;i++){
                var ana = wL[i].split(" : ");
                if(ana.length==1){
                    if(ana[0].trim()!=""){
                        if(!keywordList.includes(ana[0].trim())){
                            keyword += "|"+ana[0].trim().split('').map((a)=>{return (a.toLowerCase()!=a.toUpperCase()?a:'\\'+a);}).join('');
                            keywordList[keywordList.length]=ana[0].trim();
                        }
                    }
                }
                else{
                  if(ana[0].trim() == "Advisor"){
                    advisor += ",('"+ana[1].split("(")[0].trim()+"','"+ana[1].substr(0,ana[1].length-1).split('(')[1].trim()+"')";
                    advList[advList.length]=[ana[1].split("(")[0].trim(),ana[1].substr(0,ana[1].length-1).split('(')[1].trim()];
                  }
                }
            }
            cb(
                (keyword.length==0 ? "" :
                    `
                     and (research_id in
                        (select research_id from research_keyword_table where keyword_id in
                            (select keyword_id from keyword_table`
                                + (keyword.substr(1)==""?
                                "":" where keyword_table.keyword regexp '" + escapeRS(keyword.substr(1)) + "'") +
                            `)
                        )`+
                    (keyword.substr(1)==""?
                    "":`
                        or
                        (
                            (research_table.title like '%`+escapeRS(keyword.substr(1)).split("|").join("%') or (research_table.title like '%")+"%')"+
                        ")"
                    )+
                    ")"
                )
                +
                (advisor.length==0 ? "" :
                ` and
                (research_table.advisor1_id in
                    (select advisor_id from advisor_table
                        where (name,institute) in (`
                            +escapeRS(advisor.substr(1))
                        +")"
                    +")"
                +` or
                research_table.advisor2_id in
                    (select advisor_id from advisor_table
                        where (name,institute) in (`
                            +escapeRS(advisor.substr(1))
                        +")"
                    +")"
                +")"
            )
            , keywordList, advList);
        }
    }
    function buildquery(swa, cb){
        cb(`select research_table.*
            from research_table
            where `
            + query.sYear + "<=research_table.year and "
            + query.eYear + ">=research_table.year"
            + (query.subject.toString()==="" ? "" : " and research_table.subject = '"+query.subject+"'")
            + (query.type.toString()==="" ? "" : " and research_table.type = '"+query.type+"'")
            + swa
            + ";"
        );
    }
    function listify(data, adv, cb){
        var reqLocale = i18n.extractLocale(req);
        for(var i=0;i<data.length;i++){
            var htmlData ="<ul class='searchResultUl'>";
            // console.log(req);
            for(var i=0;i<data.length;i++){
                if(data[i][0].hidden=="no"||db.checkPermission(sess, data[i][0].researcher.match(/\d{2}-\d{3}/g))){
                    htmlData
                    += `<li class='searchResultLi' onclick='window.open("/info?id=`+data[i][0].research_id+`")'>
                            <h6>`
                                + data[i][0].title
                            +`</h6>
                            <span>`
                                +i18n.__({phrase:'Researcher', locale: reqLocale})+" : "+data[i][0].researcher.replace(/\s*\(.*?\)\s*/g, '')
                                +" | "+i18n.__({phrase:'Advisor', locale: reqLocale})+" : "+adv[i].join(", ")
                                +" | "+data[i][0].subject.split(" ").map(a=>i18n.__({phrase:a, locale: reqLocale})).join(" ")
                                +" | "+data[i][0].year
                                +" | "+data[i][0].type.split(" ").map(a=>i18n.__({phrase:a, locale: reqLocale})).join(" ")
                                +" | "+data[i][1]
                            +`</span>
                        </li>`
                    ;
                }
            }
            htmlData+="</ul>"
            cb(htmlData);
        }
    }
    function collectAdvList(results, idx, adv, cb){
        var res = results[idx][0];
        createAdvList([res.advisor1_id, res.advisor2_id], 0, [], false, true, (advv) =>{
            adv[adv.length]=advv;
            if(idx==results.length-1) cb(adv);
            else collectAdvList(results, idx+1, adv, (advv)=>{cb(advv);});
        });
    }
    function SortInOrder(results, i, sortList, keywordList, advList, cb){
        function kwRelativity(i, cb){
            var relativity = 0;
            connection.query(
                "select research_keyword_table.keyword_weight, keyword_table.keyword"
                +" from research_keyword_table, keyword_table"
                +" where research_keyword_table.research_id = "+results[i].research_id
                +" and keyword_table.keyword_id=research_keyword_table.keyword_id"
                , (err, res, fi)=>{
                    if(err) throw error;
                    // console.log(res);
                    for(var j=0;j<res.length;j++){
                        for(var k=0;k<keywordList.length;k++){
                            if(res[j].keyword.toLowerCase().indexOf(keywordList[k].toLowerCase())>-1){
                                relativity += res[j].keyword_weight/(res[j].keyword.length)*keywordList[k].length;
                            }
                        }
                    }
                    cb(relativity);
                }
            );
        }
        function advRelativity(i, cb){
            var relativity=0;
            createAdvList([results[i].advisor1_id, results[i].advisor2_id],0,[],false, true, (advv)=>{
                for(var l=0;l<advList.length;l++){
                    relativity += (advv.indexOf(advList[l][0]+"("+advList[l][1]+")")>-1 ?
                                    10000 : 0);
                }
                cb(relativity);
            });
        }
        function titRelativity(i, cb){
            var relativity=0;
            for(var j=0;j<keywordList.length;j++){
                relativity += (results[i].title.includes(keywordList[j]) ? keywordList[j].length : 0);
            }
            cb(relativity/results[i].title.length*100000);
        }
        var relativity = 0;
        advRelativity(i, (advRel)=>{
            relativity += advRel;
            kwRelativity(i, (kwRel)=>{
                relativity += kwRel;
                titRelativity(i, (titRel)=>{
                    relativity += titRel;
                    sortList[sortList.length] = [results[i], relativity];
                    if(i == results.length-1){
                        // console.log(sortList);
                        sortList.sort(function(a, b){
                            return b[1]-a[1];
                        });
                        // console.log(sortList);
                        cb(sortList);
                    }else{
                        SortInOrder(results, i+1, sortList, keywordList, advList,(sortList)=>{cb(sortList);})
                    }
                })
            })
        })
    }
    searchWordAnalysis(query.searchWord, (swa, keywordList, advList)=>{
        buildquery(swa, (queryStr)=>{
            // console.log(queryStr);
            connection.query(queryStr, (error, results, fields) => {
                if (error) throw error;
                var adv = [];
                if (results.length==0){
                    callback(
                        `<ul class='searchResultUl'>
                            <li class='searchResultLi'>
                                <h6> No Such Data </h6>
                            </li>
                        </ul>`);
                }
                else{
                    SortInOrder(results,0,[], keywordList, advList, (sortList)=>{
                        collectAdvList(sortList, 0, adv, (advv)=>{
                            listify(sortList, advv, (htmlData)=>{
                                callback(htmlData);
                            });
                        });
                    });
                }
            });
        });
    });
}

function getKeyword(req, fP, cb){
    console.log(req.oldfP, fP);
    if(req.oldfP!=fP){
        var fPsplited=fP.split("/");
        var txtP = "/app/uploads/"+fPsplited[fPsplited.length-2]+"/"+fPsplited[fPsplited.length-1].slice(0,-4)+".txt";
        console.log(txtP);
        pyOptions.args = [req.researcher_name, req.title, txtP]; // if fP => AWS then Pass
        var keywords = [];
        PythonShell.run('Keyword.py', pyOptions, function (err, results) {
            if (err || !results){ console.log(err); console.log(results); cb("Keyword Extract Error"); return; }
            // results is an array consisting of messages collected during execution
            results.forEach((keyset)=>{
                // var keyset = retVal.substr(1,retVal.length-1);
                keywords[keywords.length]={"keyword":keyset.split(":")[0],"keyword_weight":keyset.split(":")[1]};
            });
            console.log(keywords);
            cb(keywords);
        });
    }else{
        function keywordFormat(KW_ID_weight,formatted,callback){
            if(KW_ID_weight.length==0){ callback(formatted); return; }
            var KW = KW_ID_weight.pop();
            connection.query("select keyword from keyword_table where keyword_id="+KW.keyword_id,(e, keyword, f)=>{
                formatted[formatted.length] = {"keyword":keyword[0], "keyword_weight":KW.keyword_weight};
                keywordFormat(KW_ID_weight,formatted,cb);
            });
        }
        // find original research with researchId and return keyword in format
        connection.query("select keyword_id, keyword_weight from research_keyword_table where research_id="+req.research_id, (e, KW_ID_weight, f)=>{
            keywordFormat(KW_ID_weight, [], (formatted)=>{
                console.log(formatted);
                cb(formatted);
            })
        });
    }
}
function queryId(pp, table, attL, cb){
    var qs= "select * from "+table+" where 1=1";
    attL.forEach((att)=>{qs+=" and "+att+"='"+pp[att]+"'";});
    var qe=";"
    connection.query(qs+qe, (error, result, fields)=>{
                            if(error) throw error;
                            cb(result, pp);
                        }
    );
}
function getIdFromTable(ppL, idx, idL, table, attL, objId, cb){
    var pp = ppL[idx];
    queryId(pp, table, attL, (result, pp)=>{
        if(result.length==0){
            var q = `insert into ${table}(${attL.join(",")}) values('${attL.map((att)=>{return pp[att]}).join("','")}');`;
            console.log(q);
            connection.query(q, (err, res, fields)=>{
                                    if (err) throw err;
                                    queryId(pp, table, attL, (result, ppv)=>{
                                        idL[idL.length] = result[result.length-1][objId];
                                        if(idx==ppL.length-1){cb(idL);}
                                        else{getIdFromTable(ppL, idx+1, idL, table, attL, objId, (idLL)=>{cb(idLL);})};
                                    });
                                }
            );
        }else{
            queryId(pp, table, attL, (result, ppv)=>{
                idL[idL.length] = result[result.length-1][objId];
                if(idx==ppL.length-1){cb(idL);}
                else{getIdFromTable(ppL, idx+1, idL, table, attL, objId, (idLL)=>{cb(idLL);})};
            });
        }
    });
}

module.exports.addResearch = function(req, fP, extraFilePaths, callback){ // 필드 값이 sql문이 아닌지 체크해볼 필요가 있을 것 같 + R&E와 졸업 연구 이외의 항목에 대해 학회명 기재가 필요해보임 Else(한국데이터처리학회) 등으로 적으면 되지 않을까 싶은데
    try{
        getKeyword(req, fP, (keywords)=>{
            getIdFromTable(keywords, 0, [], "keyword_table", ["keyword"], "keyword_id", (IdList)=>{
                var keywordIdList = IdList;
                getIdFromTable([req.advisor1, req.advisor2], 0, [], "advisor_table", ["name","institute","email"], "advisor_id", (IdList)=>{
                    var advisorIdList = IdList;
                    var researcher = "";
                    for(var i=0;i<req.researcher_name.length;i++){
                        var name = req.researcher_name[i].trim();
                        var email = req.researcher_email[i].trim();
                        researcher +=   (name=="" && email==""?"":"; "
                                        +(name==""? "":name)
                                        +(email==""? "":" ("+email+")"));
                    }
                    var researchAttr = ['title', 'subject', 'year', 'type', 'abstract', 'researcher', 'advisor1_id', 'advisor2_id', 'filePath', 'extraFiles', 'hidden'];
                    var researchVal = [req.title, req.subject, req.year, req.type, req.abstract, researcher.substr(2), advisorIdList[0], advisorIdList[1], fP, extraFilePaths, req.hidden||'yes'];
                    console.log(
                        `insert into research_table(title, subject, year, type, abstract, researcher,
                            advisor1_id, advisor2_id, filePath, extraFiles, hidden) values(`+researchVal.map((a)=>{return connection.escape(a)}).join(",")+");"
                    );
                    connection.query(
                            `insert into research_table(title, subject, year, type, abstract, researcher,
                                 advisor1_id, advisor2_id, filePath, extraFiles, hidden) values(`+researchVal.map((a)=>{return connection.escape(a)}).join(",")+");"
                                 ,(err, results, fields)=>{
                        var research = {};
                        for(var i=0;i<researchAttr.length;i++){
                            research[researchAttr[i]] = researchVal[i];
                        }
                        if(err) throw err;
                        getIdFromTable([research], 0, [], "research_table", researchAttr, "research_id", (IdList)=>{
                            for(var i=0;i<keywordIdList.length;i++){
                                var keywordId = keywordIdList[i];
                                connection.query("insert into research_keyword_table (research_id, keyword_id, keyword_weight) values("+[IdList[0],keywordId,1*keywords[i].keyword_weight].map((a)=>{return connection.escape(a)}).join(',')+");",
                                                (err,result, fields)=>{if(err) return err;});
                            }
                            callback({"rId" : IdList[IdList.length-1], "Msg" : "Success"});
                        });
                    });
                });
            });
        });
    }catch(e){
        console.log(e);
        callback({"rId" : -1, "Msg" : "Failed"});
    }
}

module.exports.getInfo = function(req, id, cb){
    connection.query(`select * from research_table where research_id='`+escapeRS(id)+"';",(err, rres, fields)=>{
        if(err){console.log(err); cb(""); return;}
        if(rres.length==0){cb(""); return;}
        var r = rres[0];
        var ad=[];
        createAdvList([r.advisor1_id, r.advisor2_id], 0, ad, true, false, (advv)=>{
            var researchAttr = ['research_id', 'title', 'subject', 'year', 'type', 'abstract', 'researcher', 'advisor1', 'advisor2', 'filePath', 'extraFiles', 'hidden'];
            var researchVal = [r.research_id, r.title, r.subject.split(" ").map(a=>i18n.__({phrase:a, locale:req.locale})).join(" "),
                                r.year, r.type.split(" ").map(a=>i18n.__({phrase:a, locale:req.locale})).join(" "),
                                 r.abstract, r.researcher, advv[0],advv[1], r.filePath, r.extraFiles, r.hidden];
            var research = {};
            for(var i=0;i<researchAttr.length;i++){
                research[researchAttr[i]] = researchVal[i];
            }
            if(r.hidden=="no"||db.checkPermission(req.session, r.researcher.match(/(\d{2}-\d{3})/g))){
                cb(research);
            }else {
                cb("");
            }
        });
    })
}

module.exports.getAll = function(req, cb){
    function getFromResearchTable(researches, c){
        connection.query("select * from research_table",(err, rres1, fields)=>{
            if(rres1.length==0){c(researches);return;}
            researches=rres1;
            var idx=0;
            function callback(researches, idx) {
                db.getInfo(req, rres1[idx].research_id,
                    (research)=>{
                        researches[idx]= research;
                        if(idx==rres1.length-1){ c(researches); return;}
                        else{ callback(researches, idx+1); }
                    }
                );
            }
            callback(researches, 0);
        })
    }
    if(req.session.admin!='admin'){cb(["Permission Denied"]); return;}
    getFromResearchTable([],(r)=>{
        cb(r);
    });
}

module.exports.deleteById = function(q, ignoreFile, callback){
    if(typeof(q.id)=="string" && q.id.includes("1=1")){callback("ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ 어딜 넘보냐 가서 발닦고 잠이나 자"); return;}
    if(!(""+Number.parseInt(q.id)===q.id)){callback("Uh-Oh You Should not do this"); return;}
    function deleteInResearchTable(q, status, cb){
        connection.query("delete from research_table where research_id="+escapeRS(q.id)+";", (err, res, fi)=>{
            var st = "| research_table : Success |";
            if(err){
                st += "| research_table : Failed |";
                console.log(table+" "+err);
                cb(status+st);
                return;
            }
            connection.query("delete from keyword_table where keyword_id not in (select keyword_id from research_keyword_table);"
                            ,(err,res, fi)=>{
                if(err){
                    st += "| keyword_table : Failed |";
                    console.log("keyword_table "+err);
                    cb(status+st);
                    return;
                }
                connection.query(`delete from advisor_table where advisor_id not in
                                    (   select advisor1_id as 'advisor_id' from research_table
                                        union
                                        select advisor2_id as 'advisor_id' from research_table
                                    );`
                                ,(err,res, fi)=>{
                    if(err){
                        st += "| advisor_table : Failed |";
                        console.log("advisor_table "+err);
                        cb(status+st);
                        return;
                    }
                    cb(status+st);
                });
            });
        });
    }
    function deleteFiles(q, status, cb){
        connection.query("select filePath, extraFiles from research_table where research_id="+escapeRS(q.id)+";",(err, result, fi)=>{
            var st="| getting filePath, extraFiles : Success |"
            if(err){
                st="| getting filePath, extraFiles : Failed |"
                console.log("getting filePath "+err);
                cb(status+st);
                return;
            }
            var paths = [result[0].filePath, result[0].filePath.slice(0,-3)+"txt"].concat(result[0].extraFiles.split('|'));
            if((""+ignoreFile).includes(result[0].filePath)){ignoreFile+="|"+result[0].filePath.slice(0,-3)+"txt"};
            console.log("Paths : "+ paths);
            console.log("IgnoreFile : "+ignoreFile);
            paths.forEach((res)=>{
                if(!(""+ignoreFile).includes(res)){ fileProcess.deleteFile(res);}
            });
            fileProcess.clearUploads();
            deleteInResearchTable(q, status+st,(status)=>{cb(status);});
        });
    }
    function deleteInResearchKeywordTable(q, status, cb){
        connection.query("delete from research_keyword_table where research_id="+escapeRS(q.id)+";",(err, res, fi)=>{
            var st = "| research_keyword_table : Success |"
            if(err){
                st = "| research_keyword_table : Failed |"
                console.log(st);
                cb(status+st);
                return;
            }
            deleteFiles(q, status+st, (status)=>{cb(status);});
        });
    }
    connection.query("select research_id from research_table where research_id = "+escapeRS(q.id), (e, r, f)=>{
        if(r.length==0){
            callback("Success");
            console.log("Research "+q.id+" has already been deleted");
            return;
        }else{
            try{
                deleteInResearchKeywordTable(q, "", (status)=>{
                    console.log("DBID : "+ status);
                    callback(
                        (status.includes("Failed") ? "Failed" : "Success")
                    );
                });
            }catch(e){
                console.log("DBIDE : "+ e);
                callback("Failed");
            }
        }
    })
}

module.exports.editResearch = function(req, fP, extraFilePaths, callback){
    function change_id(q, research_id, ignoreFile){
        console.log("Trying to change id from "+q.id+" to "+research_id);
        if(q.id == research_id){callback({"rId":q.id, "Msg":"Success"}); console.log("Something Strange..."); return;}
        db.deleteById({"id" : research_id, "pw": "jolnon2018"}, ignoreFile, (status)=>{
            console.log("Delete by id done anyway");
            if(status.includes("Failed")){console.log(status);callback({"rId" : -1, "Msg" : "Fail to delete by id"}); return;}
            connection.query("update research_table set research_id = "+escapeRS(research_id)+" where research_id="+escapeRS(q.id)+";",(err, res, fi)=>{
                connection.query("update research_keyword_table set research_id = "+escapeRS(research_id)+" where research_id="+escapeRS(q.id)+";",(err, res, fi)=>{
                    if(err){console.log(err); callback({"rId" : -1, "Msg" : status+"| dump Research made |"}); return;}
                    callback({"rId" : research_id, "Msg" : "Success"});
                });
            });
        });
    }
    console.log("Hi editSearch!");
    if(req.extraFilesCB){
        if(typeof(req.extraFilesCB)=='string'){
            var keepedExtraFiles = "|"+req.extraFilesCB;
        }
        else{
            var keepedExtraFiles = "|"+req.extraFilesCB.join("|");
        }
    }
    else{var keepedExtraFiles = ""}
    connection.query("select filePath from research_table where research_id = "+ escapeRS(req.research_id)+";", (e, r, f)=>{
        if (e) throw e;
        req.oldfP = r[0].filePath;
        db.addResearch(req, (fP == "" ? req.oldfP : fP), extraFilePaths+keepedExtraFiles, (res)=>{
            console.log("Trying to add...");
            if(res.Msg!="Success"){console.log("failed"); callback({"rId" : -1, "Msg" : "Failed"}); return;}
            change_id({"id":res.rId}, req.research_id,  fP=="" || fP==req.oldfP ? extraFilePaths+keepedExtraFiles+"|"+req.oldfP : extraFilePaths+keepedExtraFiles);
        })
    })
}

module.exports.changeResearchState = function(sess, id, hidden, cb){
    connection.query(`update research_table set hidden='${escapeRS(hidden)}' where research_id=${escapeRS(id)}`,(e,r,f)=>{
        if(e){cb(e); console.log(e); return;}
        cb("Success");
    })
}

module.exports.checkPermission = function(sess, permList){
    if(sess.admin=='admin'){
        return true;
    }else if((permList||[]).includes(sess.stu_id)){
        return true;
    }else{
        return false;
    }
}

module.exports.login = function(req, cb){
    var body = req.body;
    connection.query("select * from account_table where stu_id='"+escapeRS(body.ID)+"' and password='"+escapeRS(body.PW)+"'",(e,r,f)=>{
        if(r.length==0){
            cb("failed");
        }else{
            cb(r);
        }
    })
}

module.exports.updateAccount = function(req, cb){
    var body = req.body;
    connection.query("select * from account_table where stu_id='"+escapeRS(body.ID)+"' and password='"+escapeRS(body.oldPW)+"'",(e,r,f)=>{
        if(r.length==0){
            cb("Failed");
        }else{
            connection.query("update account_table set password='"+escapeRS(body.newPW)+"' where stu_id='"+escapeRS(body.ID)+"'",(e,r,f)=>{
                if(e){
                    cb(e);
                }else{
                    cb("Success");
                }
            })
        }
    })
}

module.exports.resetPassword = function(q, cb){
    var stu_id = escapeRS(q.stu_id)
    connection.query(`select * from account_table where stu_id='${stu_id}';`, (e, r, f)=>{
        if(e){ cb(e); }
        else if(r.length==0){console.log(`Tried to reset password of ${stu_id} but cannot find it`); cb("Wrong ID!");}
        else{
            connection.query(`update account_table set password='${stu_id}' where stu_id='${stu_id}';`, (e, r, f)=>{
                if(e){ cb(e); }
                else{ console.log(`Reset Password of ${stu_id}`); cb("Done"); }
            })
        }
    })
}

module.exports.restoreAccounts = function(cb){
    connection.query(`select * from account_table where account_id!=1;`, (e, r, f)=>{
        if(e){ cb(e); }
        else{
            r.forEach((acc)=>{
                connection.query(`update account_table set password='${acc.stu_id}' where stu_id='${acc.stu_id}';`,(e, r, f)=>{
                    if(e){ cb(e); return;}
                    else{ console.log(`Reset Password of ${acc.stu_id}`);}
                })
            })
            cb("Done");
        }
    })
}
