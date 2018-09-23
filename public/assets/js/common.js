function controlLoginForm(s){
    var display = document.getElementById('loginFormDiv').style.display;
    if(s=="show"){
        document.getElementById('loginFormDiv').style.display = "block";
    }
    else if(s=="hide"){
        document.getElementById('loginFormDiv').style.display = "none";
    }
}

var TNWords = ['Student ID', 'Name', 'Email']
TDWords={};
$.get("/i18n/words?words="+TNWords.join("|"), (retVal) =>{
    TDWords = retVal;
})

var fN = 0;
function addResearcherField(){
    fN+=1;
    var div = document.getElementById("researcherFields");
    var rFi = document.createElement('div');
    rFi.setAttribute("id","researcherField_"+fN);
    rFi.setAttribute("class","flex horzExLong nomargin");
    rFi.innerHTML =
`    <input class="form-control mr-sm-2 horzLong vertShort" name="researcher_name[${fN}]" placeholder="${TDWords['Student ID']} & ${TDWords['Name']} : XX-XXX ZZZ"></input>
     <input class="form-control mr-sm-2 horzLong vertShort" name="researcher_email[${fN}]" placeholder="${TDWords['Email']} : zzz@yyy.com"></input>
`
    div.appendChild(rFi);
}
function remResearcherField(){
    if(fN>0){
        var div = document.getElementById("researcherField_"+fN);
        div.parentNode.removeChild(div);
        fN-=1;
    }
}
