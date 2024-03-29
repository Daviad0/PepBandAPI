const express = require('express');

const router = express.Router("/api/groups");

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

router.get("/groups", async (req, res) => {
    if(! await permissionCheck(req, res, [])) return;
    
    var groups = (await db.getGroups()).data;

    res.send(groups);
});

router.get("/group/:gid", async (req, res) => {
   
    if(! await permissionCheck(req, res, [])) return;

    if(!req.params.gid){
        res.status(400).send({message: "Missing gid"});
        return;
    }
    
    var group = (await db.getGroup(req.params.gid)).data;

    res.send(group);

});

router.post("/group", async (req, res) => {
    // expecting gid in body, not OK if null
    // expecting name in body, OK if null
    // expecting icon in body, OK if null
    // expecting description in body, OK if null
    // expecting extra_data in body, OK if null

    if(! await permissionCheck(req, res, ["groups"])) return;
    
    if(!(await db.checkAccess(req.session.role, "groups"))){
        res.status(403).send({message: "Access denied"});
        return;
    }

    let gid = req.body.gid;
    let name = req.body.name;
    let icon = req.body.icon;
    let description = req.body.description;
    let extra_data = req.body.extra_data;
    let open = req.body.open;
    let color = req.body.color;

    if(!gid){
        res.status(400).send({message: "gid property required to update group"});
        return;
    }
    if(!name) name = null;
    if(!icon) icon = null;
    if(!description) description = null;
    if(!extra_data) extra_data = null;
    if(open == null || open == undefined) open = null;
    if(!color) color = null;

    db.setGroup(gid, name, icon, description, open, extra_data, color).then((result) => {
        res.send(result);
    });
});

router.post("/group/create", async (req, res) => {
    // maybe change this to be all one

    if(! await permissionCheck(req, res, ["groups"])) return;

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

    if(! await permissionCheck(req, res, ["groups"])) return;

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
    let open = oldGroup.data[0].open;
    let color = oldGroup.data[0].color;

    db.setGroup(null, name, null, null, null, null, null).then((result) => {

        let newGid = result.data[0].gid;

        db.getGroup(newGid).then((result) => {
            res.send(result);
        });

        db.setGroup(newGid, name, icon, description, open, extra_data, color).then((result) => {
            
        })
    });


});

router.post("/group/membership", async (req, res) => {

    // expecting uid in body, not OK if null
    // expecting gid in body, not OK if null
    // expecting elevated in body, OK if null

    // if this is for the user requesting to join a group, check for own join permissions and the group is open
    let uid = req.body.uid;
    let gid = req.body.gid;
    let elevated = req.body.elevated;

    if(uid == null){

        if(req.session.user == null){
            res.status(403).send({message: "Not logged in"});
            return;
        }

        

        uid = req.session.user.uid;
    }
    if(gid == null){
        res.status(400).send({message: "gid property required to join group"});
        return;
    }

    if(elevated == null) elevated = false;

    if(uid == req.session.user.uid){
        // if(!(await db.checkAccess(req.session.role, "groups_join"))){
        //     res.status(403).send({message: "Access denied"});
        //     return;
        // }

        if(! await permissionCheck(req, res, ["groups_join"])) return;

        let group = await db.getGroup(gid);
        if(group.data.length == 0){
            res.status(404).send({message: "Group not found"});
            return;
        }
        group = group.data[0];
        if(group.open == 0){
            res.status(403).send({message: "Group is not open"});
            return;
        }

        // elevated is automatically FALSE for the user requesting to join
        db.setGroupMember(uid, gid, false).then((result) => {
            res.send(result);
        });

    }else{
        

        if(! await permissionCheck(req, res, ["groups", "other_users_membership"])) return;

        let group = await db.getGroup(gid);
        if(group.data.length == 0){
            res.status(404).send({message: "Group not found"});
            return;
        }
        group = group.data[0];

        // check to make sure the user has elevated permissions to add other users to the group
        // this can either be through the power permission OR being a manager of the group

        // let currentGroupMembers = await db.getGroupMembers(gid);
        // let userRecord = currentGroupMembers.data.find(r => r.uid == req.session.user.uid && r.gid == gid);
        // if(!userRecord || userRecord.elevated == false){
        //     res.status(403).send({message: "Access denied"});
        //     return;
        // }

        // if(!(await db.checkAccess(req.session.role, "other_users_membership"))){
        //     res.status(403).send({message: "Access denied"});
        //     return;
        // }

        db.setGroupMember(uid, gid, elevated).then((result) => {
            res.send(result);
        });
    }

});

router.post("/group/membership/delete", async (req, res) => {
    // expecting uid in body, not OK if null
    // expecting gid in body, not OK if null

    // if(!(await db.checkAccess(req.session.role, "other_users_membership"))){
    //     res.status(403).send({message: "Access denied"});
    //     return;
    // }

    if(! await permissionCheck(req, res, ["groups", "other_users_membership"])) return;

    let uid = req.body.uid;
    let gid = req.body.gid;

    if(!uid){
        res.status(400).send({message: "uid property required to delete group membership"});
        return;
    }
    if(!gid){
        res.status(400).send({message: "gid property required to delete group membership"});
        return;
    }

    db.deleteGroupMember(uid, gid).then((result) => {
        res.send(result);
    });


});

// this is only for people to leave their own groups!
router.post("/group/:gid/leave", async (req, res) => {
    // if(!(await db.checkAccess(req.session.role, "groups_leave"))){
    //     res.status(403).send({message: "Access denied"});
    //     return;
    // }

    if(! await permissionCheck(req, res, ["groups_join"])) return;

    if(req.session.user == null){
        res.status(403).send({message: "Not logged in"});
        return;
    }

    var gid = req.params.gid;

    if(!gid){
        res.status(400).send({message: "gid property required to leave group"});
        return;
    }

    db.deleteGroupMember(req.session.user.uid, gid).then((result) => {
        res.send(result);
    });


});

router.post("/group/:gid/delete", async (req, res) => {

    // check to see if there are any splits that use this group

    // if(!(await db.checkAccess(req.session.role, "groups"))){
    //     res.status(403).send({message: "Access denied"});
    //     return;
    // }

    if(! await permissionCheck(req, res, ["groups"])) return;

    var gid = req.params.gid;

    if(!gid){
        res.status(400).send({message: "gid property required to delete group"});
        return;
    }

    db.deleteGroup(gid).then((result) => {
        res.send(result);
    });


});

router.get("/splits", async (req, res) => {

    if(! await permissionCheck(req, res, [])) return;

    var splits = (await db.getSplits()).data;

    res.send(splits);
});

router.get("/split/:sid", async (req, res) => {

    if(! await permissionCheck(req, res, [])) return;

    if(!req.params.sid){
        res.status(400).send({message: "Missing sid"});
        return;
    }

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

    if(! await permissionCheck(req, res, ["splits"])) return;

    let sid = req.body.sid;
    let name = req.body.name;
    let gid = req.body.gid;
    let icon = req.body.icon;
    let open = req.body.open;
    let extra_data = req.body.extra_data;
    let color = req.body.color;
    if(!sid){
        res.status(400).send({message: "sid property required to update split"});
        return;
    }
    if(!name) name = null;
    if(!gid) gid = null;
    if(!icon) icon = null;
    if(open == null || open == undefined) open = null;
    if(!extra_data) extra_data = null;
    if(!color) color = null;

    db.setSplit(sid, gid, name, icon, open, extra_data, color).then((result) => {
        res.send(result);
    });
});

router.post("/split/create", async (req, res) => {
    // maybe change this to be all one

    if(! await permissionCheck(req, res, ["splits", "groups"])) return;

    let name = req.body.name;
    let gid = req.body.gid;

    db.setSplit(null, gid, name, null, null, null, null).then((result) => {
        let sid = result.data[0].sid;

        db.getSplit(sid).then((result) => {
            res.send(result);
        });
    });


});

router.post("/split/clone", async (req, res) => {
    // expecting sid in body, not OK if null

    if(! await permissionCheck(req, res, ["splits", "groups"])) return;

    var oldSid = req.body.sid;
    if(!oldSid){
        res.status(400).send({message: "sid property required to clone split"});
        return;
    }

    let oldSplit = await db.getSplit(oldSid);

    let name = oldSplit.data[0].name;
    let gid = oldSplit.data[0].gid;
    let icon = oldSplit.data[0].icon;
    let open = oldSplit.data[0].open;
    let extra_data = oldSplit.data[0].extra_data;
    let color = oldSplit.data[0].color;

    db.setSplit(null, gid, name, null, null, null, null).then((result) => {

        let newSid = result.data[0].sid;

        db.getSplit(newSid).then((result) => {
            res.send(result);
        });

        db.setSplit(newSid, gid, name, icon, open, extra_data, color).then((result) => {
            
        })
    });

});

router.post("/split/membership", async (req, res) => {
    
    // expecting uid in body, not OK if null
    // expecting sid in body, not OK if null
    // expecting elevated in body, OK if null

    // if this is for the user requesting to join a split, check for own join permissions and the split is open
    let uid = req.body.uid;
    let sid = req.body.sid;
    let elevated = req.body.elevated;

    if(uid == null){

        if(req.session.user == null){
            res.status(403).send({message: "Not logged in"});
            return;
        }

        uid = req.session.user.uid;
    }
    if(sid == null){
        res.status(400).send({message: "sid property required to join split"});
        return;
    }

    if(elevated == null) elevated = false;

    if(uid == req.session.user.uid){
        // if(!(await db.checkAccess(req.session.role, "splits_join"))){
        //     res.status(403).send({message: "Access denied"});
        //     return;
        // }

        if(! await permissionCheck(req, res, ["splits_join"])) return;

        let split = await db.getSplit(sid);
        if(split.data.length == 0){
            res.status(404).send({message: "Split not found"});
            return;
        }
        split = split.data[0];
        if(split.open == 0){
            res.status(403).send({message: "Split is not open"});
            return;
        }

        // elevated is automatically FALSE for the user requesting to join
        db.setSplitMember(uid, sid, false).then((result) => {
            res.send(result);
        });

    }else{
        
        if(! await permissionCheck(req, res, ["splits", "other_users_membership"])) return;

        let split = await db.getSplit(sid);
        if(split.data.length == 0){
            res.status(404).send({message: "Split not found"});
            return;
        }
        split = split.data[0];

        // check to make sure the user has elevated permissions to add other users to the split
        // this can either be through the power permission OR being a manager of the split

        // let currentSplitMembers = await db.getSplitMembers(sid);
        // let userRecord = currentSplitMembers.data.find(r => r.uid == req.session.user.uid && r.sid == sid);
        // if(!userRecord || userRecord.elevated == false){
        //     res.status(403).send({message: "Access denied"});
        //     return
        // 
        // if(!(await db.checkAccess(req.session.role, "other_users_membership"))){
        //     res.status(403).send({message: "Access denied"});
        //     return;
        // 
        // 
        db.setSplitMember(uid, sid, elevated).then((result) => {
            res.send(result);
        });
    }
});

router.post("/split/membership/delete", async (req, res) => {
    // expecting uid in body, not OK if null
    // expecting sid in body, not OK if null

    // if(!(await db.checkAccess(req.session.role, "other_users_membership"))){
    //     res.status(403).send({message: "Access denied"});
    //     return;
    // }

    if(! await permissionCheck(req, res, ["splits", "other_users_membership"])) return;

    let uid = req.body.uid;
    let sid = req.body.sid;

    if(!uid){
        res.status(400).send({message: "uid property required to delete split membership"});
        return;
    }
    if(!sid){
        res.status(400).send({message: "sid property required to delete split membership"});
        return;
    }

    db.deleteSplitMember(uid, sid).then((result) => {
        res.send(result);
    });


});

// this is only for people to leave their own splits!
router.post("/split/:sid/leave", async (req, res) => {
    // if(!(await db.checkAccess(req.session.role, "splits_leave"))){
    //     res.status(403).send({message: "Access denied"});
    //     return;
    // }

    if(! await permissionCheck(req, res, ["splits_join"])) return;

    if(req.session.user == null){
        res.status(403).send({message: "Not logged in"});
        return;
    }

    var sid = req.params.sid;

    if(!sid){
        res.status(400).send({message: "sid property required to leave split"});
        return;
    }

    db.deleteSplitMember(req.session.user.uid, sid).then((result) => {
        res.send(result);
    });
});

router.post("/split/:sid/delete", async (req, res) => {
    // if(!(await db.checkAccess(req.session.role, "splits"))){
    //     res.status(403).send({message: "Access denied"});
    //     return;
    // }

    if(! await permissionCheck(req, res, ["splits", "groups"])) return;

    var sid = req.params.sid;

    if(!sid){
        res.status(400).send({message: "sid property required to delete split"});
        return;
    
    }

    db.deleteSplit(sid).then((result) => {
        res.send(result);
    });

});

module.exports = (useDb) => {
    db = useDb;
    return router;
}