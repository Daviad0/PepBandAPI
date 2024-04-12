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

function updateSongFilter(){
    let filter_name = document.getElementById("song-search-name").value;
    let filter_category = document.getElementById("song-search-category").value;

    for(let i = 0; i < songs.length; i++){
        let song = songs[i];

        if(filter_name != ""){
            if(!song.name.toLowerCase().includes(filter_name.toLowerCase())){
                document.querySelector(`div.song-item[data-soid="${song.soid}"]`).classList.add("no-display");
                continue;
            }
        }

        if(filter_category != "any"){
            if(song.category != filter_category){
                document.querySelector(`div.song-item[data-soid="${song.soid}"]`).classList.add("no-display");
                continue;
            }
        }

        document.querySelector(`div.song-item[data-soid="${song.soid}"]`).classList.remove("no-display");
        
    }
}

function updateSongView(song){
    songs.push(song);

    let html = song_template;

    if(song.category == "quick"){
        song.category = "Quickie";
    }else if(song.category == "regular"){
        song.category = "Regular";
    }else{
        song.category = "Unknown";
    }

    if(song.name == ""){
        song.name = song.friendly_name;
    }

    if(song.artist == ""){
        song.artist = "Unknown";
    }

    if(song.modification == ""){
        song.modification = "None";
    }

    html = html.replaceAll("DEFAULT_SOID", song.soid);
    html = html.replaceAll("DEFAULT_NAME", song.name);
    html = html.replaceAll("DEFAULT_FRIENDLYNAME", song.friendly_name);
    html = html.replaceAll("DEFAULT_ARTIST", song.artist);
    html = html.replaceAll("DEFAULT_MODIFICATION", song.modification);
    html = html.replaceAll("DEFAULT_DURATION", song.duration);
    html = html.replaceAll("DEFAULT_SOURCE", song.source);
    html = html.replaceAll("DEFAULT_UPDATED", song.updated);
    html = html.replaceAll("DEFAULT_CATEGORY", song.category);

    // maybe not needed depending on how we make the song page... keep for now...
    document.getElementById("song-list").innerHTML += html;

    updateNonAutomatic();

}

function getSongs(){
    let url = "/api/song/list";

    apiGet(url, (result) => {
        if(result.success){
            for(let i = 0; i < result.data.length; i++){
                updateSongView(result.data[i]);
            }
            updateNonAutomatic();
        }else{
            // error
        }
    });

}



function updateNonAutomatic(){

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

    let categorySelect = document.querySelectorAll(`select[name="category"]`);

    for(let i = 0; i < categorySelect.length; i++){
        let origvalue = categorySelect[i].getAttribute("data-origvalue");
        let soid = categorySelect[i].getAttribute("data-soid");

        categorySelect[i].value = origvalue;
    
    }
}

setTimeout(() => {
    getSongs();
    
}, 500);

