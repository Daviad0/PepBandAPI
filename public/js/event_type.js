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

function showError(element, message){
    if(!message){
        element.classList.add("no-display");
        element.innerHTML = "";
    }else{
        element.classList.remove("no-display");
        element.innerHTML = message;
    }
}

function editEventType(element){

    let error_span = document.querySelector(`span[data-etyid="${element.getAttribute("data-etyid")}"][name="error"]`);
    if(element.value == ""){
        element.classList.add("input-error");
        // get span with same uniq_name as element and the name as error
        
        
        showError(error_span, "Property cannot be empty! Please enter a value.");
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
            showError(error_span, "");
        }else{
            showError(error_span, result.message);
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