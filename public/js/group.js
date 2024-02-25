function joinGroup(){
    let url = "/api/groups/group/membership";

    let data = { gid: gid };

    apiPost(url, data, (result) => {
        if(result.success){
            location.reload();
        } else {
            console.log(result);
        }
    });
}

function leaveGroup(){
    let url = "/api/groups/group/" + gid + "/leave";

    let data = { gid: gid };

    apiPost(url, data, (result) => {
        if(result.success){
            location.reload();
        } else {
            console.log(result);
        }
    });
}