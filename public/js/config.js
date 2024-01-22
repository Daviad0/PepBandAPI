let configs = [];

let latest_created_config = null;

// config_item_template is defined by EJS in config.ejs


function updateConfigView(selected_config){

    let html = null;
    if(selected_config.type == "string"){
        html = config_item_template_string;
    }
    else if(selected_config.type == "number"){
        html = config_item_template_number;
    }
    else if(selected_config.type == "boolean"){
        html = config_item_template_boolean;
    }
    else if(selected_config.type == "date"){
        html = config_item_template_date;
    }
    else if(selected_config.type == "datetime"){
        html = config_item_template_datetime;
    }


    html = html.replaceAll("DEFAULT_CID", selected_config.cid);
    html = html.replaceAll("DEFAULT_UNIQ_NAME", selected_config.uniq_name);
    html = html.replaceAll("DEFAULT_NAME", selected_config.name);
    html = html.replaceAll("DEFAULT_VALUE", selected_config.value);
    html = html.replaceAll("DEFAULT_UID", selected_config.uid);


    // gotta replace each detail with the new config info
    document.getElementById("config-list").innerHTML += html;
}

function createConfig(){
    let uniq_name = document.getElementById("config-create-uniq_name").value;
    let type = document.getElementById("config-create-type").value;
    let button = document.getElementById("config-create");
    button.setAttribute("disabled", "disabled");
    
    if(uniq_name == ""){
        document.getElementById("config-create-uniq_name").classList.add("input-error");
        button.removeAttribute("disabled");
        return;
    }
    if(type == ""){
        document.getElementById("config-create-type").classList.add("input-error");
        button.removeAttribute("disabled");
        return;
    }

    let url = "/api/global/config/new";
    let data = {uniq_name: uniq_name, type: type};
    latest_created_config = uniq_name;

    apiPost(url, data, (result) => {
        if(result.success){
            updateConfigView(result.data[0]);
            document.getElementById("config-create-uniq_name").value = "";
            document.getElementById("config-create-uniq_name").classList.remove("input-error");
            document.getElementById("config-create-type").value = "";
            button.removeAttribute("disabled");
        }else{
            document.getElementById("config-create-uniq_name").classList.add("input-error");
            document.getElementById("config-create-type").classList.add("input-error");
            button.removeAttribute("disabled");
        }
    })
}

function editConfig(element){

    let error_span = document.querySelector(`span[data-uniq_name="${element.getAttribute("data-uniq_name")}"][name="error"]`);
    if(element.value == ""){
        element.classList.add("input-error");
        // get span with same uniq_name as element and the name as error
        
        
        showError(error_span, "Property cannot be empty! Please enter a value.");
        return;
    }

    element.classList.remove("input-error");


    var uniq_name = element.getAttribute("data-uniq_name");
    var property = element.getAttribute("name");

    let url = "/api/global/config";
    let data = {uniq_name: uniq_name};
    data[property] = element.value;

    apiPost(url, data, (result) => {
        if(result.success){
            // do nothing

            showError(error_span, null);
        }else{
            element.classList.add("input-error");
            showError(error_span, "An unexpected error occurred while saving the configuration change!");
        }
    })
}

function deleteConfig(element){
    let uniq_name = element.getAttribute("data-uniq_name");
    let error_span = document.querySelector(`span[data-uniq_name="${element.getAttribute("data-uniq_name")}"][name="error"]`);

    showDialog({
        title: "Remove Critical Configuration",
        description: "You are attempting to remove configuration from this website that could impact users' ability to use this application. Please confirm that you want to remove this configuration.",
        icon: "destruction",
        buttons: [
            {
                text: "Remove Configuration",
                class: "button-main",
                background: "error-bg",
                onclick: () => {

                    let url = `/api/global/config/${uniq_name}/delete`;
                    let data = {};

                    apiPost(url, data, (result) => {
                        if(result.success){

                            // remove the element from the DOM (div with class config-item and data-uniq_name of uniq_name)
                            let config_item = document.querySelector(`div[data-uniq_name="${uniq_name}"]`);
                            config_item.remove();
                        }else{
                            if(!result.message){
                                showError(error_span, "An unexpected error occurred while deleting the configuration!");
                            }else{
                                showError(error_span, result.message);
                            }
                            
                        }
                    })

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
    })

    
}