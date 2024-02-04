function updateGroupView(selected_group){
    let html = null;
    html = group_item_template_0;

    html = html.replaceAll("DEFAULT_GID", selected_group.gid);
    html = html.replaceAll("DEFAULT_NAME", selected_group.name);
    html = html.replaceAll("DEFAULT_ICON", selected_group.icon);
    html = html.replaceAll("DEFAULT_DESCRIPTION", selected_group.description);
    html = html.replaceAll("DEFAULT_UIDPRIMARY", selected_group.description);



    

    document.getElementById("group-list").innerHTML += html;
}

function createGroup(){
    let name = document.getElementById("group-create-name").value;

    let button = document.getElementById("group-create");
    button.setAttribute("disabled", "disabled");

    if(name == ""){
        document.getElementById("group-create-name").classList.add("input-error");
        button.removeAttribute("disabled");
        return;
    }

    let url = "/api/groups/group/create";
    let data = {name: name};

    apiPost(url, data, (result) => {
        if(result.success){
            updateGroupView(result.data[0]);
            document.getElementById("group-create-name").value = "";
            document.getElementById("group-create-name").classList.remove("input-error");
            button.removeAttribute("disabled");

            // default group option add
            let option = document.createElement("option");
            option.value = result.data[0].gid;
            option.innerHTML = result.data[0].name;
            document.getElementById("group-default-group").appendChild(option);
        }else{
            document.getElementById("group-create-name").classList.add("input-error");
            button.removeAttribute("disabled");
        }
    });
}


function editGroup(element){
    let error_span = document.querySelector(`span[data-gid="${element.getAttribute("data-gid")}"][name="error"]`);

    if(element.value == ""){
        element.classList.add("input-error");
        showError(error_span, "Property cannot be empty");
        return;
    }
    element.classList.remove("input-error");

    let gid = element.getAttribute("data-gid");
    var property = element.getAttribute("name");

    let url = "/api/groups/group/";
    let data = {gid: gid};
    data[property] = element.value;

    apiPost(url, data, (result) => {
        if(result.success){
            showError(error_span, "");
        }else{
            element.classList.add("input-error");
            showError(error_span, "Error updating group");
        }
    });
}

function deleteGroup(element){
    let gid = element.getAttribute("data-gid");
    let error_span = document.querySelector(`span[data-gid="${gid}"][name="error"]`);

    let url = "/api/groups/group/" + gid + "/delete";
    let data = {gid: gid};

    apiPost(url, data, (result) => {
        if(result.success){
            let group_item = document.querySelector(`div[data-gid="${gid}"]`);
            group_item.remove();
            // remove from default group option
            let option = document.querySelector(`option[value="${gid}"]`);
            option.remove();
        }else{
            if(result.message){
                showError(error_span, result.message);
            }
            else{
                showError(error_span, "Error deleting group");
            }
        }
    });
}

function setConfig_defaultGroup(element){
    let gid = element.value;

    let uniq_name = "registered_default_gid_mtu";
    let type = "number";
    let name = "Default Group";

    let url = "/api/global/config";
    let data = {uniq_name: uniq_name, value: gid, type: type, name: name};

    apiPost(url, data, (result) => {
        if(result.success){
            element.classList.remove("input-error");
        }else{
            element.classList.add("input-error");
        }
    });
}

function imageChoose(element){
    let gid = element.getAttribute("data-gid");

    showDialog({
        title: "Choose Image for Group",
        description: "Image",
        type: "image",
        icon: "delete",
        onchoose: () => {
        	// here, current_dialog_data has a selected property

            let image_viewer = document.querySelector("img[data-gid='" + gid + "'][name='icon_image']");
            image_viewer.removeAttribute("hidden");
            image_viewer.src = current_dialog_data.selected;
            let icon_viewer = document.querySelector("span[data-gid='" + gid + "'][name='icon_icon']");
            icon_viewer.classList.add("no-display");

            let hidden_image_value = document.querySelector("input[data-gid='" + gid + "'][name='icon']");
            hidden_image_value.value = current_dialog_data.selected;
            // trigger change event for hidden_icon_value
            hidden_icon_value.dispatchEvent(new Event("change"));

        	hideDialog();
        },
        extra: {}
    });

}

function iconChoose(element){
    let gid = element.getAttribute("data-gid");

    showDialog({
        title: "Choose Icon for Event Type",
        description: "Icon",
        type: "icon",
        icon: "delete",
        onchoose: () => {
        	// here, current_dialog_data has a selected property

            let image_viewer = document.querySelector("img[data-gid='" + gid + "'][name='icon_image']");
            image_viewer.classList.add("no-display");
            let icon_viewer = document.querySelector("span[data-gid='" + gid + "'][name='icon_icon']");
            icon_viewer.removeAttribute("hidden");
            icon_viewer.innerHTML = current_dialog_data.selected;

            let hidden_icon_value = document.querySelector("input[data-gid='" + gid + "'][name='icon']");
            hidden_icon_value.value = current_dialog_data.selected;
            // trigger change event for hidden_icon_value
            hidden_icon_value.dispatchEvent(new Event("change"));

        	hideDialog();
        },
        extra: {}
    });
}