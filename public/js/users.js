let users = [];
let roles = [];
let showUsers = [];
let selectedUsers = [];

let filter_mtu_id = "";
let filter_full_name = "";
let filter_uid = "";


function updateSelectedUsers(){
    let indicator = document.getElementById("selected-users-indicator");

    let totalCount = selectedUsers.length;
    let totalCountShown = selectedUsers.filter(u => showUsers.find(su => su.uid == u)).length;

    indicator.innerHTML = `${totalCount} User${totalCount == 1 ? "" : "s"} Selected (${totalCount-totalCountShown} Hidden)`;
    if(totalCount == 0){
        indicator.classList.add("gray-bg");
        indicator.classList.remove("main-bg");
        

    }else{
        indicator.classList.add("main-bg");
        indicator.classList.remove("gray-bg");
    
    }
}

function selectUser(element){
    let uid = element.getAttribute("data-uid");

    if(element.checked){
        if(selectedUsers.includes(uid)) return;
        selectedUsers.push(uid);
    }
    else{
        selectedUsers = selectedUsers.filter(u => u != uid);
    }

    updateSelectedUsers();
}

function addUser(user){

    // get the ejs template passed inside of the page
    let html = user_item_template;

    // replace all of the default values with the actual values
    html = html.replaceAll("DEFAULT_UID", user.uid);
    html = html.replaceAll("DEFAULT_MTUID", user.mtu_id);
    html = html.replaceAll("DEFAULT_FULLNAME", user.full_name);
    html = html.replaceAll("DEFAULT_EMAIL", user.email);
    html = html.replaceAll("DEFAULT_RID", user.rid);
    html = html.replaceAll("DEFAULT_LASTSEEN", user.last_seen.substring(0,10));

    // get the role of the user
    let userRole = roles.find(r => r.rid == user.rid);

    html = html.replaceAll("DEFAULT_ROLE", userRole == undefined ? "Unknown" : userRole.name);

    // format and add to div
    let user_item = document.createElement("div");

    user_item.innerHTML = html;
    user_item = user_item.firstChild;

    if(user.uid == myUid){
        // show the "This is You" box
        user_item.querySelector("div.user-actions[name='different']").remove();
    }else{
        user_item.querySelector("div.user-actions[name='same']").remove();
    }

    let checkbox = user_item.querySelector("input[type='checkbox']");
    if(selectedUsers.includes(user.uid.toString())){
        checkbox.setAttribute("checked", true);
    }
    else{
        checkbox.removeAttribute("checked");
    }

    let select = user_item.querySelector("select[name='role']");
    if(select != null){
        select.value = user.rid;
        select.setAttribute("data-initvalue", user.rid);
    }
    



    showUsers.push(user);

    document.getElementById("user-list").appendChild(user_item);

}

function deleteUser(element){
    let uid = element.getAttribute("data-uid");
    let error_span = document.querySelector(`span[data-uid="${uid}"][name="error"]`);


    showDialog({
        type: "urgent_buttons",
        lottie: "/lotties/BreakingActionDelete.json",
        title: "Delete User '" + users.find(u => u.uid == uid).full_name + "'?",
        description: "You are about to delete the user '" + users.find(u => u.uid == uid).full_name + "'. This user's records will be removed from our database, but will be able to sign in through MTU's SSO to create a new account at any time.",
        icon: "delete",
        buttons: [
            {
                text: "Delete User",
                class: "button-main",
                background: "error-bg",
                onclick: () => {

                    let url = `/api/identity/users/${uid}/delete`;
                    let data = {uid: uid};

                    

                    apiPost(url, data, (result) => {
                        if(result.success){
                            users = users.filter(u => u.uid != uid);
                            showUsers = showUsers.filter(u => u.uid != uid);
                            selectedUsers = selectedUsers.filter(u => u != uid);

                            let user_item = document.querySelector(`div.user-item[data-uid="${uid}"]`);
                            user_item.remove();

                            updateSelectedUsers();
                        }else{
                            if(result.message){
                                showError(error_span, result.message);
                            }
                            else{
                                showError(error_span, "Error deleting user");
                            }
                        }
                    });

                    hideDialog();

                    
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

function updateUserList(){

    filter_uid = document.getElementById("user-search-uid").value;
    filter_mtu_id = document.getElementById("user-search-mtu_id").value;
    filter_full_name = document.getElementById("user-search-full_name").value;
    filter_last_seen = document.getElementById("user-search-last_seen").value;

    // get all appropriate users due to the filters
    let wantToShowUsers = users.filter((user) => {
        let show = true;
        if(filter_mtu_id.length > 0){
            show = show && user.mtu_id.includes(filter_mtu_id);
        }
        if(filter_full_name.length > 0){
            show = show && user.full_name.includes(filter_full_name);
        }
        if(filter_uid.length > 0){
            show = show && user.uid == filter_uid;
        }
        if(filter_last_seen != "any"){
            let now = new Date();
            let last_seen = Date.parse(user.last_seen);
            let diff = now - last_seen;

            let hours = diff / (1000 * 60 * 60);

            if(filter_last_seen < 0){
                // show if last_seen is less than the number of hours
                show = show && hours < Math.abs(filter_last_seen);
            }else{
                // show if last_seen is greater than the number of hours
                show = show && hours > filter_last_seen;
            }
        }
        return show;
    });

    // loop through each item in showUsers that isn't in wantToShowUsers and remove the div from the DOM
    showUsers.forEach((user) => {
        if(!wantToShowUsers.find(u => u.uid == user.uid)){
            let user_item = document.querySelector(`div.user-item[data-uid="${user.uid}"]`);
            user_item.remove();
            showUsers = showUsers.filter(u => u.uid != user.uid);
        }
    });

    // loop through each item in wantToShowUsers that isn't in showUsers and add the div to the DOM
    wantToShowUsers.forEach((user) => {
        if(!showUsers.find(u => u.uid == user.uid)){
            addUser(user);
        }
    });

    let select = document.getElementById("selected-users-role-select");
    select.value = "";
    updateSelectedUsers();
}

function editUserRole(element){
    let uid = element.getAttribute("data-uid");
    let error_span = document.querySelector(`span[data-uid="${element.getAttribute("data-uid")}"][name="error"]`);

    let property = "rid";
    let value = element.value;

    if(uid == myUid){
        showDialog({
            title: "You are Editing Yourself",
            description: "You are currently changing your role to " + roles.find(r => r.rid == value).name + ". Are you sure that you want to continue with this edit?",
            icon: "content_copy",
            type: "urgent_buttons",
            lottie: "/lotties/BreakingActionEdit.json",
            buttons: [
                {
                    text: "Change Role",
                    class: "button-main",
                    background: "error-bg",
                    onclick: () => {
    
                        let url = `/api/identity/users/${uid}/role`;
                        let data = {uid: uid};

                        data[property] = value;

                        apiPost(url, data, (result) => {
                            if(result.success){
                                element.classList.remove("input-error");
                                element.setAttribute("data-initvalue", value);
                                showError(error_span, "");
                            }
                            else{
                                element.classList.add("input-error");
                                element.value = element.getAttribute("data-initvalue");
                                showError(error_span, result.message);
                            }
                        });
    
                        hideDialog();
    
                        
                    }
                },
                {
                    text: "Cancel",
                    class: "button-alternate",
                    onclick: () => {

                        element.value = element.getAttribute("data-initvalue");

                        hideDialog();
                    }
                }
            ]
        })
        return;
    }

    let url = `/api/identity/users/${uid}/role`;
    let data = {uid: uid};

    data[property] = value;

    apiPost(url, data, (result) => {
        if(result.success){
            element.classList.remove("input-error");
            showError(error_span, "");
        }
        else{
            element.classList.add("input-error");
            showError(error_span, result.message);
        }
    });
}

function editSelectedUsersRole(element){
    let value = element.value;

    if(selectedUsers.length == 0) return;

    let role = roles.find(r => r.rid == value);

    showDialog({
        title: "Editing " + selectedUsers.length + " User" + (selectedUsers.length == 1 ? "" : "s") + " Role",
        description: "All selected users will receive " + role.name + " immediately. Are you sure that you want to continue with this mass edit?",
        icon: "content_copy",
        type: "urgent_buttons",
        lottie: "/lotties/BreakingActionEdit.json",
        buttons: [
            {
                text: "Change Role" + (selectedUsers.length == 1 ? "" : "s"),
                class: "button-main",
                background: "success-bg",
                onclick: () => {

                    hideDialog();

                    selectedUsers.forEach((uid) => {
                        let user_item = document.querySelector(`div.user-item[data-uid="${uid}"]`);
                        let select = user_item.querySelector("select[name='role']");
                        select.value = value;
                        editUserRole(select);
                    });

                   

                    
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

function getRoles(){
    let url = "/api/identity/roles";

    apiGet(url, (result) => {
        if(result.success){
            roles = result.data;

            let select = document.getElementById("selected-users-role-select");
            select.innerHTML = "<option value='' disabled>Select a Role</option>";

            roles.forEach((role) => {
                let option = document.createElement("option");
                option.value = role.rid;
                option.innerHTML = role.name;

                select.appendChild(option);
            });

            select.value = "";
        }
    
    });
}

function getUsers(){

    let url = "/api/identity/users";

    apiGet(url, (result) => {
        if(result.success){
            users = result.data;
            updateUserList();
        }
    });

}

getUsers();
getRoles();