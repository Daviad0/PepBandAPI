function apiGet(url, callback) {
    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error("API Error: " + response.status + " " + response.statusText);
            }
        })
        .then(data => callback(data))
        .catch(error => errorCallback(error, callback))
}

function apiPost(url, body, callback) {
    fetch(url, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(
            response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error("API Error: " + response.status + " " + response.statusText);
                }
            }
        )
        .then(data => callback(data))
        .catch(error => errorCallback(error, callback))
}

function errorCallback(error, callback){
    showGeneralError(error, "language");
    callback({success: false, message: error})
}