// any general methods that should be shared across pages

function resolve(about, origValue, newValue, access){

    let elements = document.querySelectorAll(`span[data-about="${about}"][data-value="${origValue}"]`);

    // remove event listeners off of elements
    if(!access){
        // show a message about not having access to resolve further
        elements.forEach((element) => {
            element.innerHTML = `<span class="error">Permission Denied</span>`;
            element.classList.remove("resolve-further");
            element.onclick = null;
        })
    }else{
        elements.forEach((element) => {
            element.innerHTML = newValue;
            element.classList.remove("resolve-further");
            element.onclick = null;
        })
    }
}

function resolve_user(element){
    let uid = element.getAttribute("data-value");

    if(uid == "-1"){
        resolve("uid", uid, "Unknown User", true);
        return;
    }

    let url = "/api/identity/find/" + uid;
    apiGet(url, (result) => {
        if(result.success){
            resolve("uid", uid, result.data[0].full_name, true);
        }else{
            resolve("uid", uid, "Unknown User", false);
        }
    })
}