const express = require('express');

const router = express.Router("/event");

var db;


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

router.post("/create", (req, res) => {

    // expecting etid_used in body, OK if null
    // expecting concurrency in body, OK if null

    var etid_used = req.body.etid_used;
    if(!etid_used) etid_used = null;

    var concurrency = req.body.concurrency;
    if(!concurrency) concurrency = null;

    // if concurrency is provided, check if it already exists
    if(concurrency){
        db.getEvent_concurrency(concurrency).then((result) => {
            if(result.data.length > 0){
                res.status(400).send({message: "Concurrency already exists"});
                return;
            }else{
                db.createEvent(etid_used).then((result) => {
                    res.send(result.data);
                })
            }
        })
    }else{
        db.createEvent(etid_used).then((result) => {
            res.send(result.data);
        })
    }

    

})

router.post("/update", (req, res) => {

    // expecting eid in body, not OK if null
    // expecting etyid in body, OK if null
    // expecting etid_used in body, OK if null
    // expecting name in body, OK if null
    // expecting begin in body, OK if null
    // expecting end in body, OK if null
    // expecting show in body, OK if null
    // expecting open in body, OK if null
    // expecting data in body, OK if null

    var eid = req.body.eid;
    if(!eid){
        res.status(400).send({message: "eid property required to update event"});
        return;
    }

    var etyid = req.body.etyid;
    var etid_used = req.body.etid_used;
    var name = req.body.name;
    var begin = req.body.begin;
    var end = req.body.end;
    var show = req.body.show;
    var open = req.body.open;
    var data = req.body.data;
    if(!etyid) etyid = null;
    if(!etid_used) etid_used = null;
    if(!name) name = null;
    if(!begin) begin = null;
    if(!end) end = null;
    if(!show) show = null;
    if(!open) open = null;
    if(!data) data = null;

    db.updateEvent(eid, etyid, etid_used, name, begin, end, show, open, data).then((result) => {
        res.send(result.data);
    })

});

module.exports = (useDb) => {
    db = useDb;
    return router;
}