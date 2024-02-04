const express = require('express');

const router = express.Router("/api/event");

var db;

router.get("/groups", async (req, res) => {
    var groups = (await db.getGroups()).data;

    res.send(groups);
});

router.get("/group/:gid", async (req, res) => {
    var group = (await db.getGroup(req.params.gid)).data;

    res.send(group);

});

router.post("/group", async (req, res) => {
    // expecting gid in body, not OK if null
    // expecting name in body, OK if null
    // expecting icon in body, OK if null
    // expecting description in body, OK if null
    // expecting extra_data in body, OK if null

    if(!(await db.checkAccess(req.session.role, "groups"))){
        res.status(403).send({message: "Access denied"});
        return;
    }

    let gid = req.body.gid;
    let name = req.body.name;
    let icon = req.body.icon;
    let description = req.body.description;
    let extra_data = req.body.extra_data;

    if(!gid){
        res.status(400).send({message: "gid property required to update group"});
        return;
    }
    if(!name) name = null;
    if(!icon) icon = null;
    if(!description) description = null;
    if(!extra_data) extra_data = null;

    db.setGroup(gid, name, icon, description, extra_data).then((result) => {
        res.send(result);
    });
});

router.post("/group/create", async (req, res) => {
    // maybe change this to be all one

    if(!(await db.checkAccess(req.session.role, "groups"))){
        res.status(403).send({message: "Access denied"});
        return;
    }

    let name = req.body.name;

    db.setGroup(null, name, null, null, null).then((result) => {
        let gid = result.data[0].gid;

        db.getGroup(gid).then((result) => {
            res.send(result);
        });
    });
});

router.post("/group/clone", async (req, res) => {
    // expecting gid in body, not OK if null

    if(!(await db.checkAccess(req.session.role, "groups"))){
        res.status(403).send({message: "Access denied"});
        return;
    }

    var oldGid = req.body.gid;
    if(!oldGid){
        res.status(400).send({message: "gid property required to clone group"});
        return;
    }

    let oldGroup = await db.getGroup(oldGid);

    let name = oldGroup.data[0].name;
    let icon = oldGroup.data[0].icon;
    let description = oldGroup.data[0].description;
    let extra_data = oldGroup.data[0].extra_data;

    db.setGroup(null, name, icon, description, extra_data).then((result) => {

        let newGid = result.data[0].gid;

        db.getGroup(newGid).then((result) => {
            res.send(result);
        });
    });


});

router.post("/group/:gid/delete", async (req, res) => {

    // check to see if there are any splits that use this group

    // if(!(await db.checkAccess(req.session.role, "groups"))){
    //     res.status(403).send({message: "Access denied"});
    //     return;
    // }

    var gid = req.params.gid;

    db.deleteGroup(gid).then((result) => {
        res.send(result);
    });


});

router.get("/splits", async (req, res) => {
    var splits = (await db.getSplits()).data;

    res.send(splits);
});

router.get("/split/:sid", async (req, res) => {
    var split = (await db.getSplit(req.params.sid)).data;

    res.send(split);
});

router.post("/split", async (req, res) => {
    // expecting sid in body, not OK if null
    // expecting name in body, OK if null
    // expecting gid in body, OK if null
    // expecting icon in body, OK if null
    // expecting uid_primary in body, OK if null
    // expecting extra_data in body, OK if null

    if(!(await db.checkAccess(req.session.role, "splits"))){
        res.status(403).send({message: "Access denied"});
        return;
    }

    let sid = req.body.sid;
    let name = req.body.name;
    let gid = req.body.gid;
    let icon = req.body.icon;
    let uid_primary = req.body.uid_primary;
    let extra_data = req.body.extra_data;
    if(!sid){
        res.status(400).send({message: "sid property required to update split"});
        return;
    }
    if(!name) name = null;
    if(!gid) gid = null;
    if(!icon) icon = null;
    if(!uid_primary) uid_primary = null;
    if(!extra_data) extra_data = null;

    db.setSplit(sid, name, gid, icon, uid_primary, extra_data).then((result) => {
        res.send(result);
    });
});

router.post("/split/create", async (req, res) => {
    // maybe change this to be all one

    if(!(await db.checkAccess(req.session.role, "splits"))){
        res.status(403).send({message: "Access denied"});
        return;
    }

    let name = req.body.name;

    db.setSplit(null, name, null, null, null, null).then((result) => {
        let sid = result.data[0].sid;

        db.getSplit(sid).then((result) => {
            res.send(result);
        });
    });


});

router.post("/split/clone", async (req, res) => {
    // expecting sid in body, not OK if null

    if(!(await db.checkAccess(req.session.role, "splits"))){
        res.status(403).send({message: "Access denied"});
        return;
    }

    var oldSid = req.body.sid;
    if(!oldSid){
        res.status(400).send({message: "sid property required to clone split"});
        return;
    }

    let oldSplit = await db.getSplit(oldSid);

    let name = oldSplit.data[0].name;
    let gid = oldSplit.data[0].gid;
    let icon = oldSplit.data[0].icon;
    let uid_primary = oldSplit.data[0].uid_primary;
    let extra_data = oldSplit.data[0].extra_data;

    db.setSplit(null, name, gid, icon, uid_primary, extra_data).then((result) => {

        let newSid = result.data[0].sid;

        db.getSplit(newSid).then((result) => {
            res.send(result);
        });
    });

});

router.post("/split/:sid/delete", async (req, res) => {
    // if(!(await db.checkAccess(req.session.role, "splits"))){
    //     res.status(403).send({message: "Access denied"});
    //     return;
    // }

    var sid = req.params.sid;

    db.deleteSplit(sid).then((result) => {
        res.send(result);
    });

});

module.exports = (useDb) => {
    db = useDb;
    return router;
}