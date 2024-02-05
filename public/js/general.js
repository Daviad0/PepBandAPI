// any general methods that should be shared across pages

function resolve(about, origValue, newValue, access){

    let elements = document.querySelectorAll(`span[data-about="${about}"][data-value="${origValue}"]`);

    // remove event listeners off of elements
    if(!access){
        // show a message about not having access to resolve further
        elements.forEach((element) => {
            element.innerHTML = `<span class="error">Permission Denied</span>`;
            element.classList.remove("resolve-further");
            element.onclick = null;
        })
    }else{
        elements.forEach((element) => {
            element.innerHTML = newValue;
            element.classList.remove("resolve-further");
            element.onclick = null;
        })
    }
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

function resolve_user(element){
    let uid = element.getAttribute("data-value");

    if(uid == "-1"){
        resolve("uid", uid, "Unknown User", true);
        return;
    }

    let url = "/api/identity/find/" + uid;
    apiGet(url, (result) => {
        if(result.success){
            resolve("uid", uid, result.data[0].full_name, true);
        }else{
            resolve("uid", uid, "Unknown User", false);
        }
    })
}





function sign_in_click(){
    showDialog({
        title: "Sign In Options",
        description: "Please choose a method to sign into the Husky Pep Band system. If you originally signed in with a certain method, you must use that method to sign in again!",
        icon: "group_add",
        buttons: [
            {
                text: "Michigan Tech ISO",
                class: "button-main",
                onclick: () => {
                    window.location.href = "/account/authenticate";
                }
            },
            {
                text: "Manual Sign In",
                class: "button-main",
                onclick: () => {
                    window.location.href = "/account/manual";
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

function log_out_click(){
    showDialog({
        title: "Log Out",
        description: "Are you sure you want to log out? You will not be able to log back into the system unless you have access to your original sign-in system!",
        icon: "door_open",
        buttons: [
            {
                text: "Log Out",
                class: "button-main",
                background: "error-bg",
                onclick: () => {
                    window.location.href = "/account/logout";
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





let current_dialog_data = {};

/**
 * "selected" property will contain selected songs in this format:
 * 
 * { soid: 1, soid_backup: "Song Name" }
 * 
 * "songs" property will contain all songs gotten from db
 * 
 * "multiple" property will be true if multiple songs can be selected
 * 
 * "onchoose" property will be a function that is called when the dialog is closed
 * 
 * "extra" property will be an object that is passed to the onchoose function
 */

/**
 * 
 * @param {object} properties
 * @param {string} properties.type
 * @param {string} properties.title
 * @param {string} properties.description
 * @param {string} properties.icon
 * @param {list} properties.buttons
 */
function showDialog(properties){ 


    current_dialog_data = {};

    let dialog_type = properties.type;
    if(dialog_type == undefined){
        dialog_type = "buttons";
    }

    var optionDivs = document.querySelectorAll('.dialog-option');
    for(let i = 0; i < optionDivs.length; i += 1){
        optionDivs[i].classList.add("no-display");
    }

    let selectedOptionDiv = document.querySelector(`.dialog-option[data-dialogtype="${dialog_type}"]`);
    selectedOptionDiv.classList.remove("no-display");

    let dialog_component = document.getElementById("dialog-component");
    let dialog_title = selectedOptionDiv.querySelector("#dialog-title");
    let dialog_description = selectedOptionDiv.querySelector("#dialog-description");
    let dialog_icon = selectedOptionDiv.querySelector("#dialog-icon");

    let title = "";
    let description = "";
    let icon = "";

    switch(dialog_type){
        case "buttons": 
            
            let dialog_buttons = selectedOptionDiv.querySelector("#dialog-buttons");

            title = properties.title;
            description = properties.description;
            icon = properties.icon;
            let buttons = properties.buttons;
        
            dialog_title.innerHTML = title;
            dialog_description.innerHTML = description;
            dialog_icon.innerHTML = icon;
        
            dialog_buttons.innerHTML = "";
            buttons.forEach((button) => {
                // expecting text, class, and onclick
                // background may be defined 
                let button_element = document.createElement("button");
                button_element.innerHTML = button.text;
                button_element.classList.add(button.class);
                button_element.classList.add("dialog-button");
                if(button.background){
                    button_element.classList.add(button.background);
                }
                button_element.onclick = button.onclick;
                dialog_buttons.appendChild(button_element);
            });
            break;
        case "inputs":
            let dialog_inputs = selectedOptionDiv.querySelector("#dialog-inputs");

            title = properties.title;
            description = properties.description;
            icon = properties.icon;
            let inputs = properties.inputs;

            dialog_title.innerHTML = title;
            dialog_description.innerHTML = description;
            dialog_icon.innerHTML = icon;

            dialog_inputs.innerHTML = "";
            inputs.forEach((input) => {
                // expecting text, class, and onclick
                // background may be defined 
                let input_element = `
                <div class="dialog-detail-item">
                    <div class="flex apart">
                        <span class="tiny dialog-detail-tag">Input Name</span>
                    </div>
                    <div class="flex apart">
                        <input type="text" class="input dialog-detail-value" placeholder="Act 1"/>
                    </div>
                </div>
                `;
                dialog_inputs.appendChild(input_element);
            });
            break;
        case "song":

            let dialog_buttons_static = selectedOptionDiv.querySelector("#dialog-buttons");
            dialog_buttons_static.innerHTML = "";
            title = properties.title;
            icon = properties.icon;

            dialog_title.innerHTML = title;
            dialog_icon.innerHTML = icon;

            current_dialog_data["multiple"] = properties.multiple || false;
            current_dialog_data["selected"] = [];
            current_dialog_data["onchoose"] = properties.onchoose || (() => {});
            current_dialog_data["extra"] = properties.extra || {};
            let preselectedButtons = [
                {
                    text: "Cancel",
                    class: "button-alternate",
                    onclick: () => {
                        hideDialog();
                    }
                },
                {
                    text: "Select",
                    class: "button-main",
                    onclick: () => {
                        current_dialog_data["onchoose"](current_dialog_data["selected"]);
                    }
                }
            ]

            preselectedButtons.forEach((button) => {
                // expecting text, class, and onclick
                // background may be defined 
                let button_element = document.createElement("button");
                if(button.text == "Select"){
                    button_element.setAttribute("disabled", "disabled");
                    button_element.setAttribute("id", "dialog-song-select");
                }
                button_element.innerHTML = button.text;
                button_element.classList.add(button.class);
                button_element.classList.add("dialog-button");
                if(button.background){
                    button_element.classList.add(button.background);
                }
                button_element.onclick = button.onclick;
                dialog_buttons_static.appendChild(button_element);
            });

            dialog_getSongs();
            break;
        case "icon":

            let dialog_buttons_static_icon = selectedOptionDiv.querySelector("#dialog-buttons");
            dialog_buttons_static_icon.innerHTML = "";
            title = properties.title;
            icon = properties.icon;

            let dialog_icon_input = selectedOptionDiv.querySelector("#dialog-icon-input");
            dialog_icon_input.value = "";
            current_dialog_data["onchoose"] = properties.onchoose || (() => {});
            current_dialog_data["selected"] = null;
            current_dialog_data["extra"] = properties.extra || {};
            let preselectedButtonsIcons = [
                {
                    text: "Cancel",
                    class: "button-alternate",
                    onclick: () => {
                        hideDialog();
                    }
                },
                {
                    text: "Select",
                    class: "button-main",
                    onclick: () => {
                        current_dialog_data["onchoose"](current_dialog_data["selected"]);
                    }
                }
            ]

            preselectedButtonsIcons.forEach((button) => {
                // expecting text, class, and onclick
                // background may be defined 
                let button_element = document.createElement("button");
                if(button.text == "Select"){
                    button_element.setAttribute("disabled", "disabled");
                    button_element.setAttribute("id", "dialog-icon-select");
                }
                button_element.innerHTML = button.text;
                button_element.classList.add(button.class);
                button_element.classList.add("dialog-button");
                if(button.background){
                    button_element.classList.add(button.background);
                }
                button_element.onclick = button.onclick;
                dialog_buttons_static_icon.appendChild(button_element);
            });

            
            break;
    }
    



    
    dialog_component.classList.remove("dialog-hide");
    dialog_component.classList.add("dialog-show");
    dialog_component.classList.remove("dialog-hidden");


}

function hideDialog(){
    let dialog_component = document.getElementById("dialog-component");
    let dialog_title = document.getElementById("dialog-title");
    let dialog_description = document.getElementById("dialog-description");
    let dialog_icon = document.getElementById("dialog-icon");

    let dialog_buttons = document.getElementById("dialog-buttons");

    dialog_component.classList.remove("dialog-show");
    dialog_component.classList.add("dialog-hide");
    setTimeout(() => {
        dialog_component.classList.add("dialog-hidden");
    }, 600);
}

function dialog_icon_changeIcon(element){
    let icon = element.value;
    let icon_preview = document.getElementById("dialog-icon-preview");
    icon_preview.innerHTML = icon;
    current_dialog_data["selected"] = icon;

    if(icon == ""){
        document.getElementById("dialog-icon-select").setAttribute("disabled", "disabled");
        return;
    }

    document.getElementById("dialog-icon-select").removeAttribute("disabled");

}

function dialog_song_toggleSelected(element){
    let soid = element.getAttribute("data-soid");

    if(current_dialog_data["selected"].find(s => s.soid == soid)){
        // remove from selected

        let index = current_dialog_data["selected"].findIndex(s => s.soid == soid);
        current_dialog_data["selected"].splice(index, 1);

        element.classList.remove("dialog-song-selected");

        if(current_dialog_data["selected"].length == 0){
            document.getElementById("dialog-song-select").setAttribute("disabled", "disabled");
        }
        return;
    }

    if(!current_dialog_data["multiple"]){
        // only one song can be selected
        let selected = document.querySelectorAll(".dialog-song-selected");
        selected.forEach((element) => {
            element.classList.remove("dialog-song-selected");
        })
        current_dialog_data["selected"] = [];
    }

    let song = {
        soid: soid,
        soid_backup: element.querySelector('strong[name="name"]').innerHTML
    }
    current_dialog_data["selected"].push(song);

    element.classList.add("dialog-song-selected");

    document.getElementById("dialog-song-select").removeAttribute("disabled");
}

function dialog_song_changeSearch(){
    let name = document.getElementById("dialog-song-search-name").value;
    let artist = document.getElementById("dialog-song-search-artist").value;
    let category = document.getElementById("dialog-song-search-category").value;

    let songs = current_dialog_data["songs"];
    // hide songs that don't match the filter
    for(let i = 0; i < songs.length; i += 1){
        let song = songs[i];

        if(song.artist == null) song.artist = "";
        if(song.name == null) song.name = "";
        let songElement = document.querySelector(`.dialog-song[data-soid="${song.soid}"]`);



        if(song.name.toLowerCase().includes(name.toLowerCase()) && song.artist.toLowerCase().includes(artist.toLowerCase()) && (category == "any" || song.category == category)){
            songElement.classList.remove("no-display");
        }else{
            songElement.classList.add("no-display");
        }
    
    }
}

function dialog_getSongs(){
    let url = "/api/song/list";
    let dialog_songs = document.getElementById("dialog-song-parent");
    let categoryMappings = {
        "regular": "graphic_eq",
        "quick": "speed",
        "null": "help"
    }
    apiGet(url, (result) => {
        if(result.success){
            let songs = result.data;
            current_dialog_data["songs"] = songs;
            dialog_songs.innerHTML = "";
            songs.forEach((song) => {
                let option = document.createElement("div");
                option.classList.add("floating-box");
                option.classList.add("dialog-song");

                option.setAttribute("data-soid", song.soid);
                option.onclick = () => {
                    dialog_song_toggleSelected(option);
                }

                option.innerHTML = `
                <div class="flex center">
                    
                    <div class="fill">
                        <div class="flex apart">
                            <span class="small"><strong name="name">${song.name}</strong></span>
                            <span class="medium material-symbols-rounded">${categoryMappings[song.category]}</span>
                        </div>
                        <div class="spacing">
                            <span class="tiny">By ${song.artist == null ? "Unknown" : song.artist}</span>
                            <span class="tiny"><i>${song.modification == null ? "No Modification" : song.modification}</i></span>
                        </div>
                        
                    </div>
                
                </div>
                
                


                `



                dialog_songs.appendChild(option);
            })
        }else{
            console.log(result);
        }
    })
}