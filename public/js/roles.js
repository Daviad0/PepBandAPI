function updateRoleView(selected_role){
    let html = null;
    html = role_item_template_safe;

    html = html.replaceAll("DEFAULT_RID", selected_role.rid);
    html = html.replaceAll("DEFAULT_NAME", selected_role.name);
    html = html.replaceAll("DEFAULT_POWER", selected_role.power);
    html = html.replaceAll("DEFAULT_DESCRIPTION", selected_role.description);
    html = html.replaceAll("DEFAULT_ICON", selected_role.icon);
    html = html.replaceAll("DEFAULT_USER_COUNT", 0);

    document.getElementById("role-list").innerHTML += html;
}

function createRole(){
    let name = document.getElementById("role-create-name").value;

    let button = document.getElementById("role-create");
    button.setAttribute("disabled", "disabled");

    if(name == ""){
        document.getElementById("role-create-name").classList.add("input-error");
        button.removeAttribute("disabled");
        showGeneralError("Role name is required!", "add");
        return;
    }

    let url = "/api/identity/roles/create";
    let data = {name: name};

    apiPost(url, data, (result) => {
        if(result.success){
            updateRoleView(result.data[0]);
            document.getElementById("role-create-name").value = "";
            document.getElementById("role-create-name").classList.remove("input-error");
            button.removeAttribute("disabled");

            // default role option add
            let option = document.createElement("option");
            option.value = result.data[0].rid;
            option.innerHTML = result.data[0].name;
            document.getElementById("role-default-role").appendChild(option);
        }else{
            document.getElementById("role-create-name").classList.add("input-error");
            button.removeAttribute("disabled");
        }
    });
}


function editRole(element){
    let error_span = document.querySelector(`span[data-rid="${element.getAttribute("data-rid")}"][name="error"]`);

    if(element.value == ""){
        element.classList.add("input-error");
        showGeneralError("Property cannot be empty!", "circle");
        return;
    }
    element.classList.remove("input-error");

    let rid = element.getAttribute("data-rid");
    var property = element.getAttribute("name");

    let url = "/api/identity/roles/";
    let data = {rid: rid};
    data[property] = element.value;

    apiPost(url, data, (result) => {
        if(result.success){
            showGeneralError(null,null)
        }else{
            element.classList.add("input-error");
            showGeneralError("Unexpected error occurred","emergency_home")
        }
    });
}

function deleteRole(element){
    let rid = element.getAttribute("data-rid");
    let error_span = document.querySelector(`span[data-rid="${rid}"][name="error"]`);

    let url = "/api/identity/roles/" + rid + "/delete";
    let data = {rid: rid};

    apiPost(url, data, (result) => {
        if(result.success){
            let role_item = document.querySelector(`div[data-rid="${rid}"]`);
            role_item.remove();
            // remove from default role option
            let option = document.querySelector(`option[value="${rid}"]`);
            option.remove();
        }else{
            if(result.message){
                showGeneralError(result.message, "emergency_home");
            }
            else{
                showGeneralError("Unexpected error occurred","emergency_home");
            }
        }
    });
}

function setConfig_defaultRole(element){
    let rid = element.value;

    let uniq_name = "registered_default_rid_mtu";
    let type = "number";
    let name = "Default Role";

    let url = "/api/global/config";
    let data = {uniq_name: uniq_name, value: rid, type: type, name: name};

    apiPost(url, data, (result) => {
        if(result.success){
            element.classList.remove("input-error");
        }else{
            element.classList.add("input-error");
        }
    });
}

function imageChoose(element){
    let rid = element.getAttribute("data-rid");

    showDialog({
        title: "Choose Image for Role",
        description: "Image",
        type: "image",
        icon: "delete",
        onchoose: (url) => {
        	// here, current_dialog_data has a selected property
            let hidden_image_value = document.querySelector("input[data-rid='" + rid + "'][name='icon']");
            setIconSection("IMAGE:" + url, "rid", rid, hidden_image_value);

        	hideDialog();
        },
        extra: {}
    });

}

function iconChoose(element){
    let rid = element.getAttribute("data-rid");

    showDialog({
        title: "Choose Icon for Event Type",
        description: "Icon",
        type: "icon",
        icon: "delete",
        onchoose: () => {
        	// here, current_dialog_data has a selected property

            let hidden_icon_value = document.querySelector("input[data-rid='" + rid + "'][name='icon']");
            setIconSection(current_dialog_data["selected"][0], "rid", rid, hidden_icon_value);

        	hideDialog();
        },
        extra: {}
    });
}

function addPermission(element){
    let rid = element.getAttribute("data-rid");

    let currentPermissions = document.querySelectorAll(`.permissions[data-rid="${rid}"] .permission`);
    let currentPermissionNames = [];
    currentPermissions.forEach((permission) => {
        currentPermissionNames.push(permission.getAttribute("data-permission"));
    });
    
    showDialog({
        title: "Add Permission(s) to Role",
        description: "Permission",
        type: "permission",
        icon: "person_add",
        exclude: currentPermissionNames,
        multiple: true,
        onchoose: () => {
            let url = "/api/identity/roles/" + rid + "/permission";

            let permissions = document.querySelector(`.permissions[data-rid="${rid}"]`);

            current_dialog_data.selected.forEach((permission) => {
                permissions.innerHTML += `<span class="tiny config-detail-value config-main-info resolve-further permission" data-permission="${permission.permission_uniq_name}" data-rid="${rid}" onclick="removePermission(this)">${permission.permission_uniq_name}</span>`;
            
                let data = {permission: permission.permission_uniq_name, rid: rid};

                apiPost(url, data, (result) => {
                    if(result.success){
                        
                    }
                });
            });


            // swap this last element with the add button
            let addPermissionButton = document.querySelector(`.permission-add[data-rid="${rid}"]`);
            // remove the original add button and move it to the end
            addPermissionButton.remove();
            permissions.appendChild(addPermissionButton);
            

            hideDialog();
        },
    })
}

function removePermission(element){
    let permission = element.getAttribute("data-permission");
    let rid = element.getAttribute("data-rid");



    
    showDialog({
        title: "Remove " + permission + " from Role?",
        description: "Are you sure that you want to remove " + permission + " from this role? All users with this role will no longer be able to access any links, buttons, or other features that require this permission.",
        icon: "delete",
        type: "urgent_buttons",
        lottie: "/lotties/BreakingActionEdit.json",
        buttons: [
            {
                text: "Remove Permission",
                class: "button-main",
                background: "error-bg",
                onclick: () => {
                    
                    let url = "/api/identity/roles/" + rid + "/permission/delete";
                    let data = {permission: permission};

                    apiPost(url, data, (result) => {
                        if(result.success){
                            let permissions = document.querySelector(`.permissions[data-rid="${rid}"]`);
                            element.remove();
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