function tryLogin() {
    let error_span = document.getElementById("login-error");
    var username = document.querySelector("input[name='login_email']").value; 
    var password = document.querySelector("input[name='login_password']").value;
    
    if(!username || username == ""){
        document.querySelector("input[name='login_email']").classList.add("input-error");
        return;
    }
    else{
        document.querySelector("input[name='login_email']").classList.remove("input-error");
    }

    if(!password || password == ""){
        document.querySelector("input[name='login_password']").classList.add("input-error");
        return;
    }
    else{
        document.querySelector("input[name='login_password']").classList.remove("input-error");
    }
    
    

    let url = "/api/identity/login";
    let data = {username: username, password: password};
    apiPost(url, data, (result) => {
        if(result.success){
            window.location = "/";
            showGeneralError(null,null)
        }else{
            showGeneralError(result.message, "emergency_home");
            
        }
    });
}

function tryCreate(){
    let error_span = document.getElementById("create-error");
    showGeneralError(null,null)
    var email = document.querySelector("input[name='create_email']").value;
    var full_name = document.querySelector("input[name='create_full_name']").value;
    var password = document.querySelector("input[name='create_password']").value;
    var confirm = document.querySelector("input[name='create_confirm']").value;

    if(!email || email == ""){
        document.querySelector("input[name='create_email']").classList.add("input-error");
        return;
    }
    else{
        document.querySelector("input[name='create_email']").classList.remove("input-error");
    }

    if(!full_name || full_name == ""){
        document.querySelector("input[name='create_full_name']").classList.add("input-error");
        return;
    }
    else{
        document.querySelector("input[name='create_full_name']").classList.remove("input-error");
    }

    if(!password || password == ""){
        document.querySelector("input[name='create_password']").classList.add("input-error");
        return;
    }
    else{
        document.querySelector("input[name='create_password']").classList.remove("input-error");
    }

    if(!confirm || confirm == ""){
        document.querySelector("input[name='create_confirm']").classList.add("input-error");
        return;
    }
    else{
        document.querySelector("input[name='create_confirm']").classList.remove("input-error");
    }

    if(password != confirm){

        document.querySelector("input[name='create_password']").classList.add("input-error");
        document.querySelector("input[name='create_confirm']").classList.add("input-error");

        showGeneralError("Passwords do not match","vpn_key")
        return;
    }else{
        document.querySelector("input[name='create_password']").classList.remove("input-error");
        document.querySelector("input[name='create_confirm']").classList.remove("input-error");
    }

    let url = "/api/identity/register";
    let data = {email: email, full_name: full_name, password: password};
    apiPost(url, data, (result) => {
        if(result.success){
            window.location = "/";
            showGeneralError(null,null)
        }else{
            
            showGeneralError(result.message,"emergency_home")
        }
    });
}