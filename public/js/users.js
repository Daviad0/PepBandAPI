let users = [];
let roles = [];
let showUsers = [];
let selectedUsers = [];

let filter_mtu_id = "";
let filter_mtu_name = "";
let filter_uid = "";

function addUser(user){

    // get the ejs template passed inside of the page
    let html = user_item_template;

    // replace all of the default values with the actual values
    html = html.replaceAll("DEFAULT_UID", user.uid);
    html = html.replaceAll("DEFAULT_MTUID", user.mtu_id);
    html = html.replaceAll("DEFAULT_FULLNAME", user.full_name);
    html = html.replaceAll("DEFAULT_EMAIL", user.email);
    html = html.replaceAll("DEFAULT_RID", user.rid);

    // get the role of the user
    let userRole = roles.find(r => r.rid == user.rid);

    html = html.replaceAll("DEFAULT_ROLE", userRole == undefined ? "Unknown" : userRole.name);

    // format and add to div
    let user_item = document.createElement("div");

    user_item.innerHTML = html;
    user_item = user_item.firstChild;




    document.getElementById("user-list").appendChild(user_item);

}

function updateUserList(){
    // get all appropriate users due to the filters
    let wantToShowUsers = users.filter((user) => {
        let show = true;
        if(filter_mtu_id.length > 0){
            show = show && user.mtu_id.includes(filter_mtu_id);
        }
        if(filter_mtu_name.length > 0){
            show = show && user.mtu_name.includes(filter_mtu_name);
        }
        if(filter_uid.length > 0){
            show = show && user.uid == filter_uid;
        }
        return show;
    });

    // loop through each item in showUsers that isn't in wantToShowUsers and remove the div from the DOM
    showUsers.forEach((user) => {
        if(!wantToShowUsers.includes(user)){
            let user_item = document.querySelector(`div.user-item[data-uid="${user.uid}"]`);
            user_item.remove();
        }
    });

    // loop through each item in wantToShowUsers that isn't in showUsers and add the div to the DOM
    wantToShowUsers.forEach((user) => {
        if(!showUsers.includes(user)){
            addUser(user);
        }
    });
}


function getRoles(){
    let url = "/api/identity/roles";

    apiGet(url, (result) => {
        if(result.success){
            roles = result.data;
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