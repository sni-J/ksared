(function($){
    var researchAttr = ['research_id', 'title', 'subject', 'year', 'type', 'abstract', 'researcher',
                                    'advisor1', 'advisor2', 'filePath', 'extraFiles', 'hidden'];
    var TNWords = ["Supervisor", "Co-Supervisor", "View Image"];
    var TDWords = {};
    $.get("/i18n/words"+"?words="+TNWords.join("|"),(data)=>{
        TDWords = data;
        $.get("/info/getInfo"+document.location.search, fillInfo);
    })

    function fillInfo(research){
        if(research=="") {document.getElementById("research_title").innerHTML = "Invalid Access";return;}
        document.getElementById("research_title").innerHTML = research.title||research;
        document.getElementById("research_title").after(document.createElement("hr"));
        var researcherList = research.researcher.split(";");
        var infoDiv = document.getElementById("researcher_info");
        for(var i=0;i<researcherList.length;i++){
            infoDiv.innerHTML +=
                (i==0?"":"&nbsp;|&nbsp;")
                + `<span>`
                    +researcherList[i].split("(")[0].trim().split(" ").join("&nbsp;").split("-").join("&#8209;")
                    +"&nbsp;<a href='mailto:"+researcherList[i].split("(")[1].slice(0,-1)+"'>"
                        + "<i class='far fa-envelope'></i>"
                    +"</a>"
                + `</span>`;
        }
        document.getElementById("advisor_info").innerHTML =
                (research.advisor1.name==""?"":
                    TDWords["Supervisor"] + " : "
                    + research.advisor1.name
                    + (
                        ("&nbsp;("+research.advisor1.institute.split(" ").join("&nbsp;")+")&nbsp;")||""
                      )
                    + (research.advisor1.email=="" ? "" :
                        "<a href='emailto:"+research.advisor1.email+"'>"
                            +"<i class='far fa-envelope'></i>"
                        +"</a>"
                      )
                )
                +
                (research.advisor2.name==""?"":
                    "<br>"+
                    TDWords["Co-Supervisor"] + " : "
                    + research.advisor2.name
                        + (
                            ("&nbsp;("+research.advisor2.institute.split(" ").join("&nbsp;")+")")||""
                          )
                        + (research.advisor2.email=="" ? "" :
                            "&nbsp;<a href='emailto:"+research.advisor2.email+"'>"
                            +"<i class='far fa-envelope'></i>"
                            +"</a>"
                          )
                );
        document.getElementById("else_info").innerHTML =
                research.subject    + " | "
            +   research.year       + " | "
            +   research.type;
        document.getElementById("else_info").parentNode.after(document.createElement("hr"));
        if(research.abstract!=""){
            document.getElementById("abstract").innerHTML = research.abstract;
            document.getElementById("abstract").parentNode.after(document.createElement("hr"));
        }else{
            document.getElementById("abstract").parentNode.getElementsByTagName("label")[0].setAttribute("hidden","true");
        }
        var fileDiv = document.getElementById("fileDiv");
        fileDiv.innerHTML+=
                `   <span class="horzLong nomargin">
                        <a id = "file" href="" target='_blank'></a>
                    </span>`;
        document.getElementById("file").setAttribute("href", research.filePath);
        document.getElementById("file").innerHTML = research.filePath.split("/").pop();
        var exFiles = research.extraFiles.split("|");
        var imgIdx = 0;
        if(exFiles.join("")!=""){
            fileDiv.innerHTML+= '<hr class="horzExLong">';
        }
        for(var i=0;i<exFiles.length;i++){
            if(exFiles[i]!=""){
                checkImage(exFiles[i],(isImage)=>{
                    fileDiv.innerHTML+=
                    `<span class="horzLong nomargin">
                        <a id = "file" href="`+exFiles[i]+`"  target='_blank'>`+exFiles[i].split("/").pop()+`</a>`
                        +(isImage ?
                        `   <a id='imgStChA`+imgIdx+`' onClick="imageStateChange(`+imgIdx+`);">[`+TDWords["View Image"]+`]</a>
                            <a id='img`+imgIdx+`' class='horzExLong' href="`+exFiles[i]+`" target='_blank' hidden>`
                                +"<img class='exFileImage' src='"+exFiles[i]+"' target='_blank'>"
                            +"</a>"
                            +"<br/>"
                        :"")
                    +"</span>";
                    if(isImage){imgIdx+=1;}
                });
            }
        }
        if(research.perm){
            document.getElementById("editBtn").removeAttribute("hidden");
        }
        if(research.admin){
            document.getElementById("delBtn").removeAttribute("hidden");
        }
    }

    document.getElementById('delBtn').addEventListener('click',function(e){
        e.preventDefault();
        $.get('/info/delete'+document.location.search,(res)=>{
            alert(res);
            window.location='/main#landing';
        });
    });

    function checkImage(exFP, cb){
        cb(['jpg', 'gif', 'png'].includes(exFP.split(".").pop()));
    }
})(jQuery);
