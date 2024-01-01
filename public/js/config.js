let configs = [];

let latest_created_config = null;




function updateConfigView(){

    let html = config_item_template;
    let selected_config = configs.find(c => c.uniq_name == latest_created_config);
    console.log(html);
    // gotta replace each detail with the new config info
    document.getElementById("config-list").innerHTML += html;
}

function getConfigs(){
    let url = "/api/global/config";
    apiGet(url, (result) => {
        configs = result.data;
        updateConfigView();
    })
}

function createConfig(){
    let uniq_name = document.getElementById("config-create-uniq_name").value;
    document.getElementById("config-create-uniq_name").value = "";

    let url = "/api/global/config/new";
    let data = {uniq_name: uniq_name};
    latest_created_config = uniq_name;

    apiPost(url, data, (result) => {
        if(result.success){
            getConfigs();
        }else{
            alert(result.message);
        }
    })
}

function editConfig(cid){

}