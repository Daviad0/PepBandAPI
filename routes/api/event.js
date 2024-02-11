const express = require('express');

const router = express.Router("/api/event");

var db;

router.get("/type/list", (req, res) => {
    db.getEventTypes().then((result) => {
        res.send(result.data);
    })
});

router.get("/type/:etyid", (req, res) => {
    db.getEventType(req.params.etyid).then((result) => {
        res.send(result);
    })
});

router.post("/type/create", (req, res) => {
    // maybe change this to be all one
    db.setEventType(null, null, null, null, null).then((result) => {
        let etyid = result.data[0].etyid;

        db.getEventType(etyid).then((result) => {
            res.send(result);
        });
    });

});

router.post("/type", (req, res) => {
    // expecting etyid in body, not OK if null
    // expecting name in body, OK if null
    // expecting icon in body, OK if null
    // expecting color in body, OK if null
    // expecting extra_data in body, OK if null

    var etyid = req.body.etyid;
    if(!etyid){
        res.status(400).send({message: "etyid property required to update event type"});
        return;
    }

    var name = req.body.name;
    var icon = req.body.icon;
    var color = req.body.color;
    var extra_data = req.body.extra_data;
    
    if(!name) name = null;
    if(!icon) icon = null;
    if(!color) color = null;
    if(!extra_data) extra_data = null;

    db.setEventType(etyid, name, icon, color, extra_data).then((result) => {
        res.send(result.data);
    });

});

router.post("/type/delete", (req, res) => {
    
    // expecting etyid in body, not OK if null
    // need to fix results if there are event templates that use this type

    var etyid = req.body.etyid;
    if(!etyid){
        res.status(400).send({message: "etyid property required to delete event type"});
        return;
    }

    db.deleteEventType(etyid).then((result) => {
        res.send(result);
    });

});





router.get("/template/list", (req, res) => {
    db.getEventTemplates().then((result) => {
        res.send(result.data);
    })
});

router.get("/template/:etid", (req, res) => {
    db.getEventTemplate(req.params.etid).then((result) => {
        res.send(result);
    })
});

router.post("/template/create", (req, res) => {
    // maybe change this to be all one
    db.setEventTemplate(null, null, null, null).then((result) => {
        let etid = result.data[0].etid;

        db.getEventTemplate(etid).then((result) => {
            res.send(result);
        });
    });
});

router.post("/template", (req, res) => {
    // expecting etid in body, not OK if null
    // expecting etyid in body, OK if null
    // expecting name in body, OK if null
    // expecting data in body, OK if null

    var etid = req.body.etid;
    if(!etid){
        res.status(400).send({message: "etid property required to update event template"});
        return;
    }

    var etyid = req.body.etyid;
    var name = req.body.name;
    var data = req.body.data;
    if(!etyid) etyid = null;
    if(!name) name = null;
    if(!data) data = null;

    db.setEventTemplate(etid, etyid, name, data).then((result) => {
        res.send(result);
    
    });

})

router.post("/template/clone", (req, res) => {
    // expecting etid in body, not OK if null

    var oldEtid = req.body.etid;
    if(!oldEtid){
        res.status(400).send({message: "etid property required to clone event template"});
        return;
    }

    db.setEventTemplate(null,null,null,null).then(async (result) => {
        let etid = result.data[0].etid;

        

        let oldEvent = (await db.getEventTemplate(oldEtid)).data[0];
        
        db.setEventTemplate(etid, oldEvent.etyid, oldEvent.name, oldEvent.data).then((result) => {
            db.getEventTemplate(etid).then((result) => {
                res.send(result);
            });
        });

        
    });
});

router.post("/template/delete", (req, res) => {

    // expecting etid in body, not OK if null

    var etid = req.body.etid;
    if(!etid){
        res.status(400).send({message: "etid property required to delete event template"});
        return;
    }

    db.deleteEventTemplate(etid).then((result) => {
        res.send(result.data);
    });
});

router.get("/list", (req, res) => {
    db.getEvents().then((result) => {

        var events = result.data;
        // filter out events that are not shown
        events = events.filter(e => e.show == 1);

        res.send(events);
    })
});

router.get("/:eid", (req, res) => {
    db.getEvent(req.params.eid).then((result) => {

        // if no event is found, return 404
        if(result.data.length == 0){
            res.status(404).send({message: "Event not found or not shown"});
            return;
        }

        // if event is not shown, return 404
        var event = result.data[0];
        if(event.show == 0){
            res.status(404).send({message: "Event not found or not shown"});
            return;
        }

        res.send(result.data[0]);
    })
});

router.get("/:eid/overrides", (req, res) => {

    // returns user objects based on an inner join
    db.getOverrides_eid(req.params.eid).then((result) => {
        res.send(result.data);
    });
});

/*
   Since events are so major, this will have a creation page that passes in the initial parameters
*/
router.post("/create", async (req, res) => {

    // expecting etid_used in body, OK if null
    // expecting name in body, not OK if null or ""
    // expecting description in body, OK if null, turn to ""
    // expecting start in body, not OK if null or ""
    // expecting end in body, not OK if null or ""
    // expecting show in body, OK if null, turn to 0
    // expecting etyid in body, not OK if null

    var etid_used = req.body.etid_used;
    var name = req.body.name;
    var description = req.body.description;
    var start = req.body.start;
    var end = req.body.end;
    var show = req.body.show;
    var etyid = req.body.etyid;

    if(!etid_used) etid_used = null;

    var initializeWithData = "";
    try{
        if(etid_used != null){
            let et = (await db.getEventTemplate(etid_used)).data[0];
            if(et.data){
                initializeWithData = et.data;
                var dataStructure = JSON.parse(et.data);
                // TO CONVERT FROM TEMPLATE TO EVENT...
                // We need to put the defaults into each slots
                dataStructure.segments.forEach((segment) => {
                    let newSlots = [];
                    for(var i = 0; i < segment.slots; i++){

                        let qualifyingDefault = segment.defaults.find(def => def.slotIndex == i);
                        if(qualifyingDefault){
                            qualifyingDefault.slotIndex = undefined;
                            newSlots.push(qualifyingDefault);
                        }else{
                            newSlots.push({
                                type: "empty"
                            });
                        }
                        
                    }
                    segment.slots = newSlots;
                });
                initializeWithData = JSON.stringify(dataStructure);
            }
        }
    }catch(e){
        initializeWithData = "";
        etid_used = null;
    }
    

    if(!name){
        res.status(400).send({message: "name property required to create event"});
        return;
    }
    if(!description) description = "";
    if(!start){
        res.status(400).send({message: "start property required to create event"});
        return;
    }
    if(!end){
        res.status(400).send({message: "end property required to create event"});
        return;
    }
    if(!show) show = 0;
    if(!etyid){
        res.status(400).send({message: "etyid property required to create event"});
        return;
    }


    db.createEvent(etid_used).then((result) => {
        let eid = result.data[0].eid;
        db.updateEvent(eid, etyid, etid_used, name, start, end, show, null, initializeWithData, null, description).then((result) => {
            res.send(result);
        });
    });

    // // if concurrency is provided, check if it already exists
    // if(concurrency){
    //     db.getEvent_concurrency(concurrency).then((result) => {
    //         if(result.data.length > 0){
    //             res.status(400).send({message: "Concurrency already exists"});
    //             return;
    //         }else{
    //             db.createEvent(etid_used).then((result) => {
    //                 res.send(result.data);
    //             })
    //         }
    //     })
    // }else{
    //     db.createEvent(etid_used).then((result) => {
    //         res.send(result.data);
    //     })
    // }

    

})

router.post("/", (req, res) => {

    // expecting eid in body, not OK if null
    // expecting etyid in body, OK if null
    // expecting etid_used in body, OK if null
    // expecting name in body, OK if null
    // expecting begin in body, OK if null
    // expecting end in body, OK if null
    // expecting show in body, OK if null
    // expecting open in body, OK if null
    // expecting data in body, OK if null
    // expecting location in body, OK if null
    // expecting description in body, OK if null

    var eid = req.body.eid;
    if(!eid){
        res.status(400).send({message: "eid property required to update event"});
        return;
    }

    var etyid = req.body.etyid;
    var etid_used = req.body.etid_used;
    var name = req.body.name;
    var start = req.body.start;
    var ending = req.body.ending;
    var show = req.body.show;
    var open = req.body.open;
    var data = req.body.data;
    var location = req.body.location;
    var description = req.body.description;
    if(!etyid) etyid = null;
    if(!etid_used) etid_used = null;
    if(!name) name = null;
    if(!start) start = null;
    if(!ending) ending = null;
    if(!show) show = null;
    if(!open) open = null;
    if(!data) data = null;
    if(!location) location = null;
    if(!description) description = null;

    db.updateEvent(eid, etyid, etid_used, name, start, ending, show, open, data, location, description).then((result) => {
        res.send(result);
    })

});

router.post("/delete", (req, res) => {

    // expecting eid in body, not OK if null

    var eid = req.body.eid;
    if(!eid){
        res.status(400).send({message: "eid property required to delete event"});
        return;
    }
    
    db.deleteEvent(eid).then((result) => {
        res.send(result);
    });
});



module.exports = (useDb) => {
    db = useDb;
    return router;
}