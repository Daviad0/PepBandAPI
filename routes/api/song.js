const express = require('express');

const router = express.Router("/api/song");

var db;

router.get("/list", (req, res) => {
    db.getSongs().then((result) => {
        res.send(result.data);
    })
});

router.get("/:soid", (req, res) => {
    db.getSong(req.params.soid).then((result) => {
        res.send(result.data);
    })
});

router.post("/create", (req, res) => {
    // maybe change this to be all one
    db.setSong(null, null, null, null, null, null, null).then((result) => {
        let soid = result.data.recordset[0].soid;

        db.getSong(soid).then((result) => {
            res.send(result);
        });
    });
});

router.post("/", (req, res) => {
    // expecting soid in body, not OK if null
    // expecting name in body, OK if null
    // expecting friendly_name in body, OK if null
    // expecting artist in body, OK if null
    // expecting modification in body, OK if null
    // expecting duration in body, OK if null
    // expecting source in body, OK if null

    var soid = req.body.soid;
    if(!soid){
        res.status(400).send({message: "soid property required to update song"});
        return;
    }

    var name = req.body.name;
    var friendly_name = req.body.friendly_name;
    var artist = req.body.artist;
    var modification = req.body.modification;
    var duration = req.body.duration;
    var source = req.body.source;
    
    if(!name) name = null;
    if(!friendly_name) friendly_name = null;
    if(!artist) artist = null;
    if(!modification) modification = null;
    if(!duration) duration = null;
    if(!source) source = null;

    db.setSong(soid, name, friendly_name, modification, artist, duration, source).then((result) => {
        res.send(result.data);
    });

});

module.exports = (useDb) => {
    db = useDb;
    return router;
}