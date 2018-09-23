(function($){
    function checkEditForm(eF, cb){
        var nessName = [/title/, /subject/, /type/, /year/, /researcher_name\[\d\]/, /researcher_email\[\d\]/,/advisor1\[name\]/,/research_id/];
        var typeCheckName = [/year/, /advisor\d\[email\]/, /researcher_email\[\d\]/, /uploadFile/]
        var validInputChecker={
            "year" : [(val)=>{return (""+Number.parseInt(val)===val);}, "Year must be number"],
            "advisor\\d\\[email\\]" : [(val)=>{return val.match(/.+.*@.+.*\.+.*/);}, "Invalid Email"],
            "researcher_email\\[\\d\\]" : [(val)=>{return val.match(/.+.*@.+.*\.+.*/);}, "Invalid Email"],
            "uploadFile" : [(val)=>{return val.slice(-3)=="pdf";}, "File must be in PDF"]
        };
        var reccName = [/advisor1\[.*\]/, /abstract/];
        var res = true;
        var inputs = eF.getElementsByClassName("form-control mr-sm-2");
        for(var i=0; i<inputs.length; i++){
            if(Array.from(inputs[i].parentNode.getElementsByTagName("a")).some((element)=>{return element.name == inputs[i].name+"Alert"})){
                var a = Array.from(inputs[i].parentNode.getElementsByTagName("a")).find((element)=>{return element.name == inputs[i].name+"Alert"});
            }else{
                var a = document.createElement("a");
                a.setAttribute('name',inputs[i].name+"Alert");
                inputs[i].after(a);
            }
            if(inputs[i].value==""){
                if(nessName.some((name)=>{return inputs[i].name.match(name);})){
                    res = false;
                    inputs[i].classList.add("InputAlertDanger");
                    a.setAttribute('data-tip',TDWords['This field is necessary!']);
                    inputs[i].scrollIntoView({ block: 'end',  behavior: 'smooth' });
                }
                if(inputs[i].name == "research_id"){
                    alert("Something went wrong. Please refresh.");
                }
            }
            else if(typeCheckName.some((name)=>{return inputs[i].name.match(name);})){
                var inputName = typeCheckName.find((name)=>{return inputs[i].name.match(name);}).toString().slice(1,-1);
                if(!(validInputChecker[inputName][0](inputs[i].value))){
                    res = false;
                    inputs[i].classList.add("InputAlertDanger");
                    a.setAttribute('data-tip',TDWords[validInputChecker[inputName][1]]);
                    inputs[i].scrollIntoView({ block: 'end',  behavior: 'smooth' });
                }
                else{ fieldNice(inputs[i], a); }
            }
            else{ fieldNice(inputs[i], a); }
        }
        if(!res){
            for(var i=0; i<inputs.length; i++){
                if(Array.from(inputs[i].parentNode.getElementsByTagName("a")).some((element)=>{return element.name == inputs[i].name+"Alert"})){
                    var a = Array.from(inputs[i].parentNode.getElementsByTagName("a")).find((element)=>{return element.name == inputs[i].name+"Alert"});
                }else{
                    var a = document.createElement("a");
                    a.setAttribute('name',inputs[i].name+"Alert");
                    inputs[i].after(a);
                }
                if(inputs[i].value=="" && !Array.from(inputs[i].classList).includes("InputAlertDanger") && reccName.some((name)=>{return inputs[i].name.match(name);})){
                    inputs[i].classList.add("InputAlertWarning");
                    a.setAttribute('data-tip', TDWords['This field is not required but is recommended']);
                }
            }
        }
        function fieldNice(input, a){
            input.classList.remove("InputAlertDanger");
            input.classList.remove("InputAlertWarning");
            a.parentNode.removeChild(a);
        }
        cb(res);
    }

    function sendEditForm(eF){
        eF.getElementsByTagName("button")[0].setAttribute('disabled','True');
        var formData = new FormData(eF);
        $.ajax({
            url: "/upload/edit",
            data: formData,
            processData: false,
            contentType: false,
            type: 'POST',
            success: function(res) {
                console.log(res);
                alert(res.Msg);
                eF.getElementsByTagName("button")[0].removeAttribute('disabled');
                if(res.Msg=="Success"){ eF.reset(); document.location.replace("/info?id="+res.rId);}
                return true;
            }
        });
        return false;
    }

    var eF = document.getElementById("editForm");
    $(eF).submit(function(event) {
        event.stopPropagation();
        event.preventDefault();

        checkEditForm(eF, (res)=>{
            console.log(res);
            if(res) return sendEditForm(eF);
            else return res; // = false
        })
    });

    function fillInfo(research){
        var researcher_name = [];
        var researcher_email = [];
        var tmp = research.researcher.split(";");
        var rN = tmp.length;
        tmp.forEach((info)=>{
            info = info.trim();
            researcher_name[researcher_name.length] = info.split("(")[0] || "";
            researcher_email[researcher_email.length] = info.substr(0,info.length-1).split("(")[1] || "";
        });
        for(var i=0;i<rN-1;i++){
            addResearcherField();
        }

        var inputs = eF.getElementsByClassName("form-control mr-sm-2");

        if(research=="") return;
        inputs[0].value = research.title;
        var subOpts = inputs[1].getElementsByTagName("option");
        for(var i=0;i<subOpts.length;i++){
            if(subOpts[i].text==research.subject){
                subOpts[i].setAttribute("selected","true");
            }
            else{ subOpts[i].removeAttribute("selected"); }
        }
        var typeOpts = inputs[2].getElementsByTagName("option");
        for(var i=0;i<typeOpts.length;i++){
            if(typeOpts[i].text==research.type){
                typeOpts[i].setAttribute("selected","true");
            }
            else{ typeOpts[i].removeAttribute("selected"); }
        }
        inputs[3].value = research.year;
        for(var i=0;i<rN;i++){
            inputs[4+2*i].value = researcher_name[i];
            inputs[4+2*i+1].value = researcher_email[i];
        }
        inputs[4+2*rN].value = research.advisor1.name || "";
        inputs[4+2*rN+1].value = research.advisor1.institute || "";
        inputs[4+2*rN+2].value = research.advisor1.email || "";
        inputs[4+2*rN+3].value = research.advisor2.name || "";
        inputs[4+2*rN+4].value = research.advisor2.institute || "";
        inputs[4+2*rN+5].value = research.advisor2.email || "";
        inputs[4+2*rN+6].value = research.abstract || "";
        inputs[4+2*rN+7].parentNode.getElementsByClassName("inputInfo")[0].innerHTML=
            TDWords["Paper"]+" : "+research.filePath.split("/").pop()+" |&nbsp;" + TDWords["Upload new file to change this file"];

        inputs[4+2*rN+9].value = location.search.split("=")[1];

        var extrafiles = research.extraFiles.split(',');
        console.log(extrafiles);
        var FAD = document.getElementById("FileAttachDiv");
        var fadData =
            '<div class="horzExLong inputField nomargin">'
            +(extrafiles == extrafiles.map(a=>"") ? "" :
                '<p class="inputInfo">'+TDWords['Select files to keep']+'</p>')
            +   '<label hidden class="cbLabel"><input type="checkbox" name="extraFilesCB" value=""></label>';
        for(var i=0;i<extrafiles.length;i++){
            if(extrafiles[i]!=""){
                fadData += '<label class="cbLabel"><input checked type="checkbox" name="extraFilesCB" value="'+extrafiles[i]+'"> '+extrafiles[i].split("/").pop()+'</label>'
            }
        }
        FAD.innerHTML+=(fadData+'</div>');
    }
    var researchAttr = ['research_id', 'title', 'subject', 'year', 'type', 'abstract', 'researcher',
                                    'advisor1', 'advisor2', 'filePath', 'extraFiles', 'hidden'];

    var TNWords = ["Paper", "Upload new file to change this file","This field is necessary!","Year must be number", "Invalid Email", "File must be in PDF","This field is not required but is recommended","Select files to keep"];
    var TDWords = {};
    $.get("/i18n/words"+"?words="+TNWords.join("|"),(data)=>{
        TDWords = data;
        $.get("/info/getInfo"+document.location.search, fillInfo);
    })
})(jQuery);
