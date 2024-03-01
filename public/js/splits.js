function updateSplitView(selected_split){
    let html = null;
    html = split_item_template_0;

    html = html.replaceAll("DEFAULT_SID", selected_split.sid);
    html = html.replaceAll("DEFAULT_GID", selected_split.gid);
    html = html.replaceAll("DEFAULT_NAME", selected_split.name);
    html = html.replaceAll("DEFAULT_ICON", selected_split.icon);
    html = html.replaceAll("DEFAULT_DESCRIPTION", selected_split.description);
    html = html.replaceAll("DEFAULT_UIDPRIMARY", selected_split.description);



    

    document.getElementById("split-list").innerHTML += html;
}

function createSplit(){
    document.getElementById("split-create-name").classList.remove("input-error");
    let name = document.getElementById("split-create-name").value;
    let gid = document.getElementById("split-create-gid").value;
    let button = document.getElementById("split-create");
    button.setAttribute("disabled", "disabled");

    if(name == ""){
        document.getElementById("split-create-name").classList.add("input-error");
        button.removeAttribute("disabled");
        return;
    }

    let url = "/api/groups/split/create";
    let data = {name: name, gid: gid};

    apiPost(url, data, (result) => {
        if(result.success){
            updateSplitView(result.data[0]);
            document.getElementById("split-create-name").value = "";
            document.getElementById("split-create-name").classList.remove("input-error");
            button.removeAttribute("disabled");

            // default split option add
            let option = document.createElement("option");
            option.value = result.data[0].sid;
            option.innerHTML = result.data[0].name;
            document.getElementById("split-default-split").appendChild(option);
        }else{
            document.getElementById("split-create-name").classList.add("input-error");
            button.removeAttribute("disabled");
        }
    });
}


function editSplit(element){
    let error_span = document.querySelector(`span[data-sid="${element.getAttribute("data-sid")}"][name="error"]`);

    if(element.value == ""){
        element.classList.add("input-error");
        showError(error_span, "Property cannot be empty");
        return;
    }
    element.classList.remove("input-error");

    let sid = element.getAttribute("data-sid");
    var property = element.getAttribute("name");

    let url = "/api/groups/split/";
    let data = {sid: sid};
    data[property] = element.value;

    apiPost(url, data, (result) => {
        if(result.success){
            showError(error_span, "");
        }else{
            element.classList.add("input-error");
            showError(error_span, "Error updating split");
        }
    });
}

function deleteSplit(element){

    let sid = element.getAttribute("data-sid");
    let error_span = document.querySelector(`span[data-sid="${sid}"][name="error"]`);

    showDialog({
        title: "Are You Sure?",
        description: "Deleting a split will remove it from all groups and events that use it. This action cannot be undone. If you would like to remove the ability to join this split, you can always change the status of the split to be not open! Are you sure you want to continue?",
        type: "buttons",
        icon: "delete",
        buttons: [
            {
                text: "Delete Split",
                class: "button-main",
                background: "error-bg",
                onclick: () => {
                    let url = "/api/groups/split/" + sid + "/delete";
                    let data = {sid: sid};

                    apiPost(url, data, (result) => {
                        if(result.success){
                            let split_item = document.querySelector(`div[data-sid="${sid}"]`);
                            split_item.remove();
                            // remove from default split option
                            let option = document.querySelector(`option[value="${sid}"]`);
                            option.remove();
                        }else{
                            if(result.message){
                                showError(error_span, result.message);
                            }
                            else{
                                showError(error_span, "Error deleting split");
                            }
                        }
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
    });
    
    

    
}



function editSplitCheckbox(element){
    element.value = element.checked ? true : false;
    editSplit(element);
}


function setConfig_defaultSplit(element){
    let sid = element.value;

    let uniq_name = "registered_default_sid_mtu";
    let type = "number";
    let name = "Default Split";

    let url = "/api/global/config";
    let data = {uniq_name: uniq_name, value: sid, type: type, name: name};

    apiPost(url, data, (result) => {
        if(result.success){
            element.classList.remove("input-error");
        }else{
            element.classList.add("input-error");
        }
    });
}

function imageChoose(element){
    let sid = element.getAttribute("data-sid");

    showDialog({
        title: "Choose Image for Split",
        description: "Image",
        type: "image",
        icon: "delete",
        onchoose: () => {
        	// here, current_dialog_data has a selected property

            let image_viewer = document.querySelector("img[data-sid='" + sid + "'][name='icon_image']");
            image_viewer.removeAttribute("hidden");
            image_viewer.src = current_dialog_data.selected;
            let icon_viewer = document.querySelector("span[data-sid='" + sid + "'][name='icon_icon']");
            icon_viewer.classList.add("no-display");

            let hidden_image_value = document.querySelector("input[data-sid='" + sid + "'][name='icon']");
            hidden_image_value.value = current_dialog_data.selected;
            // trigger change event for hidden_icon_value
            hidden_icon_value.dispatchEvent(new Event("change"));

        	hideDialog();
        },
        extra: {}
    });

}

function updateSplitFilter(){
    let filter = document.getElementById("split-filter-gid").value;

    let splits = document.querySelectorAll(".split-view");
    let splitGroupSelectors = document.querySelectorAll(".linked-group");

    splitGroupSelectors.forEach((element) => {
        let selectedGid = element.value;
        if(selectedGid == filter || filter == "all"){
            element.classList.remove("no-display");
        }
        else{
            element.classList.add("no-display");
        }
    });
}

function iconChoose(element){
    let sid = element.getAttribute("data-sid");

    showDialog({
        title: "Choose Icon for Split",
        description: "Icon",
        type: "icon",
        icon: "delete",
        onchoose: () => {
        	// here, current_dialog_data has a selected property

            let image_viewer = document.querySelector("img[data-sid='" + sid + "'][name='icon_image']");
            image_viewer.classList.add("no-display");
            let icon_viewer = document.querySelector("span[data-sid='" + sid + "'][name='icon_icon']");
            icon_viewer.removeAttribute("hidden");
            icon_viewer.innerHTML = current_dialog_data.selected;

            let hidden_icon_value = document.querySelector("input[data-sid='" + sid + "'][name='icon']");
            hidden_icon_value.value = current_dialog_data.selected;
            // trigger change event for hidden_icon_value
            hidden_icon_value.dispatchEvent(new Event("change"));

        	hideDialog();
        },
        extra: {}
    });
}

function removeManager(element){
    let uid = element.getAttribute("data-uid");
    let gid = element.getAttribute("data-gid");

    let full_name = element.innerHTML;

    
    showDialog({
        title: "Remove " + full_name + " as Manager?",
        description: "Would you like to continue removing " + full_name + " as a manager of this group? The user will retain any permissions that they have from their role and will remain in other groups, but will not be able to manage this specific group if they don't already have permissions.",
        type: "buttons",
        icon: "delete",
        buttons: [
            {
                text: "Remove User from Group",
                class: "button-main",
                background: "error-bg",
                onclick: () => {
                    
                    let url = "/api/groups/group/membership/delete";
                    let data = {uid: uid, gid: gid};

                    apiPost(url, data, (result) => {
                        if(result.success){
                            let groupManagers = document.querySelector(`.managers[data-gid="${gid}"]`);
                            let manager = groupManagers.querySelector(`.manager[data-uid="${uid}"]`);
                            manager.remove();
                            // add the add button back to the end
                            let addManagerButton = document.querySelector(`.manager-add[data-gid="${gid}"]`);
                            groupManagers.appendChild(addManagerButton);
                        }
                    });

                    hideDialog();

                }
            },
            {
                text: "Remove User as Manager",
                class: "button-main",
                background: "error-bg",
                onclick: () => {
                   
                    let url = "/api/groups/group/membership";
                    let data = {uid: uid, gid: gid, elevated: false};

                    apiPost(url, data, (result) => {
                        if(result.success){
                            let groupManagers = document.querySelector(`.managers[data-gid="${gid}"]`);
                            let manager = groupManagers.querySelector(`.manager[data-uid="${uid}"]`);
                            manager.remove();
                            // add the add button back to the end
                            let addManagerButton = document.querySelector(`.manager-add[data-gid="${gid}"]`);
                            groupManagers.appendChild(addManagerButton);
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
    });
}

function addManager(element){
    let gid = element.getAttribute("data-gid");
    
    showDialog({
        title: "Add Manager to Group",
        description: "User",
        type: "user",
        icon: "person_add",
        multiple: false,
        onchoose: () => {
            let url = "/api/groups/group/membership";

            let groupManagers = document.querySelector(`.managers[data-gid="${gid}"]`);
            groupManagers.innerHTML += `<span class="tiny config-detail-value config-main-info resolve-further manager" data-uid="${current_dialog_data.selected[0].uid}" data-gid="${gid}" onclick="removeManager(this)">${current_dialog_data.selected[0].full_name}</span>`;

            // swap this last element with the add button
            let addManagerButton = document.querySelector(`.manager-add[data-gid="${gid}"]`);
            // remove the original add button and move it to the end
            addManagerButton.remove();
            groupManagers.appendChild(addManagerButton);



            let data = {uid: current_dialog_data.selected[0].uid, gid: gid, elevated: true};

            apiPost(url, data, (result) => {
                if(result.success){
                    
                }
            });

            hideDialog();
        },
    })
}

function iconChoose(element){
    let sid = element.getAttribute("data-sid");

    showDialog({
        title: "Choose Icon for Event Type",
        description: "Icon",
        type: "icon",
        icon: "delete",
        onchoose: () => {
        	// here, current_dialog_data has a selected property

            let image_viewer = document.querySelector("img[data-sid='" + sid + "'][name='icon_image']");
            image_viewer.classList.add("no-display");
            let icon_viewer = document.querySelector("span[data-sid='" + sid + "'][name='icon_icon']");
            icon_viewer.removeAttribute("hidden");
            icon_viewer.innerHTML = current_dialog_data.selected;

            let hidden_icon_value = document.querySelector("input[data-sid='" + sid + "'][name='icon']");
            hidden_icon_value.value = current_dialog_data.selected;
            // trigger change event for hidden_icon_value
            hidden_icon_value.dispatchEvent(new Event("change"));

        	hideDialog();
        },
        extra: {}
    });
}

function removeManager(element){
    let uid = element.getAttribute("data-uid");
    let sid = element.getAttribute("data-sid");

    let full_name = element.innerHTML;

    
    showDialog({
        title: "Remove " + full_name + " as Manager?",
        description: "Would you like to continue removing " + full_name + " as a manager of this group? The user will retain any permissions that they have from their role and will remain in other groups, but will not be able to manage this specific group if they don't already have permissions.",
        type: "buttons",
        icon: "delete",
        buttons: [
            {
                text: "Remove User from Group",
                class: "button-main",
                background: "error-bg",
                onclick: () => {
                    
                    let url = "/api/groups/split/membership/delete";
                    let data = {uid: uid, sid: sid};

                    apiPost(url, data, (result) => {
                        if(result.success){
                            let splitManagers = document.querySelector(`.managers[data-sid="${sid}"]`);
                            let manager = splitManagers.querySelector(`.manager[data-uid="${uid}"]`);
                            manager.remove();
                            // add the add button back to the end
                            let addManagerButton = document.querySelector(`.manager-add[data-sid="${sid}"]`);
                            splitManagers.appendChild(addManagerButton);
                        }
                    });

                    hideDialog();

                }
            },
            {
                text: "Remove User as Manager",
                class: "button-main",
                background: "error-bg",
                onclick: () => {
                   
                    let url = "/api/groups/split/membership";
                    let data = {uid: uid, sid: sid, elevated: false};

                    apiPost(url, data, (result) => {
                        if(result.success){
                            let splitManagers = document.querySelector(`.managers[data-sid="${sid}"]`);
                            let manager = splitManagers.querySelector(`.manager[data-uid="${uid}"]`);
                            manager.remove();
                            // add the add button back to the end
                            let addManagerButton = document.querySelector(`.manager-add[data-sid="${sid}"]`);
                            splitManagers.appendChild(addManagerButton);
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
    });
}

function addManager(element){
    let sid = element.getAttribute("data-sid");
    
    showDialog({
        title: "Add Manager to Group",
        description: "User",
        type: "user",
        icon: "person_add",
        multiple: false,
        onchoose: () => {
            let url = "/api/groups/split/membership";

            let splitManagers = document.querySelector(`.managers[data-sid="${sid}"]`);
            splitManagers.innerHTML += `<span class="tiny config-detail-value config-main-info resolve-further manager" data-uid="${current_dialog_data.selected[0].uid}" data-sid="${sid}" onclick="removeManager(this)">${current_dialog_data.selected[0].full_name}</span>`;

            // swap this last element with the add button
            let addManagerButton = document.querySelector(`.manager-add[data-sid="${sid}"]`);
            // remove the original add button and move it to the end
            addManagerButton.remove();
            splitManagers.appendChild(addManagerButton);



            let data = {uid: current_dialog_data.selected[0].uid, sid: sid, elevated: true};

            apiPost(url, data, (result) => {
                if(result.success){
                    
                }
            });

            hideDialog();
        },
    })
}