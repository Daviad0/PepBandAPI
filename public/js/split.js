function joinSplit(){
    let url = "/api/groups/split/membership";

    let data = { sid: sid };

    apiPost(url, data, (result) => {
        if(result.success){
            location.reload();
        } else {
            console.log(result);
        }
    });
}

function leaveSplit(){
    let url = "/api/groups/split/" + sid + "/leave";

    let data = { sid: sid };

    apiPost(url, data, (result) => {
        if(result.success){
            location.reload();
        } else {
            console.log(result);
        }
    });
}