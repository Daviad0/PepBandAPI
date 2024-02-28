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

function saveEventStructure(){
    let newTemplateData = JSON.stringify(dataStructure);
    let error_span = document.querySelector(`span[name="error"]`);
    let property = "data";

    let url = "/api/event/";
    let data = {eid: usingEid};
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

function editEventTime(element){
    let property = element.getAttribute("name");
    let value = element.value;

    if(property.startsWith("start")){
        let time = "";
        let date = "";
        if(property.endsWith("date")){
            date = value;
            time = document.querySelector(`input[name="start_time"]`).value;
        }
        else if(property.endsWith("time")){
            time = value;
            date = document.querySelector(`input[name="start_date"]`).value;
        }

        let start = new Date(Date.parse(date));
        start.setHours(time.split(":")[0]);
        start.setMinutes(time.split(":")[1]);
        start.setSeconds(0);
        
        document.querySelector(`input[name="start"]`).value = start.toISOString();
        editEvent(document.querySelector(`input[name="start"]`));

    }
    else if(property.startsWith("end")){

        let time = "";
        let date = "";
        if(property.endsWith("date")){
            date = value;
            time = document.querySelector(`input[name="end_time"]`).value;
        }
        else if(property.endsWith("time")){
            time = value;
            date = document.querySelector(`input[name="end_date"]`).value;
        }

        let end = new Date(Date.parse(date));
        end.setHours(time.split(":")[0]);
        end.setMinutes(time.split(":")[1]);
        end.setSeconds(0);
        
        document.querySelector(`input[name="ending"]`).value = end.toISOString();
        editEvent(document.querySelector(`input[name="ending"]`));
    }
}

function editEvent(element){

    let error_span = document.querySelector(`span[name="error"]`);
    if(element.value == ""){
        element.classList.add("input-error");
        // get span with same uniq_name as element and the name as error
        
        
        showError(error_span, "Property cannot be empty! Please enter a value.");
        return;
    }

    element.classList.remove("input-error");

    var property = element.getAttribute("name");

    let url = "/api/event/";
    let data = {eid: usingEid};
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
    html = html.replaceAll("DEFAULT_SLOTS", segment.slots.length);
    html = html.replaceAll("DEFAULT_IDEALTIME", segment.idealTime);
    html = html.replaceAll("DEFAULT_NOTIFYONCHANGE", segment.notifyOnChange);

    document.getElementById("segment-list").innerHTML += html;

    // scroll to the new segment

    let newSegment = document.querySelector(`div[name="segment"][data-segid="${segment.segid}"]`);
    let topPos = newSegment.offsetTop;

    document.getElementById("segment-list").scrollTop = topPos;
}

function updateEventTypePreview(element){

    editEvent(element);

    let etyid = element.value;
    let url = "/api/event/type/" + etyid;
    let data = {etyid: etyid};

    if(etyid == ""){
        return;
    }

    apiGet(url, (result) => {
        if(result.success){
            eventType = result.data[0];
            document.getElementById("event-type-preview").innerHTML = eventType.icon;

            if(eventType.color == ""){
                eventType.color = "black";
            }

            document.getElementById("event-type-preview").style.backgroundColor = eventType.color;
            document.getElementById("event-type-preview").style.color = "white";

        }
    });
}

function initializeSlots(){
    // only to be called once, when the page is loaded
    let eventTypeInitial = document.getElementById("event-type").dataset.initvalue;
    document.getElementById("event-type").value = eventTypeInitial;
    updateEventTypePreview(document.getElementById("event-type"));


    dataStructure.segments.forEach((segment) => {
        // loop through each songIndex to see if there is a default

        segment.slots.forEach((slotData) => {

            if(slotData.type == "empty") return;

            // slots are organized by segid and slotindex
            // get the order of the slots by the order in the list
            var element = document.querySelector(`div.song-slot[data-segid="${segment.segid}"][data-slotindex="${segment.slots.indexOf(slotData)}"]`);
            if(element){
                switchSlotToFilled(element, slotData);
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
    html = html.replaceAll("DEFAULT_SLOTINDEX", segment.slots.length);

    segment.slots.push({
        type: "empty"
    });

    let generatedElement = document.createElement("div");
    generatedElement.innerHTML = html;
    generatedElement = generatedElement.firstChild;

    generatedElement.classList.add("slot-appear");
    
    // we do not need to initialize one as filled... hopefully
    // let slot = segment.slots
    // if(segment.defaults.find(d => d.slotIndex == segment.slots)){
    //     // replace slot-empty with slot-filled

    //     let defaultSong = segment.defaults.find(d => d.slotIndex == segment.slots);

    //     switchSlotToFilled(generatedElement, defaultSong);
    // }


    // div with slot-list name and segid attribute
    // append new div to slot-list div
    document.querySelector(`div[name="slot-list"][data-segid="${segment.segid}"]`).appendChild(generatedElement);

    setTimeout(() => {
        generatedElement.classList.remove("slot-appear");
    },500);

    changeSaveButtonState(false);

    
}

function removeSlot(element, event){
    let segid = element.getAttribute("data-segid");
    let slotIndex = element.getAttribute("data-slotindex");
    let segment = dataStructure.segments.find((element) => element.segid == segid);

    if(!segment) return;

    segment.slots.splice(slotIndex, 1);

    

    let slotElement = document.querySelector(`div.song-slot[data-segid="${segid}"][data-slotindex="${slotIndex}"]`);
    slotElement.remove();

    // reupdatte all of the rest of the slotindex attributes
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

    let slot = segment.slots[slotIndex];
    if(!slot) return;
    if(slot.type == "empty") return;

    removeDefault(segid, slotIndex);

    let slotElement = document.querySelector(`div.song-slot[data-segid="${segid}"][data-slotindex="${slotIndex}"]`);
    
    slotElement.classList.remove("slot-filled");
    slotElement.classList.add("slot-empty");

    slotElement.querySelector("div.song-slot-empty").classList.remove("no-display");
    slotElement.querySelector("div.song-slot-details").classList.add("no-display");

    changeSaveButtonState(false);

    event.stopPropagation();

}

function switchSlotToFilled(element, slotData, isAfterInitialize){
    element.classList.remove("slot-empty");
    element.classList.add("slot-filled");

    element.querySelector("div.song-slot-empty").classList.add("no-display");
    element.querySelector("div.song-slot-details").classList.remove("no-display");

    element.querySelectorAll("div.song-slot-details-category").forEach((category) => {
        category.classList.add("no-display");
    });

    if(slotData.type == "empty") return;

    var categoryElement = element.querySelector("div.song-slot-details-category[name='" + slotData.type +"']");
    categoryElement.classList.remove("no-display");

    if(slotData.type == "song"){

        element.querySelector("span[name='icon']").innerHTML = "music_note";

        categoryElement.querySelector("span[name='name']").innerHTML = slotData.soid_backup;
        let apiSong = songs.find(s => s.soid == slotData.soid);
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

        
    }else if(slotData.type == "break"){

        element.querySelector("span[name='icon']").innerHTML = "timer";

        categoryElement.querySelector("input[name='name']").value = slotData.name;
        categoryElement.querySelector("input[name='time']").innerHTML = slotData.time;
    }else if(slotData.type == "note"){

        element.querySelector("span[name='icon']").innerHTML = "event_note";

        categoryElement.querySelector("input[name='title']").value = slotData.title;
        categoryElement.querySelector("input[name='content']").innerHTML = slotData.content;
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
    let slot = segment.slots[slotIndex];
    if(!slot) return;
    if(slot.type == "empty") return;
    

    let property = element.getAttribute("name");
    let value = element.value;

    if(slot.type == "break" || slot.type == "note"){
        slot[property] = value;
    }
}



function createSegment(){
    let newSegment = {
        name: "",
        description: "",
        slots: [],
        idealTime: 0,
        notifyOnChange: false,
        visible: true,
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

    let slot = segment.slots[index];
    if(!slot) return;
    if(slot.type == "empty") return;

    segment.slots[index] = {
        type: "empty"
    };
    // update view
    changeSaveButtonState(false);
}


function slotTriggerChoose(element, type){

    let segid = element.getAttribute("data-segid");
    let slotIndex = element.getAttribute("data-slotindex");

    let segment = dataStructure.segments.find((element) => element.segid == segid);
    let slot = segment.slots[slotIndex];
    if(type == "song"){
        showDialog({
            title: "Add Song to " + (segment.name == "" ? "Segment" : segment.name),
            type: "song",
            icon: "tune",
            multiple: false,
            onchoose: () => {
                // here, current_dialog_data has a selected property
    
                let song = current_dialog_data.selected[0];
    
                let defaultSong = {
                    soid_backup: song.soid_backup,
                    soid: song.soid,
                    type: "song"
                };
    
                segment.slots[slotIndex] = defaultSong;
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
            type: "break",
            name: "A New Break",
            time: 300
        }

        segment.slots[slotIndex] = defaultBreak;

        let slotElement = document.querySelector(`div.song-slot[data-segid="${segid}"][data-slotindex="${slotIndex}"]`);
    
        switchSlotToFilled(slotElement, defaultBreak, true);
    }else if(type == "note"){
        let defaultNote = {
            type: "note",
            title: "A New Note",
            content: "This is a new note!"
        }

        segment.slots[slotIndex] = defaultNote;

        let slotElement = document.querySelector(`div.song-slot[data-segid="${segid}"][data-slotindex="${slotIndex}"]`);
    
        switchSlotToFilled(slotElement, defaultBreak, true);
    }


    
}


function cloneEvent(etid, name){
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

function deleteEvent(etid, name){
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