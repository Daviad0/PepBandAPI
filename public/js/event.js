function resolveSlots(){
    var soidsToResolve = [];
    var linkBack = {}
    dataStructure.segments.forEach(segment => {
        segment.slots.forEach(slot => {
            if(slot.type == "song"){
                soidsToResolve.push(slot.soid);

                if(!linkBack[slot.soid]){
                    linkBack[slot.soid] = [];
                }

                linkBack[slot.soid].push({
                    segid: segment.segid,
                    slotIndex: segment.slots.indexOf(slot)
                });
            }
        });
    });

    let url = "/api/song"

    soidsToResolve.forEach(soid => {
        let specificUrl = url + "/" + soid;
        apiGet(specificUrl, (result) => {
            if(result.success){
                let song = result.data[0];
                handleLinkBacks(linkBack[soid], song);
            }
        });
    });
    
}

function hideEvent(){
    let url = '/api/event/';
    let data = {show: false, eid: eid};

    apiPost(url, data, (result) => {
        if(result.success){
            location.reload();
        } else {
            console.log(result);
        }
    });
}

function showEvent(){
    let url = '/api/event/';
    let data = {show: true, eid: eid};

    apiPost(url, data, (result) => {
        if(result.success){
            location.reload();
        } else {
            console.log(result);
        }
    });
}

function handleLinkBacks(linkBack, song){
    linkBack.forEach(link => {

        let parentElement = document.querySelector(`div[data-segid="${link.segid}"][data-slotindex="${link.slotIndex}"][name="song"]`);
        parentElement.querySelector(`span[name="name"]`).innerHTML = song.name;
        parentElement.querySelector(`span[name="artist"]`).innerHTML = song.artist;
        parentElement.querySelector(`span[name="modification"]`).innerHTML = song.modification;

    });
}

let backgroundOverrideButtons = {
    0: "error-bg",
    1: "success-bg",
    2: "warning-bg"
}

function changeParticipationOverride(element){
    let override = element.getAttribute("data-override");
    let url = "/api/event/" + eid + "/override/";
    let data = {override: override};

    apiPost(url, data, (result) => {
        if(result.success){
            document.querySelectorAll(`.override[data-override]`).forEach(overrideElement => {
                overrideElement.classList.remove(backgroundOverrideButtons[0]);
                overrideElement.classList.remove(backgroundOverrideButtons[1]);
                overrideElement.classList.remove(backgroundOverrideButtons[2]);
            
            });
            document.querySelector(`.override[data-override="${override}"]`).classList.add(backgroundOverrideButtons[override]);
        } else {
            console.log(result);
        }
    });
}

setTimeout(resolveSlots, 1000);