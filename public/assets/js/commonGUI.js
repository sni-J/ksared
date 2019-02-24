var loginBtn = document.getElementById("accountNav");
var logined = false;
function accStatusUpdate(){
    $.get("/account/info",(data)=>{
        if(data['login']!=logined || (data['login'] && logined)){
            $.get("/i18n/words?words=Log-Out|Log-In",(wordRes)=>{
                if(data['login']){
                    loginBtn.innerHTML = data['stu_id'] +" ("+wordRes['Log-Out']+")";
                    loginBtn.setAttribute("href","account/logout?redirect="+encodeURIComponent(location));
                }else{
                    loginBtn.innerHTML = wordRes['Log-In'];
                    loginBtn.setAttribute("href","javascript:controlForm('show','login')");
                }
            })
            logined = data['login'];
        }
    });
}

accStatusUpdate();
setInterval(accStatusUpdate, 3000);

var lF = document.getElementById("loginForm");
$(lF).submit(function(event){
    event.preventDefault();
    lF.setAttribute("action","account/login?redirect="+encodeURIComponent(location));
    lF.submit();
});
