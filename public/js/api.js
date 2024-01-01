function apiGet(url, callback) {
    fetch(url)
        .then(response => response.json())
        .then(data => callback(data))
}

function apiPost(url, body, callback) {
    fetch(url, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => callback(data))
}