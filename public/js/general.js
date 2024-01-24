// any general methods that should be shared across pages

function resolve(about, origValue, newValue, access){

    let elements = document.querySelectorAll(`span[data-about="${about}"][data-value="${origValue}"]`);

    // remove event listeners off of elements
    if(!access){
        // show a message about not having access to resolve further
        elements.forEach((element) => {
            element.innerHTML = `<span class="error">Permission Denied</span>`;
            element.classList.remove("resolve-further");
            element.onclick = null;
        })
    }else{
        elements.forEach((element) => {
            element.innerHTML = newValue;
            element.classList.remove("resolve-further");
            element.onclick = null;
        })
    }
}

function showError(element, message){
    if(!message){
        element.classList.add("no-display");
        element.innerHTML = "";
    }else{
        element.classList.remove("no-display");
        element.innerHTML = message;
    }
}

function resolve_user(element){
    let uid = element.getAttribute("data-value");

    if(uid == "-1"){
        resolve("uid", uid, "Unknown User", true);
        return;
    }

    let url = "/api/identity/find/" + uid;
    apiGet(url, (result) => {
        if(result.success){
            resolve("uid", uid, result.data[0].full_name, true);
        }else{
            resolve("uid", uid, "Unknown User", false);
        }
    })
}





function sign_in_click(){
    showDialog({
        title: "Sign In Options",
        description: "Please choose a method to sign into the Husky Pep Band system. If you originally signed in with a certain method, you must use that method to sign in again!",
        icon: "group_add",
        buttons: [
            {
                text: "Michigan Tech ISO",
                class: "button-main",
                onclick: () => {
                    window.location.href = "/account/authenticate";
                }
            },
            {
                text: "Manual Sign In",
                class: "button-main",
                onclick: () => {
                    window.location.href = "/account/manual";
                }
            },
            {
                text: "Cancel",
                class: "button-alternate",
                onclick: () => {
                    hideDialog();
                }
            }
        ]
    })
}

function log_out_click(){
    showDialog({
        title: "Log Out",
        description: "Are you sure you want to log out? You will not be able to log back into the system unless you have access to your original sign-in system!",
        icon: "door_open",
        buttons: [
            {
                text: "Log Out",
                class: "button-main",
                background: "error-bg",
                onclick: () => {
                    window.location.href = "/account/logout";
                }
            },
            {
                text: "Cancel",
                class: "button-alternate",
                onclick: () => {
                    hideDialog();
                }
            }
        ]
    })

}






/**
 * 
 * @param {object} properties
 * @param {string} properties.type
 * @param {string} properties.title
 * @param {string} properties.description
 * @param {string} properties.icon
 * @param {list} properties.buttons
 */
function showDialog(properties){ 


    let dialog_component = document.getElementById("dialog-component");
    let dialog_title = document.getElementById("dialog-title");
    let dialog_description = document.getElementById("dialog-description");
    let dialog_icon = document.getElementById("dialog-icon");

    let dialog_buttons = document.getElementById("dialog-buttons");

    let dialog_type = properties.type;
    if(dialog_type == undefined){
        dialog_type = "buttons";
    }

    var optionDivs = document.querySelectorAll('dialog-option');
    for(let i = 0; i < optionDivs.length; i += 1){
        optionDivs[i].classList.add("no-display");
    }

    let selectedOptionDiv = document.querySelector(`.dialog-option[data-dialogtype="${dialog_type}"]`);
    selectedOptionDiv.classList.remove("no-display");

    switch(dialog_type){
        case "buttons": 
            

            let title = properties.title;
            let description = properties.description;
            let icon = properties.icon;
            let buttons = properties.buttons;
        
            dialog_title.innerHTML = title;
            dialog_description.innerHTML = description;
            dialog_icon.innerHTML = icon;
        
            dialog_buttons.innerHTML = "";
            buttons.forEach((button) => {
                // expecting text, class, and onclick
                // background may be defined 
                let button_element = document.createElement("button");
                button_element.innerHTML = button.text;
                button_element.classList.add(button.class);
                button_element.classList.add("dialog-button");
                if(button.background){
                    button_element.classList.add(button.background);
                }
                button_element.onclick = button.onclick;
                dialog_buttons.appendChild(button_element);
            });
    }
    



    
    dialog_component.classList.remove("dialog-hide");
    dialog_component.classList.add("dialog-show");
    dialog_component.classList.remove("dialog-hidden");


}

function hideDialog(){
    let dialog_component = document.getElementById("dialog-component");
    let dialog_title = document.getElementById("dialog-title");
    let dialog_description = document.getElementById("dialog-description");
    let dialog_icon = document.getElementById("dialog-icon");

    let dialog_buttons = document.getElementById("dialog-buttons");

    dialog_component.classList.remove("dialog-show");
    dialog_component.classList.add("dialog-hide");
    setTimeout(() => {
        dialog_component.classList.add("dialog-hidden");
    }, 600);
}