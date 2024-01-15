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

    let url = "/api/song";
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

function createSong(){
    let url = "/api/song/create";
    let data = {};

    apiPost(url, data, (result) => {
        if(result.success){
            updateSongView(result.data[0]);
        }else{
            
        }
    });
}