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
    let name = document.getElementById("split-create-name").value;

    let button = document.getElementById("split-create");
    button.setAttribute("disabled", "disabled");

    if(name == ""){
        document.getElementById("split-create-name").classList.add("input-error");
        button.removeAttribute("disabled");
        return;
    }

    let url = "/api/groups/splut/create";
    let data = {name: name};

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

    let url = "/api/groups/splut/";
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

    let url = "/api/groups/splut/" + sid + "/delete";
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