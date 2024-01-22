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

router.post("/create", async (req, res) => {
    // expecting name in body, OK if null

    if(!(await db.checkAccess(req.session.role, "songs"))){
        res.status(403).send({message: "Access denied"});
        return;
    }

    let name = req.body.name;

    db.setSong(null, name, null, null, null, 0, null).then((result) => {
        let soid = result.data.recordset[0].soid;

        db.getSong(soid).then((result) => {
            res.send(result);
        });
    });
});

router.post("/:soid/delete", async (req, res) => {
    // expecting soid in body, not OK if null

    if(!(await db.checkAccess(req.session.role, "songs_remove"))){
        res.status(403).send({message: "Access denied"});
        return;
    }

    var soid = req.params.soid;
    if(!soid){
        res.status(400).send({message: "soid property required to delete song"});
        return;
    }

    db.deleteSong(soid).then((result) => {
        res.send(result);
    });

});

router.get("/:soid/usage", async (req, res) => {
    // expecting soid in body, not OK if null

    if(!(await db.checkAccess(req.session.role, "songs"))){
        res.status(403).send({message: "Access denied"});
        return;
    }

    var soid = req.params.soid;
    if(!soid){
        res.status(400).send({message: "soid property required to get song usage"});
        return;
    }

    db.getSongUsage(soid).then((result) => {
        res.send(result);
    });


});

router.post("/", async (req, res) => {
    // expecting soid in body, not OK if null
    // expecting name in body, OK if null
    // expecting friendly_name in body, OK if null
    // expecting artist in body, OK if null
    // expecting modification in body, OK if null
    // expecting duration in body, OK if null
    // expecting source in body, OK if null

    if(!(await db.checkAccess(req.session.role, "songs"))){
        res.status(403).send({message: "Access denied"});
        return;
    }

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
        res.send(result);
    });

});

module.exports = (useDb) => {
    db = useDb;
    return router;
}