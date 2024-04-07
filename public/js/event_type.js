function updateEventTypeView(event_type){
    let html = null;
    if(event_type.icon.startsWith("IMAGE:")){
        html = event_type_item_template_image;
    }else{
        html = event_type_item_template_icon;
    }

    html = html.replaceAll("DEFAULT_ETYID", event_type.etyid);
    html = html.replaceAll("DEFAULT_NAME", event_type.name);
    html = html.replaceAll("DEFAULT_ICON", event_type.icon);
    html = html.replaceAll("DEFAULT_COLOR", event_type.color);

    document.getElementById("event-type-list").innerHTML += html;
}

function createEventType(){
    let button = document.getElementById("event-type-create");
    button.setAttribute("disabled", "disabled");

    let url = "/api/event/type/create";
    let data = {};

    apiPost(url, data, (result) => {
        if(result.success){
            updateEventTypeView(result.data[0]);
            button.removeAttribute("disabled");
        }else{
            button.removeAttribute("disabled");
        }
    })
}

function editEventType(element){

    let error_span = document.querySelector(`span[data-etyid="${element.getAttribute("data-etyid")}"][name="error"]`);
    if(element.value == ""){
        element.classList.add("input-error");
        // get span with same uniq_name as element and the name as error
        
        
        showGeneralError("Property cannot be empty!", "circle")
        return;
    }

    element.classList.remove("input-error");

    let etyid = element.getAttribute("data-etyid");
    var property = element.getAttribute("name");

    let url = "/api/event/type";
    let data = {etyid: etyid};
    data[property] = element.value;

    apiPost(url, data, (result) => {
        if(result.success){
            showGeneralError(null,null)
        }else{
            showGeneralError("Unexpected error occurred","emergency_home")
        }
    })
}

function deleteEventType(element){
    let etyid = element.getAttribute("data-etyid");

    let url = "/api/event/type/delete";
    let data = {etyid: etyid};

    apiPost(url, data, (result) => {
        if(result.success){
            let event_type = document.querySelector(`div[data-etyid="${etyid}"]`);
            event_type.remove();
        }
    })
}

function imageChoose(element){
    let etyid = element.getAttribute("data-etyid");

    showDialog({
        title: "Choose Image for Event Type",
        description: "Image",
        type: "image",
        icon: "delete",
        onchoose: () => {
        	// here, current_dialog_data has a selected property

            let image_viewer = document.querySelector("img[data-etyid='" + etyid + "'][name='icon_image']");
            image_viewer.removeAttribute("hidden");
            image_viewer.src = current_dialog_data.selected;
            let icon_viewer = document.querySelector("span[data-etyid='" + etyid + "'][name='icon_icon']");
            icon_viewer.classList.add("no-display");

            let hidden_image_value = document.querySelector("input[data-etyid='" + etyid + "'][name='icon']");
            hidden_image_value.value = current_dialog_data.selected;
            // trigger change event for hidden_icon_value
            hidden_icon_value.dispatchEvent(new Event("change"));

        	hideDialog();
        },
        extra: {}
    });

}

function iconChoose(element){
    let etyid = element.getAttribute("data-etyid");

    showDialog({
        title: "Choose Icon for Event Type",
        description: "Icon",
        type: "icon",
        icon: "delete",
        onchoose: () => {
        	// here, current_dialog_data has a selected property

            let image_viewer = document.querySelector("img[data-etyid='" + etyid + "'][name='icon_image']");
            image_viewer.classList.add("no-display");
            let icon_viewer = document.querySelector("span[data-etyid='" + etyid + "'][name='icon_icon']");
            icon_viewer.removeAttribute("hidden");
            icon_viewer.innerHTML = current_dialog_data.selected;

            let hidden_icon_value = document.querySelector("input[data-etyid='" + etyid + "'][name='icon']");
            hidden_icon_value.value = current_dialog_data.selected;
            // trigger change event for hidden_icon_value
            hidden_icon_value.dispatchEvent(new Event("change"));

        	hideDialog();
        },
        extra: {}
    });
}