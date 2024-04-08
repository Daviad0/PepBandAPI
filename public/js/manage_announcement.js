function deleteAnnouncement(aid){
    let url = "/api/announcement/" + aid + "/delete";
    let data = {};
    apiPost(url, data, (result) => {
        if(result.success){
            let announcement = document.querySelector(`div.announcement[data-aid="${aid}"]`);
            announcement.remove();
        }
    })
}

function renotifyAnnouncement(aid){
    // TODO: Implement renotifyAnnouncement
}