(function($){
    function autocomplete(inp, arr) {
        /*the autocomplete function takes two arguments,
        the text field element and an array of possible autocompleted values:*/
        var currentFocus;
        /*execute a function when someone writes in the text field:*/
        inp.addEventListener("input", function(e) {
            searchMain();
            var a, b, i, val = this.value;
            var L = val.split(',');
            val = L[L.length-1].trim();
            var listedBs = [];
            /*close any already open lists of autocompleted values*/
            closeAllLists();
            if (!val) { return false;}
            currentFocus = -1;
            /*create a DIV element that will contain the items (values):*/
            a = document.createElement("DIV");
            a.setAttribute("id", this.id + "autocomplete-list");
            a.setAttribute("class", "autocomplete-items");
            /*append the DIV element as a child of the autocomplete container:*/
            this.parentNode.appendChild(a);
            /*for each item in the array...*/
            for (i = 0; i < arr.length; i++) {
                /*check if the item starts with the same letters as the text field value:*/
                var preset = arr[i].indexOf(" : ")+2+arr[i].substr(arr[i].indexOf(" : ")+2).toUpperCase().indexOf(val.toUpperCase());
                if (arr[i] == "<hr>"){
                    b = document.createElement("DIV");
                    b.innerHTML = "<hr>"
                    b.setAttribute("class", "autocomplete-divline");
                    b.setAttribute("disabled", "True");
                    listedBs[listedBs.length]=b;
                    a.appendChild(b);
                }else if (arr[i].substr(preset, val.length).toUpperCase() == val.toUpperCase()) {
                    /*create a DIV element for each matching element:*/
                    b = document.createElement("DIV");
                    /*make the matching letters bold:*/
                    var divPt = arr[i].indexOf(":")+1;
                    b.innerHTML = "<strong>" +  arr[i].substr(0, divPt) +"</strong>";
                    b.innerHTML += arr[i].substr(divPt, preset-divPt);
                    b.innerHTML += "<strong>" + arr[i].substr(preset, val.length) + "</strong>";
                    b.innerHTML += arr[i].substr(preset+val.length);
                    /*insert a input field that will hold the current array item's value:*/
                    b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
                    /*execute a function when someone clicks on the item value (DIV element):*/
                    b.addEventListener("click", function(e) {
                        /*insert the value for the autocomplete text field:*/
                        var inpValTmpLst = inp.value.split(",");
                        var inpVal = inp.value.substr(0,inp.value.length-inpValTmpLst[inpValTmpLst.length-1].length)
                        inp.value = inpVal+" "+this.getElementsByTagName("input")[0].value;
                        inp.value = inp.value.trim()+", ";
                        /*close the list of autocompleted values,
                        (or any other open lists of autocompleted values:*/
                        closeAllLists();
                    });
                    listedBs[listedBs.length]=b;
                    a.appendChild(b);
                }
            }
            if(listedBs!=[]){
                var idx=0;
                while(idx<listedBs.length){
                    if(inp.value.includes(listedBs[idx].textContent + ",")){
                        listedBs[idx].setAttribute('hidden','True');
                        a.removeChild(listedBs[idx]);
                        listedBs.splice(idx, 1);
                    }
                    else{idx++;}
                }
                for(i=listedBs.length-1;i>=0;i--){
                    if(listedBs[i].className!="autocomplete-divline"){
                        listedBs[i].setAttribute('style','border-bottom:1px solid #d4d4d4');
                        break;
                    }else{
                        listedBs[i].setAttribute('hidden','True');
                    }
                }
                for(i=0;i<listedBs.length;i++){
                    if(listedBs[i].className=="autocomplete-divline"){
                        listedBs[i].setAttribute('hidden','True');
                    }
                    else{
                        break;
                    }
                }
            }
        });
        /*execute a function presses a key on the keyboard:*/
        inp.addEventListener("keydown", function(e) {
            var x = document.getElementById(this.id + "autocomplete-list");
            if (x) x = x.getElementsByTagName("div");
            if (e.keyCode == 40) {
                /*If the arrow DOWN key is pressed,
                increase the currentFocus variable:*/
                currentFocus++;
                if(!(typeof(x[currentFocus])==='undefined')&&(x[currentFocus].getAttribute('disabled')=='True')){currentFocus++;}
                /*and and make the current item more visible:*/
                addActive(x);
            } else if (e.keyCode == 38) { //up
                /*If the arrow UP key is pressed,
                decrease the currentFocus variable:*/
                currentFocus--;
                if(!(typeof(x[currentFocus])==='undefined')&&(x[currentFocus].getAttribute('disabled')=='True')){currentFocus--;}
                /*and and make the current item more visible:*/
                addActive(x);
            } else if (e.keyCode == 13) {
                /*If the ENTER key is pressed, prevent the form from being submitted,*/
                e.preventDefault();
                if (currentFocus > -1) {
                    /*and simulate a click on the "active" item:*/
                    if (x) x[currentFocus].click();
                    currentFocus = -1;
                    searchMain();
                }else{
                    closeAllLists();
                    $(this).unbind('submit').submit();
                }
            }
        });
        function addActive(x) {
            /*a function to classify an item as "active":*/
            if (!x) return false;
            /*start by removing the "active" class on all items:*/
            removeActive(x);
            if (currentFocus >= x.length) currentFocus = 0;
            if (currentFocus < 0) currentFocus = (x.length - 1);
            /*add class "autocomplete-active":*/
            x[currentFocus].classList.add("autocomplete-active");
        }
        function removeActive(x) {
            /*a function to remove the "active" class from all autocomplete items:*/
            for (var i = 0; i < x.length; i++) {
                x[i].classList.remove("autocomplete-active");
            }
        }
        function closeAllLists(elmnt) {
            /*close all autocomplete lists in the document,
            except the one passed as an argument:*/
            var x = document.getElementsByClassName("autocomplete-items");
            for (var i = 0; i < x.length; i++) {
                if (elmnt != x[i] && elmnt != inp) {
                  x[i].parentNode.removeChild(x[i]);
                }
            }
        }
        /*execute a function when someone clicks in the document:*/
        document.addEventListener("click", function (e) {
            closeAllLists(e.target);
            searchMain();
        });
    }

    function autoYear(sYearInput, eYearInput){
        tYear = (new Date()).getFullYear();
        yearOptClear();
        /* Add yearOpt's */
        for(var i=2007;i<=tYear;i++){
            var os = document.createElement("OPTION");
            os.setAttribute("value", i);
            os.setAttribute("class", "yearOpt");
            if(i == 2007){ os.setAttribute("selected","True"); }
            os.innerHTML = i;
            sYearInput.appendChild(os);
            var oe = document.createElement("OPTION");
            oe.setAttribute("value", i);
            oe.setAttribute("class", "yearOpt");
            if(i == tYear){ oe.setAttribute("selected", "True"); }
            oe.innerHTML = i;
            eYearInput.appendChild(oe);
        }
        var ssel = sYearInput.value;
        var esel = eYearInput.value;
        sYearInput.addEventListener("change",function(e){
            yearOptClear(sYearInput);
            /* Add yearOpt"s */
            for(var j=2007;j<=tYear;j++){
                var o = document.createElement("OPTION");
                o.setAttribute("value", j);
                o.setAttribute("class", "yearOpt");
                o.innerHTML = j;
                if(j<this.value){
                    o.setAttribute("disabled", "True");
                }else if(j==esel){
                    o.setAttribute("selected", "True");
                }
                eYearInput.appendChild(o);
            }
            ssel = sYearInput.value;
        });
        eYearInput.addEventListener("change",function(e){
            yearOptClear(eYearInput);
            /* Add yearOpt"s */
            for(var k=2007;k<=tYear;k++){
                var o = document.createElement("OPTION");
                o.setAttribute("value", k);
                o.setAttribute("class", "yearOpt");
                o.innerHTML = k;
                if(k>this.value){
                    o.setAttribute("disabled","True");
                }else if(k==ssel){
                    o.setAttribute("selected", "True");
                }
                sYearInput.appendChild(o);
            }
            esel = eYearInput.value;
        });
    }

    function yearOptClear(excludedParent){
    /* remove all yearOpt"s */
    var cList = document.getElementsByClassName("yearOpt");
    for (var l=0; l<cList.length; l++){
        if(cList[l].parentNode!=excludedParent){
            cList[l].parentNode.removeChild(cList[l]);
            l--;
          }
        }
    }

    var array=[]
    $.get("../search/searchWord", function(data, status){
        autocomplete(document.getElementById("searchWord"),data);
    });
    autoYear(document.getElementById("sYear"), document.getElementById("eYear"));

    function searchMain(){
        var subject = sF.getElementsByTagName("select")[0];
        var type = sF.getElementsByTagName("select")[1];
        var sYear = sF.getElementsByTagName("select")[2];
        var eYear = sF.getElementsByTagName("select")[3];
        var searchWord = document.getElementById("searchWord");
        var searchHttp = new XMLHttpRequest();
        searchHttp.onreadystatechange = function(){
            if(this.readyState == 4 && this.status == 200){
                var res = this.responseText;
                document.getElementById("searchResult").innerHTML=res;
            }
        }
        searchHttp.open("GET","../search?subject="+subject.value+"&sYear="+sYear.value+"&eYear="+eYear.value+"&type="+type.value+"&searchWord="+searchWord.value);
        searchHttp.send();
    }

    // For searchForm
    var sF = document.getElementById("searchForm");
    $(sF).submit(function(event){
        event.preventDefault();
        searchMain();
    });

    // To load data automatically when user get into page
    searchMain();

    function checkUploadForm(uF, cb){
        var TNWords = ["This field is necessary!","Year must be number", "Invalid Email", "File must be in PDF","This field is not required but is recommended"];
        var TDWords = {};
        $.get("/i18n/words"+"?words="+TNWords.join("|"),(data)=>{
            TDWords = data;
            // console.log(data);
            // var notNessName = ["advisor1[institute]","advisor1[email]","advisor2[name]","advisor2[institute]","advisor2[email]","abstract","extraFiles", "research_id"];
            var nessName = [/title/, /subject/, /type/, /year/, /researcher_name\[\d\]/, /researcher_email\[\d\]/,/advisor1\[name\]/,/uploadFile/];
            var typeCheckName = [/year/, /advisor\d\[email\]/, /researcher_email\[\d\]/, /uploadFile/]
            var validInputChecker={
                "year" : [(val)=>{return (""+Number.parseInt(val)===val);}, TDWords["Year must be number"]],
                "advisor\\d\\[email\\]" : [(val)=>{return val.match(/.+.*@.+.*\.+.*/);}, TDWords["Invalid Email"]],
                "researcher_email\\[\\d\\]" : [(val)=>{return val.match(/.+.*@.+.*\.+.*/);}, TDWords["Invalid Email"]],
                "uploadFile" : [(val)=>{return val.slice(-3)=="pdf";}, TDWords["File must be in PDF"]]
            };
            var reccName = [/advisor1\[.*\]/, /abstract/];
            var res = true;
            var inputs = uF.getElementsByClassName("form-control mr-sm-2");
            for(var i=0; i<inputs.length; i++){
                fieldNice(inputs[i]);
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
                }
                else if(typeCheckName.some((name)=>{return inputs[i].name.match(name);})){
                    var inputName = typeCheckName.find((name)=>{return inputs[i].name.match(name);}).toString().slice(1,-1);
                    if(!(validInputChecker[inputName][0](inputs[i].value))){
                        res = false;
                        inputs[i].classList.add("InputAlertDanger");
                        a.setAttribute('data-tip',validInputChecker[inputName][1]);
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
                if(a){a.parentNode.removeChild(a);}
            }
            cb(res);
        })
    }

    function sendUploadForm(uF){
        uF.getElementsByTagName("button")[0].setAttribute('disabled','True');
        var formData = new FormData(uF);
        $.ajax({
            url: "/upload",
            data: formData,
            processData: false,
            contentType: false,
            type: 'POST',
            success: function(res) {
                // console.log(res);
                alert(res.Msg);
                uF.getElementsByTagName("button")[0].removeAttribute('disabled');
                if(res.Msg=="Success"){ uF.reset(); document.location.replace("/info?id="+res.rId); }
                return true;
            }
        });
        return false;
    }

    var uF = document.getElementById("uploadForm");
    $(uF).submit(function(event) {
        event.stopPropagation();
        event.preventDefault();
        $.get("/i18n/words?words=uploadAlert",(wordRes)=>{
            if(confirm(wordRes["uploadAlert"]))
            {
                checkUploadForm(uF, (res)=>{
                    if(res) return sendUploadForm(uF);
                    else return res; // = false
                });
            }
        });
    });

    var logined = false;
    function accStatusUpdateMain(){
        if(logined){return;}
        $.get("/account/info",(data)=>{
            if(data['login']==true){
                document.getElementById('nav_manage').removeAttribute("hidden");
                document.getElementById('nav_upload').removeAttribute("hidden");
                document.getElementById('accUpdateID').value = data['stu_id'];
                logined = true;
            }
        })
    }
    var cnt = 0;
    window.onload = function(e){
        accStatusUpdateMain();
        setInterval(accStatusUpdateMain,3000);
        if(location.hash != "") {
            $('a[href="' + location.hash + '"]').click();
        }else{
            location.hash = "#landing";
        }
    }

    window.onhashchange = function(e){
        $.get("/account/info",(data)=>{
            if(e.oldURL != e.newURL){
                if(location.hash == "#manage" || location.hash == "#upload"){
                    if(!data['login']){
                        $('a[href="' + "#landing" + '"]').click();
                    }
                    else{
                        $('a[href="' + location.hash + '"]').click();
                    }
                }
                else if(location.hash != "") {
                    $('a[href="' + location.hash + '"]').click();
                }else{
                    $('a[href="' + "#landing" + '"]').click();
                }
                if(e.oldURL.split('#').length==2){
                    if("#"+e.oldURL.split("#")[1] == "#landing") cnt+=1;
                }
            }
        })
    }

    $('.navbar-collapse a').click(function(){
        $(".navbar-collapse").collapse('hide');
    });

    $('.nav-link').click(function(e){
        if(location.hash == "#landing" && cnt==0){
            location.hash = e.target.hash;
        }
        else if(e.target.hash!= location.hash){location.replace(e.target.hash);}
    });

})(jQuery);
