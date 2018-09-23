var loginBtn = document.getElementById("accountNav");
function accStatusUpdate(){
    $.get("/account/info",(data)=>{
        $.get("/i18n/words?words=Log-Out|Log-In",(wordRes)=>{
            if(data['login']){
                loginBtn.innerHTML = data['stu_id'] +" ("+wordRes['Log-Out']+")";
                loginBtn.setAttribute("href","account/logout?redirect="+encodeURIComponent(location));
            }else{
                loginBtn.innerHTML = wordRes['Log-In'];
                loginBtn.setAttribute("href","javascript:controlLoginForm('show')");
            }
        })
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
