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

setTimeout(resolveSlots, 1000);