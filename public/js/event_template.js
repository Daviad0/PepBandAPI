function generateRandomSegmentId(){
    // the segment id is just required to be unique, but does not have to follow database standards

    // generate random 8 character string
    let characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let output = "";
    for(let i = 0; i < 8; i++){
        output += characters[Math.floor(Math.random() * characters.length)];
    }
    return output;
}

function editSegmentProperty(element){
    let segid = element.getAttribute("data-segid");
    let property = element.getAttribute("name");
    let value = element.value;

    let segment = dataStructure.segments.find((element) => element.segid == segid);
    if(!segment) return;

    segment[property] = value;
    // update view

    changeSaveButtonState(false);
}


function changeSaveButtonState(disable){
    let button = document.getElementById("save-event-template");
    if(disable){
        button.setAttribute("disabled", "disabled");
    }
    else{
        button.removeAttribute("disabled");
    }
}

function saveTemplateStructure(){
    let newTemplateData = JSON.stringify(dataStructure);
    let error_span = document.querySelector(`span[name="error"]`);
    let property = "data";

    let url = "/api/event/template";
    let data = {etid: usingEtid};
    data[property] = newTemplateData;
    changeSaveButtonState(true);

    apiPost(url, data, (result) => {
        if(result.success){
            // do nothing
            
            showError(error_span, null);
        }else{
            changeSaveButtonState(false);
            showError(error_span, "An unexpected error occurred while saving the configuration change!");
        }
    })

}

function editTemplate(element){

    let error_span = document.querySelector(`span[name="error"]`);
    if(element.value == ""){
        element.classList.add("input-error");
        // get span with same uniq_name as element and the name as error
        
        
        showError(error_span, "Property cannot be empty! Please enter a value.");
        return;
    }

    element.classList.remove("input-error");

    var property = element.getAttribute("name");

    let url = "/api/event/template";
    let data = {etid: usingEtid};
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

function addSegmentToView(segment){
    let html = segment_template;

    html = html.replaceAll("DEFAULT_SEGID", segment.segid);
    html = html.replaceAll("DEFAULT_NAME", segment.name);
    html = html.replaceAll("DEFAULT_DESCRIPTION", segment.description);
    html = html.replaceAll("DEFAULT_SLOTS", segment.slots);
    html = html.replaceAll("DEFAULT_IDEALTIME", segment.idealTime);
    html = html.replaceAll("DEFAULT_NOTIFYONCHANGE", segment.notifyOnChange);

    document.getElementById("segment-list").innerHTML += html;

    // scroll to the new segment

    let newSegment = document.querySelector(`div[name="segment"][data-segid="${segment.segid}"]`);
    let topPos = newSegment.offsetTop;

    document.getElementById("segment-list").scrollTop = topPos;
}

function initializeSlots(){
    // only to be called once, when the page is loaded

    let orig_value = document.getElementById("event-template-type").dataset.origvalue;
    if(orig_value != "" && orig_value != null){
        document.getElementById("event-template-type").value = orig_value;
    }

    dataStructure.segments.forEach((segment) => {
        // loop through each songIndex to see if there is a default

        segment.defaults.forEach((defaultSong) => {
            var element = document.querySelector(`div.song-slot[data-segid="${segment.segid}"][data-slotindex="${defaultSong.slotIndex}"]`);
            if(element){
                switchSlotToFilled(element, defaultSong);
            }
        }); 
    });
}

let songs = [];

function getSongs(){
    let url = "/api/song/list";
    let data = {};

    apiGet(url, (result) => {
        if(result.success){
            songs = result.data;
        }

        initializeSlots();
    });

}


setTimeout(() => {
    getSongs();

}, 500);

function addSlot(element){
    let segid = element.getAttribute("data-segid");
    let segment = dataStructure.segments.find((element) => element.segid == segid);

    if(!segment) return;

    let html = slot_template;

    html = html.replaceAll("DEFAULT_SEGID", segment.segid);
    html = html.replaceAll("DEFAULT_SLOTINDEX", segment.slots);

    let generatedElement = document.createElement("div");
    generatedElement.innerHTML = html;
    generatedElement = generatedElement.firstChild;

    generatedElement.classList.add("slot-appear");
    

    if(segment.defaults.find(d => d.slotIndex == segment.slots)){
        // replace slot-empty with slot-filled

        let defaultSong = segment.defaults.find(d => d.slotIndex == segment.slots);

        switchSlotToFilled(generatedElement, defaultSong);
    }


    // div with slot-list name and segid attribute
    // append new div to slot-list div
    document.querySelector(`div[name="slot-list"][data-segid="${segment.segid}"]`).appendChild(generatedElement);

    segment.slots++;

    setTimeout(() => {
        generatedElement.classList.remove("slot-appear");
    },500);

    changeSaveButtonState(false);

    
}

function removeSlot(element, event){
    let segid = element.getAttribute("data-segid");
    let slotIndex = element.getAttribute("data-slotindex");
    let segment = dataStructure.segments.find((element) => element.segid == segid);

    // check if there is a default song in the slot
    let defaultSong = segment.defaults.find(d => d.slotIndex == segment.slots);
    if(defaultSong){
        removeDefault(segid, slotIndex);
    }

    if(!segment) return;

    segment.slots--;

    

    let slotElement = document.querySelector(`div.song-slot[data-segid="${segid}"][data-slotindex="${slotIndex}"]`);
    slotElement.remove();

    // go through each of the other slotIndex and update the slotIndex
    // make sure the defaults are also updated

    segment.defaults.forEach((defaultSong) => {
        if(defaultSong.slotIndex > slotIndex){
            defaultSong.slotIndex--;
        }
    });

    document.querySelectorAll(`div.song-slot[data-segid="${segid}"]`).forEach((slotElement) => {

        if(slotElement.getAttribute("data-slotindex") > slotIndex){
            slotElement.setAttribute("data-slotindex", slotElement.getAttribute("data-slotindex") - 1);
            //slotElement.querySelector("span[name='slot-empty']").innerHTML = "Slot Empty " + slotElement.getAttribute("data-slotindex");

            // update all slotindex attributes
            slotElement.querySelectorAll("[data-slotindex]").forEach((element) => {
                element.setAttribute("data-slotindex", slotElement.getAttribute("data-slotindex"));
            });
        }

        
    });

    // remove default if it exists
    removeDefault(segid, slotIndex);

    changeSaveButtonState(false);

    event.stopPropagation();

}

function removeFilledSlot(element, event){


    let segid = element.getAttribute("data-segid");
    let slotIndex = element.getAttribute("data-slotindex");
    let segment = dataStructure.segments.find((element) => element.segid == segid);

    if(!segment) return;

    let defaultSong = segment.defaults.find(d => d.slotIndex == slotIndex);
    if(defaultSong){
        removeDefault(segid, slotIndex);
    }

    let slotElement = document.querySelector(`div.song-slot[data-segid="${segid}"][data-slotindex="${slotIndex}"]`);
    
    slotElement.classList.remove("slot-filled");
    slotElement.classList.add("slot-empty");

    slotElement.querySelector("div.song-slot-empty").classList.remove("no-display");
    slotElement.querySelector("div.song-slot-details").classList.add("no-display");

    changeSaveButtonState(false);

    event.stopPropagation();

}

function switchSlotToFilled(element, defaultSlot, isAfterInitialize){
    element.classList.remove("slot-empty");
    element.classList.add("slot-filled");

    element.querySelector("div.song-slot-empty").classList.add("no-display");
    element.querySelector("div.song-slot-details").classList.remove("no-display");

    element.querySelectorAll("div.song-slot-details-category").forEach((category) => {
        category.classList.add("no-display");
    });

    var categoryElement = element.querySelector("div.song-slot-details-category[name='" + defaultSlot.type +"']");
    categoryElement.classList.remove("no-display");

    if(defaultSlot.type == "song"){

        element.querySelector("span[name='icon']").innerHTML = "music_note";

        categoryElement.querySelector("span[name='name']").innerHTML = defaultSlot.soid_backup;
        let apiSong = songs.find(s => s.soid == defaultSlot.soid);
        if(apiSong){
            categoryElement.querySelector("span[name='artist']").classList.remove("no-display");
            categoryElement.querySelector("span[name='modification']").classList.remove("no-display");
            categoryElement.querySelector("div[name='api-error']").classList.add("no-display");

            categoryElement.querySelector("span[name='name']").innerHTML = apiSong.name;
            categoryElement.querySelector("span[name='artist']").innerHTML = "By " + (apiSong.artist == null ? "Unknown" : apiSong.artist);
            categoryElement.querySelector("span[name='modification']").innerHTML = `<i>${(apiSong.modification == null ? "No Modification" : apiSong.modification)}</i>`;
        }else{
            categoryElement.querySelector("span[name='artist']").classList.add("no-display");
            categoryElement.querySelector("span[name='modification']").classList.add("no-display");
            categoryElement.querySelector("div[name='api-error']").classList.remove("no-display");
        }

        
    }else if(defaultSlot.type == "break"){

        element.querySelector("span[name='icon']").innerHTML = "timer";

        categoryElement.querySelector("input[name='name']").value = defaultSlot.name;
        categoryElement.querySelector("input[name='time']").innerHTML = defaultSlot.time;
    }

    if(isAfterInitialize){
        changeSaveButtonState(false);
    }

    
   
}

function editFilledSlot(element){
    let segid = element.getAttribute("data-segid");
    let slotIndex = element.getAttribute("data-slotindex");

    let segment = dataStructure.segments.find((element) => element.segid == segid);
    if(!segment) return;
    let defaultSlot = segment.defaults.find(d => d.slotIndex == slotIndex);
    if(!defaultSlot) return;

    let property = element.getAttribute("name");
    let value = element.value;

    if(defaultSlot.type == "break"){
        defaultSlot[property] = value;
    }
}



function createSegment(){
    let newSegment = {
        name: "",
        description: "",
        slots: 0,
        idealTime: 0,
        notifyOnChange: false,
        defaults: [],
        segid: generateRandomSegmentId()
    }

    dataStructure.segments.push(newSegment);
    // update view

    addSegmentToView(newSegment);
    changeSaveButtonState(false);


    addSlot(document.querySelector(`button[name="add-slot"][data-segid="${newSegment.segid}"]`));
}

function deleteSegment(element){
    let segid = element.getAttribute("data-segid");
    let segment = dataStructure.segments.find((element) => element.segid == segid);

    if(!segment) return;

    dataStructure.segments.splice(dataStructure.segments.indexOf(segment), 1);
    // update view

    document.querySelector(`div[name="segment"][data-segid="${segment.segid}"]`).remove();
    changeSaveButtonState(false);
}

function moveSegment(element, direction){
    let segid = element.getAttribute("data-segid");
    let segment = dataStructure.segments.find((element) => element.segid == segid);

    if(!segment) return;

    let index = dataStructure.segments.indexOf(segment);
    if(index == 0 && direction == -1) return;
    if(index == dataStructure.segments.length - 1 && direction == 1) return;

    dataStructure.segments.splice(index, 1);
    dataStructure.segments.splice(index + direction, 0, segment);
    // update view

    let segmentElement = document.querySelector(`div[name="segment"][data-segid="${segment.segid}"]`);
    let segmentList = document.getElementById("segment-list");

    segmentList.removeChild(segmentElement);
    if(direction == -1){
        segmentList.insertBefore(segmentElement, segmentList.children[index - 1]);
    }else{
        segmentList.insertBefore(segmentElement, segmentList.children[index + 1]);
    }
    changeSaveButtonState(false);

}

function removeThisDefault(element){
    let segid = element.getAttribute("data-segid");
    let index = element.getAttribute("data-index");
    removeDefault(segid, index);
    changeSaveButtonState(false);
}

function removeDefault(segid, index){
    let segment = dataStructure.segments.find((element) => element.segid == segid);
    if(!segment) return;

    let def = segment.defaults.find((d) => d.slotIndex == index);
    if(!def) return;

    segment.defaults.splice(segment.defaults.indexOf(def), 1);
    // update view
    changeSaveButtonState(false);
}


function changeSlots(element, value){
    let segid = element.getAttribute("data-segid");
    let segment = dataStructure.segments.find((element) => element.segid == segid);
    if(!segment) return;

    let oldSlots = segment.slots;
    segment.slots += value;

    if(segment.slots < 1) segment.slots = 1;

    if(segment.slots < oldSlots){
        for(let i = segment.slots; i < oldSlots; i++){
            removeDefault(segid, i);
        }
        // remove all bottom slots from the segment div
    }else{
        // add new empty divs
    }
}

function slotTriggerChoose(element, type){

    let segid = element.getAttribute("data-segid");
    let slotIndex = element.getAttribute("data-slotindex");

    let segment = dataStructure.segments.find((element) => element.segid == segid);

    if(type == "song"){
        showDialog({
            title: "Add Default Song to " + (segment.name == "" ? "Segment" : segment.name),
            type: "song",
            icon: "tune",
            multiple: false,
            onchoose: () => {
                // here, current_dialog_data has a selected property
    
                let song = current_dialog_data.selected[0];
    
                let defaultSong = {
                    slotIndex: slotIndex,
                    soid_backup: song.soid_backup,
                    soid: song.soid,
                    type: "song"
                };
    
                segment.defaults.push(defaultSong);
                let slotElement = document.querySelector(`div.song-slot[data-segid="${segid}"][data-slotindex="${slotIndex}"]`);
    
                switchSlotToFilled(slotElement, defaultSong, true);
    
                hideDialog();
            },
            extra: {
                segid: segid,
                slotIndex: slotIndex
            }
        });
    }else if(type == "break"){
        let defaultBreak = {
            slotIndex: slotIndex,
            type: "break",
            name: "Default Break",
            time: 300
        }

        segment.defaults.push(defaultBreak)

        let slotElement = document.querySelector(`div.song-slot[data-segid="${segid}"][data-slotindex="${slotIndex}"]`);
    
        switchSlotToFilled(slotElement, defaultBreak, true);
    }

    
}


function cloneEventTemplate(etid, name){
    var cloneEtid = etid;
    
    if(!etid) {
        cloneEtid = usingEtid;
    }
    

    

    showDialog({
        title: "Cloning Event Template" + (name ? `: ${name}` : ""),
        description: "Are you sure that you would like to clone this event template? This will create a new event template with the same data as this one, but with a different id. No events will be impacted by this change.",
        icon: "content_copy",
        buttons: [
            {
                text: "Clone",
                class: "button-main",
                background: "success-bg",
                onclick: () => {

                    apiPost("/api/event/template/clone", {etid: cloneEtid}, (result) => {
                        // open new event template in new tab
                        window.open(`/event/template/${result.data[0].etid}`, "_blank");
                        // reload current page
                        window.location.reload();
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
    })

}

function deleteEventTemplate(etid, name){
    var deleteEtid = etid;
    
    if(!etid) {
        deleteEtid = usingEtid;
    }
    

    

    showDialog({
        title: "Deleting Event Template" + (name ? `: ${name}` : ""),
        description: "Are you sure that you would like to delete this event template? This will not damage any events that have been made with this template, but no further events can use this template after it's been deleted. All deletions are final and all data will be lost from this template!",
        icon: "delete",
        buttons: [
            {
                text: "Delete Forever",
                class: "button-main",
                background: "error-bg",
                onclick: () => {

                    apiPost("/api/event/template/delete", {etid: deleteEtid}, (result) => {
                        window.location.href = "/event/templates";
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
    })
}