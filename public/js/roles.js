function updateRoleView(selected_role){
    let html = null;
    html = role_item_template_safe;

    html = html.replaceAll("DEFAULT_RID", selected_role.rid);
    html = html.replaceAll("DEFAULT_NAME", selected_role.name);
    html = html.replaceAll("DEFAULT_PERMISSION", selected_role.permission);
    html = html.replaceAll("DEFAULT_DESCRIPTION", selected_role.description);
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
        return;
    }

    let url = "/api/identity/roles/new";
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

function showError(element, message){
    if(!message){
        element.classList.add("no-display");
        element.innerHTML = "";
    }else{
        element.classList.remove("no-display");
        element.innerHTML = message;
    }
}

function editRole(element){
    let error_span = document.querySelector(`span[data-rid="${element.getAttribute("data-rid")}"][name="error"]`);

    if(element.value == ""){
        element.classList.add("input-error");
        showError(error_span, "Property cannot be empty");
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
            showError(error_span, "");
        }else{
            element.classList.add("input-error");
            showError(error_span, "Error updating role");
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
                showError(error_span, result.message);
            }
            else{
                showError(error_span, "Error deleting role");
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