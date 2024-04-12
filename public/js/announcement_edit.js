var eventType = null;
var eventTemplate = null;

function postAnnouncement(){

    showGeneralError(null, null);

    let name = document.querySelector("input[name='title']").value;
    let content = document.querySelector("textarea[name='content']").value;
    let published_date = document.querySelector("input[name='published_date']").valueAsDate;
    let published_time = document.querySelector("input[name='published_time']").value;

    // format as proper date string
    // convert to Date
    var published = new Date(Date.parse(published_date));
    published.setHours(published_time.split(":")[0]);
    published.setMinutes(published_time.split(":")[1]);
    published.setSeconds(0);
    
    let until_date = document.querySelector("input[name='until_date']").valueAsDate;
    let until_time = document.querySelector("input[name='until_time']").value;
    // format as proper date string
    // convert to Date
    var until = new Date(Date.parse(until_date));
    until.setHours(until_time.split(":")[0]);
    until.setMinutes(until_time.split(":")[1]);
    until.setSeconds(0);

    let postToGids = [];
    let postToSids = [];
    let postToEveryone = false;

    let postToGidsElements = document.querySelectorAll("input.post-to[data-gid]");
    let postToSidsElements = document.querySelectorAll("input.post-to[data-sid]");
    let postToEveryoneElement = document.querySelector("input.post-to[data-all]");
    postToGidsElements.forEach((element) => {
        if(element.checked){
            postToGids.push(element.getAttribute("data-gid"));
        }
    });
    postToSidsElements.forEach((element) => {
        if(element.checked){
            postToSids.push(element.getAttribute("data-sid"));
        }
    });
    postToEveryone = postToEveryoneElement.checked;

    let notified = document.getElementById("announcement-edit-notified").checked;


    showGeneralError(null, null);
    if(name == "" || content == "" || icon == null || published == "Invalid Date"){
        showGeneralError("Please fill out all fields", "indeterminate_question_box");
        return;
    }

    if(until == "Invalid Date"){
        // set until to end of time
        until = new Date("9999-12-30");
    }
    
    if(published > until){
        showGeneralError("Published date must be before until date", "history_toggle_off");
        return;
    }

    if(postToGids.length == 0 && postToSids.length == 0 && !postToEveryone){
        showGeneralError("Please select at least one group to post to", "group_add");
        return;
    }

    let url = "/api/global/announcement/";
    let data = {
        aid: aid,
        name: name,
        content: content, 
        published: published.toISOString(),
        until: until.toISOString(),
        icon: icon,
        global: postToEveryone,
        postToGids: postToGids,
        postToSids: postToSids,
        notified: notified
    };

    apiPost(url, data, (result) => {
        if(result.success){
            //window.location.href = "/event/" + result.data[0].eid;
            window.location.href = "/events"
        }
    });
}

function iconChoose(){
    showDialog({
        title: "Choose Icon for This Announcement",
        description: "Icon",
        type: "icon",
        icon: "ink_highlighter",
        onchoose: () => {
            let image_viewer = document.querySelector("#announcement-edit-image");
            image_viewer.classList.add("no-display");
            let icon_viewer = document.querySelector("#announcement-edit-icon");
            icon_viewer.removeAttribute("hidden");
            icon_viewer.innerHTML = current_dialog_data.selected;

            icon = current_dialog_data.selected;

            hideDialog();
        },
        extra: {}
    });
}

function imageChoose(){
    showDialog({
        title: "Choose Image for This Announcement",
        description: "Image",
        type: "image",
        icon: "ink_highlighter",
        onchoose: () => {
            let image_viewer = document.querySelector("#announcement-edit-image");
            image_viewer.classList.add("no-display");
            let icon_viewer = document.querySelector("#announcement-edit-icon");
            icon_viewer.removeAttribute("hidden");
            icon_viewer.src = current_dialog_data.selected;

            icon = "IMAGE:" + current_dialog_data.selected;
            
            hideDialog();
        },
        extra: {}
    });

}