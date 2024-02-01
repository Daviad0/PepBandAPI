var eventType = null;
var eventTemplate = null;

function updateEventTypePreview(element){
    let etyid = element.value;
    let url = "/api/event/type/" + etyid;
    let data = {etyid: etyid};

    apiGet(url, (result) => {
        if(result.success){
            eventType = result.data[0];
            document.getElementById("event-type-preview").innerHTML = eventType.icon;

            if(eventType.color == ""){
                eventType.color = "black";
            }

            updateTemplateWarning(eventTemplate == null ? false : eventType.etyid != eventTemplate.etyid);

            document.getElementById("event-type-preview").style.backgroundColor = eventType.color;
            document.getElementById("event-type-preview").style.color = "white";

        }
    });
}

function updateTemplateWarning(show){
    if(show){
        document.getElementById("event-template-warning").classList.remove("no-display");
    } else {
        document.getElementById("event-template-warning").classList.add("no-display");
    }
}

function updateEventTemplate(element){
    let etid = element.value;
    let url = "/api/event/template/" + etid;
    let data = {etid: etid};

    apiGet(url, (result) => {
        if(result.success){
            eventTemplate = result.data[0];

            document.getElementById("event-template-preview").innerHTML = eventTemplate.name;

            updateTemplateWarning(eventType == null ? false : eventType.etyid != eventTemplate.etyid);
        }
    });
}

