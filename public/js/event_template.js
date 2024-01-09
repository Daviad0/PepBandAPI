let structure = {
    segments: []
};

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

    let segment = structure.segments.find((element) => element.segid == segid);
    if(!segment) return;

    segment[property] = value;
    // update view
}

function createSegment(){
    let newSegment = {
        name: "",
        description: "",
        slots: 1,
        idealTime: 0,
        notifyOnChange: false,
        defaults: [],
        segid: generateRandomSegmentId()
    }

    structure.segments.push(newSegment);
    // update view
}

function removeThisDefault(element){
    let segid = element.getAttribute("data-segid");
    let index = element.getAttribute("data-index");
    removeDefault(segid, index);
}

function removeDefault(segid, index){
    let segment = structure.segments.find((element) => element.segid == segid);
    if(!segment) return;

    let def = segment.defaults.find((d) => d.slotIndex == index);
    if(!def) return;

    segment.defaults.splice(segment.defaults.indexOf(def), 1);
    // update view
}

function changeSlots(element, value){
    let segid = element.getAttribute("data-segid");
    let segment = structure.segments.find((element) => element.segid == segid);
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

