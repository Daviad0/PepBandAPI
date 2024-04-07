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

    if(etid == "-1"){
        eventTemplate = null;
        updateTemplateWarning(false);
        return;
    }

    let data = {etid: etid};

    apiGet(url, (result) => {
        if(result.success){
            eventTemplate = result.data[0];

            //document.getElementById("event-template-preview").innerHTML = eventTemplate.name;

            updateTemplateWarning(eventType == null ? false : eventType.etyid != eventTemplate.etyid);
        }
    });
}

function submitEventForCreation(){
    let error_span = document.getElementById("event-create-error");
    let etid = eventTemplate == null ? null : eventTemplate.etid; // this is OK if null
    let etyid = eventType == null ? null : eventType.etyid;
    let name = document.querySelector("input[name='name']").value;
    let description = document.querySelector("textarea[name='description']").value;
    let location = document.querySelector("input[name='location']").value;
    let start_date = document.querySelector("input[name='start_date']").valueAsDate;
    let start_time = document.querySelector("input[name='start_time']").value;

    // format as proper date string
    // convert to Date
    start = new Date(Date.parse(start_date));
    start.setHours(start_time.split(":")[0]);
    start.setMinutes(start_time.split(":")[1]);
    start.setSeconds(0);
    
    let end_date = document.querySelector("input[name='end_date']").valueAsDate;
    let end_time = document.querySelector("input[name='end_time']").value;
    // format as proper date string
    // convert to Date
    end = new Date(Date.parse(end_date));
    end.setHours(end_time.split(":")[0]);
    end.setMinutes(end_time.split(":")[1]);
    end.setSeconds(0);

    let show = document.querySelector("input[name='show']").checked;

    showGeneralError(null,null)
    if(name == "" || etyid == null || start == "Invalid Date" || end == "Invalid Date"){
        showGeneralError("Please fill out all fields","indeterminate_question_box")
        return;
    }
    

    let url = "/api/event/create";
    let data = {
        etid_used: etid,
        name: name,
        description: description,
        start: start.toISOString(),
        end: end.toISOString(),
        etyid: etyid,
        show: show,
        location: location
    };

    apiPost(url, data, (result) => {
        if(result.success){
            //window.location.href = "/event/" + result.data[0].eid;
            window.location.href = "/events"
        }
    });
}