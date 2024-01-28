const express = require('express');

const router = express.Router("/api/song");

var db;

router.get("/list", (req, res) => {
    db.getSongs().then((result) => {
        res.send(result);
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

    db.setSong(null, name, null, null, null, 0, null, null).then((result) => {
        let soid = result.data[0].soid;

        

        db.getSong(soid).then((result) => {
            res.send(result);
        });
    });
});

router.post("/:soid/clone", async (req, res) => {
    // expecting soid in body, not OK if null

    if(!(await db.checkAccess(req.session.role, "songs"))){
        res.status(403).send({message: "Access denied"});
        return;
    }

    var oldSoid = req.params.soid;
    if(!oldSoid){
        res.status(400).send({message: "soid property required to clone song"});
        return;
    }

    let oldSong = await db.getSong(oldSoid);

    let name = oldSong.data[0].name;

    db.setSong(null, name, null, null, null, 0, null, null).then((result) => {

        let newSoid = result.data[0].soid;

        db.setSong(newSoid, name, oldSong.data[0].friendly_name, oldSong.data[0].modification, oldSong.data[0].artist, oldSong.data[0].duration, oldSong.data[0].source, oldSong.data[0].category).then((result) => {
            db.getSong(newSoid).then((result) => {
                res.send(result);
            });
        });;
    });
})

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
    var category = req.body.category;
    
    if(!name) name = null;
    if(!friendly_name) friendly_name = null;
    if(!artist) artist = null;
    if(!modification) modification = null;
    if(!duration) duration = null;
    if(!source) source = null;
    if(!category) category = null;

    db.setSong(soid, name, friendly_name, modification, artist, duration, source, category).then((result) => {
        res.send(result);
    });

});

module.exports = (useDb) => {
    db = useDb;
    return router;
}