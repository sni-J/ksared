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
                // $.post("/account/admin", {}, fillAccountInfo);
            }
        })
    }
    var researchAttr = ['research_id', 'title', 'subject', 'year', 'type', 'abstract', 'researcher',
                                    'advisor1', 'advisor2', 'filePath', 'extraFiles', 'hiddden'];

    function fillResearchInfo(researches){
        var start =
        `   <h4>${TDWords["Research"]+" "+TDWords["Info"]}</h4>
            <table class="adminTable horzExLong"><thead>
                    <td><div>${TDWords["ID"]}</div></td>
                    <td><div>${TDWords["Title"]}</div></td>
                    <td><div>${TDWords["Subject"]}</div></td>
                    <td><div>${TDWords["Year"]}</div></td>
                    <td><div>${TDWords["Type"]}</div></td>
                    <td><div>${TDWords["Content"]}</div></td>
                    <td><div>${TDWords["Researcher"]}</div></td>
                    <td><div>${TDWords["Supervisor"]}(${TDWords["Institute"]})</div></td>
                    <td><div>${TDWords["Co-Supervisor"]}(${TDWords["Institute"]})</div></td>
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
                    <td><div>${research.research_id}</div></td>
                    <td><div>${research.title}</div></td>
                    <td><div>${research.subject}</div></td>
                    <td><div>${research.year}</div></td>
                    <td><div>${research.type}</div></td>
                    <td><div>${research.abstract}</div></td>
                    <td><div>${research.researcher.split(/\([^)]*\)/).join("")}</div></td>
                    <td><div>${research.advisor1.name}(${research.advisor1.institute})</div></td>
                    <td><div>${research.advisor2.name}${(research.advisor2.name?"("+research.advisor2.institute+")":"")}</div></td>
                    <td><div><label class="switch"><input id="sw_${research.research_id}" type="checkbox"><span class="slider"></span></label></div></td>
                </tr>
            `
        })
        document.getElementById("admin_main").innerHTML += start+mid+end;
        for(var i=0;i<researches.length;i++){
            var research = researches[i];
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
        }
    }
})(jQuery);
