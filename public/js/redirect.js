// onload redirect to the pepband app launcer

window.onload = function(){
    let user = new URLSearchParams(window.location.search).get("user");
    window.location = "pepband://login?user=" + user;
}