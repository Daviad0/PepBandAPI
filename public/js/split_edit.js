let allUids = [];

function initSplitEdit(){
    document.querySelectorAll(".user").forEach((element) => {
        allUids.push(element.dataset.uid);
    });

}

setTimeout(() => {
    initSplitEdit();
}, 500);

function iconChoose(){
    showDialog({
        title: "Choose Icon for This Split",
        description: "Icon",
        type: "icon",
        icon: "ink_highlighter",
        onchoose: () => {
            let image_viewer = document.querySelector("#split-image");
            image_viewer.classList.add("no-display");
            let icon_viewer = document.querySelector("#split-icon");
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
        title: "Choose Image for This Split",
        description: "Image",
        type: "image",
        icon: "ink_highlighter",
        onchoose: () => {
            let image_viewer = document.querySelector("#split-image");
            image_viewer.classList.add("no-display");
            let icon_viewer = document.querySelector("#split-icon");
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

        document.getElementById("split-color").style.background = color;
        document.getElementById("split-color").style.background = newGradientBackground;

        // change all elements that depended on the split's color
        document.querySelectorAll(".split-color").forEach((element) => {
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
        element.querySelector("span").innerHTML = open ? "Lock / Close Split" : "Unlock / Open Split";
        document.getElementById("split-open-icon").innerHTML = open ? "lock_open" : "lock";
    }

    if(open){
        showDialog({
            title: "Confirm Locking Split",
            description: "After a split is locked, all users without the override permissions will be unable to join this split on their own. Are you sure you want to lock this split?",
            type: "buttons",
            icon: "lock_person",
            buttons: [
                {
                    text: "Lock Split",
                    class: "button-main",
                    background: "error-bg",
                    onclick: () => {

                        changeProperty("open", !open, openChangeCallback);
                        hideDialog();
                    }
                },
                {
                    text: "Keep Split Unlocked",
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

function updateEventViewAttendance(eid, attending){
    let eventDiv = document.querySelector(".event[data-eid='" + eid + "']");

    if(attending){
        eventDiv.classList.remove("event-not-attending");
    }else{
        eventDiv.classList.add("event-not-attending");
    }

}

function attendingChange(element){
    let eid = element.dataset.eid;
    let attending = element.value == "yes";

    if(attending){
        let url = '/api/event/' + eid + '/split';
        let data = {sid: sid};

        apiPost(url, data, (result) => {
            if(result.success){
                console.log("Successfully joined event");
                updateEventViewAttendance(eid, true);
            } else {
                console.log(result);
            }
        });
    }else{
        let url = '/api/event/' + eid + '/split/delete';
        let data = {sid: sid};

        apiPost(url, data, (result) => {
            if(result.success){
                console.log("Successfully left event");
                updateEventViewAttendance(eid, false);
            } else {
                console.log(result);
            }
        });
    
    }
}

function changeName(element){
    let name = element.value;
    let nameChangeCallback = () => {
        
    }

    changeProperty("name", name, nameChangeCallback);
}

function addUsers(){
    showDialog({
        title: "Add Users to Split",
        description: "User",
        type: "user",
        icon: "person_add",
        multiple: true,
        exclude: allUids,
        onchoose: () => {
            let url = "/api/groups/split/membership";

            current_dialog_data.selected.forEach((user) => {
                let data = {sid: sid, uid: user.uid};

                apiPost(url, data, (result) => {
                    if(result.success){
                        allUids.push(user.uid);
                        let addHTML = `<span class="medium user resolve-further" data-uid="${user.uid}" data-username="${user.full_name}">${user.full_name}</span>`
                        document.getElementById("split-members").innerHTML += addHTML;
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
        title: "Remove " + username + " from Split?",
        description: "Would you like to remove this user from the split? Unless this split is locked, the user will be able to rejoin the split at any time.",
        type: "buttons",
        icon: "person_remove",
        buttons: [
            {
                text: "Remove User",
                class: "button-main",
                background: "error-bg",
                onclick: () => {

                    let url = '/api/groups/split/membership/delete';
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
                text: "Keep User in Split",
                class: "button-alternate",
                onclick: () => {
                    hideDialog();
                }
            }
        ]
    });
    
}

function changeProperty(name, value, callback){
    let url = "/api/groups/split/";
    // managers should only have permission to control:
    // - icon
    // - color
    // - members (NON-manager)
    // - attending events
    let data = {sid: sid};
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