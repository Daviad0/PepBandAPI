function joinGroup(element){

    let gid = element.getAttribute("data-gid");

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

function leaveGroup(element){
    let gid = element.getAttribute("data-gid");

    let url = "/api/groups/group/" + gid + "/leave";
    let isOpen = !element ? true : element.getAttribute("data-open") == "true";

    if(!isOpen){

        showDialog({
            title: "Confirm Leaving Group",
            description: "This group that you are about to leave is not open, meaning you will not be able to rejoin after you leave (unless added by a group manager). Are you sure you want to continue?",
            type: "buttons",
            icon: "door_open",
            buttons: [
                {
                    text: "Leave Group",
                    class: "button-main",
                    background: "error-bg",
                    onclick: () => {

                        let data = { gid: gid };

                        apiPost(url, data, (result) => {
                            if(result.success){
                                location.reload();
                            } else {
                                console.log(result);
                            }
                        });

                        hideDialog();
                    }
                },
                {
                    text: "Stay in Group",
                    class: "button-alternate",
                    onclick: () => {
                        hideDialog();
                    }
                }
            ]
        });

        return;
    }

    let data = { gid: gid };

    apiPost(url, data, (result) => {
        if(result.success){
            location.reload();
        } else {
            console.log(result);
        }
    });
}