(function($){
    var TNWords = ["Title", "Subject", "Year", "Type", "Content", "Researcher", "Supervisor", "Co-Supervisor", "ID", "Paper", "File", "ExtraFiles", "Restricted Area", "Research", "Institute", "Show / Hide", "Password", "Reset", "Account", "All", "Info"];
    var TDWords = {};
    $.get("/i18n/words"+"?words="+TNWords.join("|"),(data)=>{
        TDWords = data;
        checkPermission();
    })

    function checkPermission(){
        $.get("/account/info",(res)=>{
            if(res.admin!='admin'){
                if(res.login){
                    alert(TDWords["Restricted Area"]);
                    document.location.redirect("/");
                }
                else{
                    document.getElementById('loginFormDiv').style.display="block";
                }
            }
            else{
                $.post("/info/getAll", {}, fillResearchInfo);
            }
        })
    }
    var researchAttr = ['research_id', 'title', 'subject', 'year', 'type', 'abstract', 'researcher',
                                    'advisor1', 'advisor2', 'filePath', 'extraFiles', 'hiddden'];

    function fillResearchInfo(researches){
        var start =
        `   <h4>${TDWords["Research"]+" "+TDWords["Info"]}</h4>
            <table class="adminTable horzExLong"><thead>
                    <td><div>${TDWords["Title"]}</div></td>
                    <td><div>${TDWords["Show / Hide"]}</div></td>
            </thead><tbody>`;
        var mid="";
        var end =
            `   </tbody>
            </table>
            <br>
            <br>`
            ;
        document.getElementById("admin_control").innerHTML=
            `
            <button class="btn btn-danger horzLong" onclick="passwordReset()">${TDWords["Password"] +" "+ TDWords["Reset"]}</button>
            <button class="btn btn-danger horzLong" onclick="javascript:window.location.href='account/restoreAccounts?DevCode='+prompt('DEVCODE?');">${TDWords["All"]+" "+TDWords["Password"] +" "+ TDWords["Reset"]}</button>
            `
        researches.forEach((research)=>{
            mid+=
            `
                <tr>
                    <td><div><a href="/info?id=${research.research_id}">${research.title}</a></div></td>
                    <td><div><label class="switch"><input id="sw_${research.research_id}" type="checkbox"><span class="slider"></span></label></div></td>
                </tr>
            `
        })
        document.getElementById("admin_main").innerHTML += start+mid+end;
        researches.forEach((research)=>{
            var checkbox = document.getElementById(`sw_${research.research_id}`);
            if(research.hidden=="no"){checkbox.setAttribute('checked','true');}
            console.log("sw");
            checkbox.addEventListener("change",function(){
                if(checkbox.checked == true){
                    $.post("/info/changeState",{id:research.research_id, hidden: "no"}, (res)=>{alert(res);});
                }else{
                    $.post("/info/changeState",{id:research.research_id, hidden: "yes"}, (res)=>{alert(res);});
                }
            });
        });
    }
})(jQuery);
