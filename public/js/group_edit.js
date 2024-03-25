let allUids = [];

function initGroupEdit(){
    document.querySelectorAll(".user").forEach((element) => {
        allUids.push(element.dataset.uid);
    });

}


setTimeout(() => {
    initGroupEdit();

}, 500);

function iconChoose(){
    showDialog({
        title: "Choose Icon for This Group",
        description: "Icon",
        type: "icon",
        icon: "ink_highlighter",
        onchoose: () => {
            let image_viewer = document.querySelector("#group-image");
            image_viewer.classList.add("no-display");
            let icon_viewer = document.querySelector("#group-icon");
            icon_viewer.removeAttribute("hidden");
            icon_viewer.innerHTML = current_dialog_data.selected;

            changeProperty("icon", current_dialog_data.selected);
            
            hideDialog();
        },
        extra: {}
    });
}

function imageChoose(){
    showDialog({
        title: "Choose Image for This Group",
        description: "Image",
        type: "image",
        icon: "ink_highlighter",
        onchoose: () => {
            let image_viewer = document.querySelector("#group-image");
            image_viewer.classList.add("no-display");
            let icon_viewer = document.querySelector("#group-icon");
            icon_viewer.removeAttribute("hidden");
            icon_viewer.src = current_dialog_data.selected;

            changeProperty("icon", "IMAGE:" + current_dialog_data.selected);
            
            hideDialog();
        },
        extra: {}
    });

}

function colorChange(element){
    let color = element.value;
    // validate brightness of color
    let colorChangeCallback = () => {


        var colorA = "rgba(" + parseInt(color.substring(1, 3), 16) + "," + parseInt(color.substring(3, 5), 16) + "," + parseInt(color.substring(5, 7), 16) + ",0.7)";
        var colorB = "rgba(" + parseInt(color.substring(1, 3), 16) + "," + parseInt(color.substring(3, 5), 16) + "," + parseInt(color.substring(5, 7), 16) + ",1)";

        let newGradientBackground = `linear-gradient(160deg, ${colorA}, ${colorB})`;

        document.getElementById("group-color").style.background = color;
        document.getElementById("group-color").style.background = newGradientBackground;

        // change all elements that depended on the group's color
        document.querySelectorAll(".group-color").forEach((element) => {
            element.style.color = color;
        });
    }
    

    changeProperty("color", color, colorChangeCallback);
}

function openChange(element){


    let open = element.dataset.open == "true";



    let openChangeCallback = () => {

        open = !open;
        element.dataset.open = open;
        element.querySelector("span").innerHTML = open ? "Lock / Close Group" : "Unlock / Open Group";
        document.getElementById("group-open-icon").innerHTML = open ? "lock_open" : "lock";
    }

    if(open){
        showDialog({
            title: "Confirm Locking Group",
            description: "After a group is locked, all users without the override permissions will be unable to join this group on their own. Are you sure you want to lock this group?",
            type: "buttons",
            icon: "lock_person",
            buttons: [
                {
                    text: "Lock Group",
                    class: "button-main",
                    background: "error-bg",
                    onclick: () => {

                        changeProperty("open", !open, openChangeCallback);

                        hideDialog();
                    }
                },
                {
                    text: "Keep Group Unlocked",
                    class: "button-alternate",
                    onclick: () => {
                        hideDialog();
                    }
                }
            ]
        });
        return;
    }

    changeProperty("open", !open, openChangeCallback);
}

function changeName(element){
    let name = element.value;
    let nameChangeCallback = () => {
        
    }

    changeProperty("name", name, nameChangeCallback);
}

function createSplit(){
    showDialog({
        title: "Create New Split",
        description: "Create a new split for members to join",
        type: "inputs",
        icon: "add",
        inputs: [
            {
            	type: "text",
                name: "Split Name",
                placeholder: "Name",
                property: "name",
                class: "button-main",
            }
        ],
        done: (dialog_data) => {
            let splitName = dialog_data.name;

            let url = "/api/groups/split/create";
            let data = {name: splitName, gid: gid};

            apiPost(url, data, (result) => {
                if(result.success){
                    location.reload();
                } else {
                    console.log(result);
                }
            });
        }
    });
}

function addUsers(){
    showDialog({
        title: "Add Users to Group",
        description: "User",
        type: "user",
        icon: "person_add",
        multiple: true,
        exclude: allUids,
        onchoose: () => {
            let url = "/api/groups/group/membership";

            current_dialog_data.selected.forEach((user) => {
                let data = {gid: gid, uid: user.uid};

                apiPost(url, data, (result) => {
                    if(result.success){
                        allUids.push(user.uid);
                        let addHTML = `<span class="medium user resolve-further" data-uid="${user.uid}" data-username="${user.full_name}">${user.full_name}</span>`
                        document.getElementById("group-members").innerHTML += addHTML;
                    }else{
                        console.log(result);
                    }
                    
                });
            });

            hideDialog();
        },
    })
}

function manageUser(element){
    let uid = element.dataset.uid;
    let username = element.dataset.username;
    let elevated = element.dataset.elevated == "true";

    // TODO: check for permissions on removing elevated permissions
    if(elevated) return;

    showDialog({
        title: "Remove " + username + " from Group?",
        description: "Would you like to remove this user from the group? Unless this group is locked, the user will be able to rejoin the group at any time.",
        type: "buttons",
        icon: "person_remove",
        buttons: [
            {
                text: "Remove User",
                class: "button-main",
                background: "error-bg",
                onclick: () => {

                    let url = '/api/groups/group/membership/delete';
                    let data = {sid: sid, uid: uid};

                    apiPost(url, data, (result) => {
                        if(result.success){
                            allUids = allUids.filter((value) => {
                                return value != uid;
                            });
                            element.remove();
                        } else {
                            console.log(result);
                        }
                    });
                    hideDialog();
                }
            },
            {
                text: "Keep User in Group",
                class: "button-alternate",
                onclick: () => {
                    hideDialog();
                }
            }
        ]
    });
    
}

function changeProperty(name, value, callback){
    let url = "/api/groups/group/";
    // managers should only have permission to control:
    // - icon
    // - color
    // - members (NON-manager)
    // - attending events
    let data = {gid: gid};
    data[name] = value;

    apiPost(url, data, (result) => {
        if(result.success){
            if(callback){
                callback();
            }
        } else {
            console.log(result);
        }
    });
}