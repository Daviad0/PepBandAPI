const express = require('express');

const router = express.Router("/api/event");

var db;

/*
 LOGIN - user must be logged in
*/
async function permissionCheck(req, res, permissions_allowed){

    if(permissions_allowed.length == 0) return true;
    if(!req.session.user) {
        res.status(403).send({message: "Access denied"});
        return false;
    }

    for(var i = 0; i < permissions_allowed.length; i++){
        if(permissions_allowed[i] == "LOGIN"){
            if(req.session.user){
                return true;
            }
        }
        if(await db.checkAccess(req.session.role, permissions_allowed[i])){
            return true;
        }
    }

    res.status(403).send({message: "Access denied"});
    return false;
}

router.get("/type/list", async (req, res) => {

    if(! await permissionCheck(req, res, [])) return;


    db.getEventTypes().then((result) => {
        res.send(result.data);
    })
});

router.get("/type/:etyid", async (req, res) => {

    if(! await permissionCheck(req, res, [])) return;

    if(!req.params.etyid){
        res.status(400).send({message: "etyid property required to get event type"});
        return;
    }

    db.getEventType(req.params.etyid).then((result) => {
        res.send(result);
    })
});

router.post("/type/create", async (req, res) => {
    
    if(! await permissionCheck(req, res, ["event_types"])) return;
    
    db.setEventType(null, null, null, null, null).then((result) => {
        let etyid = result.data[0].etyid;

        db.getEventType(etyid).then((result) => {
            res.send(result);
        });
    });

});

router.post("/type", async (req, res) => {
    // expecting etyid in body, not OK if null
    // expecting name in body, OK if null
    // expecting icon in body, OK if null
    // expecting color in body, OK if null
    // expecting extra_data in body, OK if null

    if(! await permissionCheck(req, res, ["event_types"])) return;

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

router.post("/type/delete", async (req, res) => {
    
    // expecting etyid in body, not OK if null
    // need to fix results if there are event templates that use this type

    if(! await permissionCheck(req, res, ["event_types_remove"])) return;

    var etyid = req.body.etyid;
    if(!etyid){
        res.status(400).send({message: "etyid property required to delete event type"});
        return;
    }

    db.deleteEventType(etyid).then((result) => {
        res.send(result);
    });

});





router.get("/template/list", async (req, res) => {

    if(! await permissionCheck(req, res, [])) return;

    db.getEventTemplates().then((result) => {
        res.send(result.data);
    })
});

router.get("/template/:etid", async (req, res) => {

    if(! await permissionCheck(req, res, [])) return;

    if(!req.params.etid){
        res.status(400).send({message: "etid property required to get event template"});
        return;
    }

    db.getEventTemplate(req.params.etid).then((result) => {
        res.send(result);
    })
});

router.post("/template/create", async (req, res) => {

    if(! await permissionCheck(req, res, ["events_templates"])) return;

    // maybe change this to be all one
    db.setEventTemplate(null, null, null, null).then((result) => {
        let etid = result.data[0].etid;

        db.getEventTemplate(etid).then((result) => {
            res.send(result);
        });
    });
});

router.post("/template", async (req, res) => {
    // expecting etid in body, not OK if null
    // expecting etyid in body, OK if null
    // expecting name in body, OK if null
    // expecting data in body, OK if null

    if(! await permissionCheck(req, res, ["events_templates"])) return;

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

router.post("/template/clone", async (req, res) => {
    // expecting etid in body, not OK if null

    if(! await permissionCheck(req, res, ["events_templates"])) return;

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

router.post("/template/delete", async (req, res) => {

    // expecting etid in body, not OK if null

    if(! await permissionCheck(req, res, ["events_templates_remove"])) return;

    var etid = req.body.etid;
    if(!etid){
        res.status(400).send({message: "etid property required to delete event template"});
        return;
    }

    db.deleteEventTemplate(etid).then((result) => {
        res.send(result.data);
    });
});

router.get("/list", async (req, res) => {

    if(! await permissionCheck(req, res, [])) return;

    db.getEvents().then((result) => {

        var events = result.data;
        // filter out events that are not shown
        events = events.filter(e => e.show == 1);

        res.send({events: events});
    })
});

router.get("/:eid", async (req, res) => {

    if(! await permissionCheck(req, res, [])) return;

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

router.get("/:eid/overrides", async (req, res) => {

    if(! await permissionCheck(req, res, ["events_attendance_view", "events_attendance"])) return;

    // returns user objects based on an inner join
    db.getParticipationOverrides_eid(req.params.eid).then((result) => {
        res.send(result.data);
    });
});

router.get("/:uid/overrides", async (req, res) => {

    if(! await permissionCheck(req, res, ["events_attendance_view", "events_attendance", "other_users_attendance"])) return;

    db.getParticipationOverrides_uid(req.params.uid).then((result) => {
        res.send(result.data);
    });

});

router.post("/:eid/override", async (req, res) => {
    
    if(! await permissionCheck(req, res, ["events_attendance", "other_users_attendance"])) return;

    var eid = req.params.eid;
    var uid = req.body.uid;
    var override = req.body.override;

    if(uid == undefined){
        uid = req.session.user ? req.session.user.uid : null;
    }

    if(!uid){
        res.status(400).send({message: "uid property required to override event"});
        return;
    }
    if(override == null || ![0,1,2, "0", "1", "2"].includes(override)){
        res.status(400).send({message: "override property required to override event"});
        return;
    }

    let accessToOverride = false;
    if(req.session.user){
        if(req.session.user.uid == uid){
            accessToOverride = true;
        }
    }
    if((await db.checkAccess(req.session.role, "events_attendance"))){
        accessToOverride = true;
    }

    if(!accessToOverride){
        res.status(403).send({message: "Access denied"});
        return;
    }

    db.setParticipationOverride(eid, uid, override).then((result) => {
        res.send(result);
    });

});

router.post("/:eid/override/delete", async (req, res) => {
    if(! await permissionCheck(req, res, ["events_attendance", "other_users_attendance"])) return;
    
    var eid = req.params.eid;
    var uid = req.body.uid;

    if(uid == undefined){
        uid = req.session.user ? req.session.user.uid : null;
    }

    if(!eid){
        res.status(400).send({message: "eid property required to delete override"});
        return;
    }

    if(!uid){
        res.status(400).send({message: "uid property required to delete override"});
        return;
    }

    let accessToOverride = false;
    if(req.session.user){
        if(req.session.user.uid == uid){
            accessToOverride = true;
        }
    }
    if((await db.checkAccess(req.session.role, "events_attendance"))){
        accessToOverride = true;
    }

    if(!accessToOverride){
        res.status(403).send({message: "Access denied"});
        return;
    }

    db.deleteParticipationOverride(eid, uid).then((result) => {
        res.send(result);
    });


});

router.post("/:eid/split", async (req, res) => {
    
    // expecting sid in body, not OK if null
    // ADDITIONAL CHECK FOR GROUP_MANAGEMENT or SPLIT_MANAGEMENT
    if(! await permissionCheck(req, res, ["events_attendance"])) return;

    var eid = req.params.eid;
    var sid = req.body.sid;

    if(!eid){
        res.status(400).send({message: "eid property required to split event"});
        return;
    }

    if(!sid){
        res.status(400).send({message: "sid property required to split event"});
        return;
    }  

    // check if a record already exists

    let existing = (await db.getEventSplits_sid(sid)).data;
    existing = existing.filter(e => e.eid == eid);
    if(existing.length > 0){
        res.status(400).send({message: "You are already attending!"});
        return;
    }

    db.setEventSplit(eid, sid).then((result) => {
        res.send(result);
    });
    
    
});

router.post("/:eid/split/delete", async (req, res) => {
    
    // expecting sid in body, not OK if null

    // ADDITIONAL CHECK FOR GROUP_MANAGEMENT or SPLIT_MANAGEMENT
    if(! await permissionCheck(req, res, ["events_attendance"])) return;

    var eid = req.params.eid;
    var sid = req.body.sid;

    if(!eid){
        res.status(400).send({message: "eid property required to delete split"});
        return;
    }

    if(!sid){
        res.status(400).send({message: "sid property required to delete split"});
        return;
    }

    db.deleteEventSplit(eid, sid).then((result) => {
        res.send(result);
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

    if(! await permissionCheck(req, res, ["events", "events_edit"])) return;
    
    var etid_used = req.body.etid_used;
    var name = req.body.name;
    var description = req.body.description;
    var start = req.body.start;
    var end = req.body.end;
    var show = req.body.show;
    var etyid = req.body.etyid;
    var location = req.body.location;

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
    if(!location) location = "";
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
        db.updateEvent(eid, etyid, etid_used, name, start, end, show, null, initializeWithData, location, description).then((result) => {
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

router.post("/", async (req, res) => {

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

    if(! await permissionCheck(req, res, ["events_edit"])) return;

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
    if(show == null || show == undefined) show = null;
    if(!open) open = null;
    if(!data) data = null;
    if(!location) location = null;
    if(!description) description = null;

    

    db.updateEvent(eid, etyid, etid_used, name, start, ending, show, open, data, location, description).then((result) => {
        db.getEvent(eid).then((result) => {
            // handle data and make songUsage changes
            let data = result.data[0].data;
            try{
                let parsedData = JSON.parse(data);
                let soidCounts = {};
                parsedData.segments.forEach(segment => {
                    segment.slots.forEach(slot => {
                        if(slot.type == "song"){
                            if(!soidCounts[slot.soid]){
                                soidCounts[slot.soid] = 0;
                            }
                            soidCounts[slot.soid]++;
                        }
                    });
                });

                Object.keys(soidCounts).forEach(soid => {
                    db.setSongUsage(soid, eid, soidCounts[soid]);
                });
            }catch(e){
                console.log(e);
            }
        });
        
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