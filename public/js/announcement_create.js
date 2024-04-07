var eventType = null;
var eventTemplate = null;

let icon = null;

function changePublishNow(element){
    let publish_now = element.checked;
    let publish_date = document.querySelector("input[name='published_date']");
    let publish_time = document.querySelector("input[name='published_time']");
    if(publish_now){
        publish_date.value = "";
        publish_time.value = "";
        publish_date.setAttribute("disabled", "true");
        publish_time.setAttribute("disabled", "true");
    }else{
        publish_date.removeAttribute("disabled");
        publish_time.removeAttribute("disabled");
    }

    changePublishDate();

}

function changePublishDate(){
    let publish_notify = document.getElementById("announcement-create-notify");

    let publish_now = document.getElementById("announcement-create-publish-now").checked;
    if(publish_now){
        publish_notify.removeAttribute("disabled");
        return;
    }

    let publish_date = document.querySelector("input[name='published_date']").value;
    let publish_time = document.querySelector("input[name='published_time']").value;
    let publish = new Date(Date.parse(publish_date));
    publish.setHours(publish_time.split(":")[0]);
    publish.setMinutes(publish_time.split(":")[1]);
    publish.setSeconds(0);

    let now = new Date();

    if(publish < now){
        publish_notify.removeAttribute("disabled");
        return;
    }

    publish_notify.setAttribute("disabled", "true");
    publish_notify.checked = false;
}

function postAnnouncement(){

    showGeneralError(null, null);

    let error_span = document.getElementById("announcement-create-error");
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

    let publish_now = document.getElementById("announcement-create-publish-now").checked;
    if(publish_now){
        published = new Date();
    }
    
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

    let notityNow = document.getElementById("announcement-create-notify").checked;
    let now = new Date();
    if(published > now && notityNow){
        notityNow = false;
    }


    showGeneralError(null, null);
    if(name == "" || content == "" || icon == null || published == "Invalid Date"){
        showGeneralError("Please fill out all fields", "indeterminate_question_box");
        return;
    }

    if(until == "Invalid Date"){
        // set until to end of time
        until = new Date("9999-12-31T23:59:59");
    }
    
    if(published > until){
        showGeneralError("Published date must be before until date", "history_toggle_off");
        return;
    }

    if(postToGids.length == 0 && postToSids.length == 0 && !postToEveryone){
        showGeneralError("Please select at least one group to post to", "group_add");
        return;
    }

    let url = "/api/global/announcement/create";
    let data = {
        name: name,
        content: content, 
        published: published.toISOString(),
        until: until.toISOString(),
        icon: icon,
        postToEveryone: postToEveryone,
        postToGids: postToGids,
        postToSids: postToSids,
        notifyNow: notityNow
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
            let image_viewer = document.querySelector("#announcement-create-image");
            image_viewer.classList.add("no-display");
            let icon_viewer = document.querySelector("#announcement-create-icon");
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
            let image_viewer = document.querySelector("#announcement-create-image");
            image_viewer.classList.add("no-display");
            let icon_viewer = document.querySelector("#announcement-create-icon");
            icon_viewer.removeAttribute("hidden");
            icon_viewer.src = current_dialog_data.selected;

            icon = "IMAGE:" + current_dialog_data.selected;
            
            hideDialog();
        },
        extra: {}
    });

}