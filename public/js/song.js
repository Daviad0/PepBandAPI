let songs = [];

function toggleSongExpansion(element){
    let soid = element.getAttribute("data-soid");
    // div with class song-expand and data-soid equal to soid
    let songExpand = document.querySelector(`div.song-expand[data-soid="${soid}"]`);
    // if element has the song-expand-button-show class, then contract the song

    if(element.classList.contains("song-expand-button-show")){
        element.classList.remove("song-expand-button-show");
        element.classList.add("song-expand-button-hide");
        songExpand.classList.remove("song-expand-show");
        songExpand.classList.add("song-expand-hide");
    }
    else{
        element.classList.remove("song-expand-button-hide");
        element.classList.add("song-expand-button-show");
        songExpand.classList.remove("song-expand-hide");
        songExpand.classList.add("song-expand-show");
    }
}

function updateSongView(song){
    songs.push(song);

    let html = song_template;

    html = html.replaceAll("DEFAULT_SOID", song.soid);
    html = html.replaceAll("DEFAULT_NAME", song.name);
    html = html.replaceAll("DEFAULT_FRIENDLYNAME", song.friendly_name);
    html = html.replaceAll("DEFAULT_ARTIST", song.artist);
    html = html.replaceAll("DEFAULT_MODIFICATION", song.modification);
    html = html.replaceAll("DEFAULT_DURATION", song.duration);
    html = html.replaceAll("DEFAULT_SOURCE", song.source);
    html = html.replaceAll("DEFAULT_UPDATED", song.updated);

    // maybe not needed depending on how we make the song page... keep for now...
    document.getElementById("song-list").innerHTML += html;

    updateDurations();

}

function editSong(element){
    let error_span = document.querySelector(`span[data-soid="${element.getAttribute("data-soid")}"][name="error"]`);

    if(element.value == ""){
        element.classList.add("input-error");
        showError(error_span, "Name cannot be empty");
        return;
    }

    let applicableSong = songs.find(s => s.soid == element.getAttribute("data-soid"));

    let soid = element.getAttribute("data-soid");
    let value = element.value;
    let property = element.getAttribute("name");

    let url = "/api/song/";
    let data = {soid: soid};
    data[property] = value;
    if(applicableSong){ // system is not fully decided yet.. not a permanent implement
        applicableSong[property] = value;
    }
    

    apiPost(url, data, (result) => {
        if(result.success){
            element.classList.remove("input-error");
            showError(error_span, null);
        }else{
            element.classList.add("input-error");
            showError(error_span, "Error updating song");
        }
    });
}

function deleteSong(element){
    let soid = element.getAttribute("data-soid");
    let error_span = document.querySelector(`span[data-soid="${soid}"][name="error"]`);

    let url = "/api/song/" + soid + "/delete";
    let data = {soid: soid};

    apiPost(url, data, (result) => {
        if(result.success){

            songs = songs.filter(s => s.soid != soid);

            let song_item = document.querySelector(`div[data-soid="${soid}"]`);
            song_item.remove();
        }else{
            if(result.message){
                showError(error_span, result.message);
            }
            else{
                showError(error_span, "Error deleting song");
            }
        }
    });
}

function updateDurations(){

    let durationElements = document.querySelectorAll(`input[name="duration"]`);

    for(let i = 0; i < durationElements.length; i++){
        let durationElement = durationElements[i];
        let soid = durationElement.getAttribute("data-soid");
        let duration = durationElement.value;

        let minutes = Math.floor(duration / 60);
        let seconds = duration % 60;

        document.querySelector(`input[data-soid="${soid}"][name="duration-minute"]`).value = minutes;
        document.querySelector(`input[data-soid="${soid}"][name="duration-second"]`).value = seconds;
    }

}

setTimeout(() => {
    updateDurations();
}, 500);



function editSongDuration(element){
    let soid = element.getAttribute("data-soid");
    let error_span = document.querySelector(`span[data-soid="${soid}"][name="error"]`);

    let minutes = document.querySelector(`input[data-soid="${soid}"][name="duration-minute"]`).value;
    let seconds = document.querySelector(`input[data-soid="${soid}"][name="duration-second"]`).value;

    if(minutes == ""){
        minutes = 0;
    }
    if(seconds == ""){
        seconds = 0;
    }

    let totalTime = parseInt(minutes) * 60 + parseInt(seconds);

    document.querySelector(`input[data-soid="${soid}"][name="duration"]`).value = totalTime;
    
    editSong(document.querySelector(`input[data-soid="${soid}"][name="duration"]`));
}

function createSong(){
    let url = "/api/song/create";

    let songName = document.getElementById("song-create-name").value;

    document.getElementById("song-create").setAttribute("disabled", "disabled");

    if(songName == ""){
        document.getElementById("song-create-name").classList.add("input-error");
        return;
    }

    document.getElementById("song-create-name").value = "";
    
    let data = {name: songName};

    apiPost(url, data, (result) => {
        if(result.success){
            updateSongView(result.data[0]);
            document.getElementById("song-create").removeAttribute("disabled");
        }else{
            document.getElementById("song-create-name").classList.add("input-error");
            document.getElementById("song-create").removeAttribute("disabled");
        }
    });
}

let songUsage = {};

function customSongUsageResolve(element){

    let soid = element.getAttribute("data-soid");

    let error_span = document.querySelector(`span[data-soid="${soid}"][name="error"]`);

    let url = "/api/song/" + soid + "/usage";

    apiGet(url, (result) => {
        if(result.success){
            songUsage[soid] = result.data;
            showError(error_span, null);


            element.classList.add("no-display");
            document.querySelector(`div.song-usage-details[data-soid="${soid}"]`).classList.remove("no-display");

            let select = document.querySelector(`select[data-soid="${soid}"][name="usage"]`);

            editSongUsageView(select);

        }else{
            showError(error_span, "Error getting song usage");
        }
    })

}

function editSongUsageView(element){
    let soid = element.getAttribute("data-soid");

    let usage = songUsage[soid];

    if(!usage) return;

    let timespan = document.querySelector(`select[data-soid="${soid}"][name="usage"]`).value;

    var count = 0;
    var eventCount = 0;
    for(let i = 0; i < usage.length; i += 1){
        // usage[i].used has a datetime that we can parse

        var specificUsage = usage[i];
        if(timespan == "any"){
            count += specificUsage.count;
            eventCount += 1;
        }else{
            // time between now and usage[i].used must be less than timespan
            let now = new Date();
            let used = new Date(specificUsage.used);

            let diff = now - used;

            let hours = diff / (1000 * 60 * 60);

            if(timespan < 0){
                if(hours < Math.abs(timespan)){
                    count += specificUsage.count;
                    eventCount += 1;
                }
            }else{
                if(hours > timespan){
                    count += specificUsage.count;
                    eventCount += 1;
                }
            }

        }

    }

    document.querySelector(`span.song-usage[data-soid="${soid}"]`).innerHTML = `Song has been used <strong>${count}</strong> times for <strong>${eventCount}</strong> events.`;
}