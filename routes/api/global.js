const express = require('express');

const router = express.Router("/api/global");

var db;

const multer = require('multer');
const fs = require('fs');

const upload = multer({
    dest: 'temp/'
})

const { uploadFile, retrieveFiles } = require('../../images.js');

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

router.get("/permissions", async (req, res) => {

    if(! await permissionCheck(req, res, ["permissions_view"])) return;

    var permissions = (await db.getPermissions());

    res.send(permissions);
});

router.get("/config", async (req, res) => {

    if(! await permissionCheck(req, res, ["config_view", "config"])) return;

    var config = (await db.getConfig()).data;

    res.send(config);
});

router.get("/config/:cid", async (req, res) => {
    
    if(! await permissionCheck(req, res, ["config_view", "config"])) return;
    
    if(!cid){
        res.status(400).send({message: "Missing cid"});
        return;
    }
    var config = (await db.getConfig_cid(req.params.cid)).data;

    res.send(config);
});

router.post("/config/new", async (req, res) => {
    // expecting uniq_name in body, not OK if null
    // expecting type in body, not OK if null
        // type can be "string", "number", "boolean", "date", or "datetime"

    // if(!(await db.checkAccess(req.session.role, "config_modify"))){
    //     res.status(403).send({message: "Access denied"});
    //     return;
    // }

    if(! await permissionCheck(req, res, ["config"])) return;

    if(!req.session.user){
        res.status(403).send({message: "Not logged in"});
        return;
    }

    let uniq_name = req.body.uniq_name;
    let type = req.body.type;

    if(!uniq_name){
        res.status(400).send({message: "Missing uniq_name"});
        return;
    }
    if(!type){
        res.status(400).send({message: "Missing type"});
        return;
    }
    // config can only contain letters, numbers, and underscores
    if(!/^[a-zA-Z0-9_]+$/.test(uniq_name)){
        res.status(400).send({message: "Invalid uniq_name"});
        return;
    }
    // type can only be "string", "number", "boolean", "date", or "datetime"
    if(!["string", "number", "boolean", "date", "datetime"].includes(type)){
        res.status(400).send({message: "Invalid type"});
        return;
    }

    // check if config already exists
    var config = (await db.getConfigProperty_uniq_name(uniq_name)).data;
    if(config.length > 0){
        res.status(400).send({message: "Config already exists"});
        return;
    }

    db.setConfig(uniq_name, null, null, req.session.user.uid, type).then((result) => {

        // we also want to get the config we just created to send back
        db.getConfigProperty_uniq_name(uniq_name).then((result) => {
            res.send(result);
        })
    });
});

router.post("/config", async (req, res) => {

    // expecting uniq_name in body, not OK if null
    // expecting value in body, OK if null
    // expecting name in body, OK if null
    // expecting type in body, OK if null

    // if(!(await db.checkAccess(req.session.role, "config_modify"))){
    //     res.status(403).send({message: "Access denied"});
    //     return;
    // }

    if(! await permissionCheck(req, res, ["config"])) return;

    if(!req.session.user){
        res.status(403).send({message: "Not logged in"});
        return;
    }

    let uniq_name = req.body.uniq_name;

    if(!uniq_name){
        res.status(400).send({message: "Missing uniq_name"});
        return;
    }

    let value = req.body.value;
    let name = req.body.name;
    let type = req.body.type;
    if(!uniq_name) uniq_name = null;
    if(!value) value = null;
    if(!name) name = null;
    if(!type) type = null;
    let uid = req.session.user.uid;

    db.setConfig(uniq_name, name, value, uid, type).then((result) => {
        res.send(result);
    })
});

router.post("/config/:uniq_name/delete", async (req, res) => {
    
    // if(!(await db.checkAccess(req.session.role, "config_modify"))){
    //     res.status(403).send({message: "Access denied"});
    //     return;
    // }

    if(! await permissionCheck(req, res, ["config_remove"])) return;

    if(!req.params.uniq_name){
        res.status(400).send({message: "Missing uniq_name"});
        return;
    }

    if(!req.session.user){
        res.status(403).send({message: "Not logged in"});
        return;
    }

    var required_configs = process.env.REQUIRED_CONFIG.split(",");

    if(required_configs.includes(req.params.uniq_name)){
        res.status(400).send({message: "Cannot delete required config"});
        return;
    }

    db.deleteConfig(req.params.uniq_name).then((result) => {
        res.send(result);
    });
});

router.get("/announcement/list", async (req, res) => {

    if(! await permissionCheck(req, res, [])) return;

    // check specific user permissions to see each announcement

    var announcements = (await db.getAnnouncements()).data;

    // only get announcements that are active
    // active means between published and until the expiration date (if it exists)

    announcements = announcements.filter((announcement) => {
        var now = new Date();
        var published = new Date(announcement.published);
        var until = new Date(announcement.until);

        if(until == "Invalid Date") {
            until = new Date("9999-12-31");
        }

        if(now >= published && now <= until){
            return true;
        } else {
            return false;
        }
    });

    res.send(announcements);
});

router.get("/announcement/:aid", async (req, res) => {
    
    if(! await permissionCheck(req, res, [])) return;

    if(!req.params.aid){
        res.status(400).send({message: "Missing aid"});
        return;
    }

    var announcement = (await db.getAnnouncement(req.params.aid)).data;

    announcement.active = false;
    let now = new Date();
    let published = new Date(announcement.published);
    let until = new Date(announcement.until);
    if(until == "Invalid Date") {
        until = new Date("9999-12-31");
    }

    if(now >= published && now <= until){
        announcement.active = true;
    }

    res.send(announcement);
    
});

router.get("/announcement/:uid/list", async (req, res) => {
    
    if(! await permissionCheck(req, res, [])) return;

    if(!req.params.uid){
        res.status(400).send({message: "Missing uid"});
        return;
    }

    var announcements = (await db.getAnnouncements_uid(req.params.uid)).data;

    // gets announcements that have been posted by the user
    let now = new Date();

    announcements.forEach((announcement) => {
        announcement.active = false;
        let published = new Date(announcement.published);
        let until = new Date(announcement.until);
        if(until == "Invalid Date") {
            until = new Date("9999-12-31");
        }
    
        if(now >= published && now <= until){
            announcement.active = true;
        }
    });


    res.send(announcements);
    
});

router.post("/announcement/create", async (req, res) => {

    // expecting name in body, not OK if null
    // expecting content in body, not OK if null
    // expecting icon in body, OK if null
    // expecting published in body, not OK if null
    // expecting until in body, OK if null
    // expecting postToEveryone in body, OK if null
    // expecting postToGids in body, OK if null
    // expecting postToSids in body, OK if null
    // expecting notifyNow in body, OK if null
        // notifyNow is only valid if published is in the past
    // expecting related_event in body, OK if null

    if(! await permissionCheck(req, res, ["announcements", "announcements_edit"])) return;

    let name = req.body.name;
    let content = req.body.content;
    let icon = req.body.icon;
    let published = req.body.published;
    let until = req.body.until;
    let uid = req.session.user.uid;
    let related_event = req.body.related_event;

    let postToEveryone = req.body.postToEveryone;
    let postToGids = req.body.postToGids;
    let postToSids = req.body.postToSids;
    let notifyNow = req.body.notifyNow;



    if(!name){
        res.status(400).send({message: "Missing name"});
        return;
    }
    if(!content){
        res.status(400).send({message: "Missing content"});
        return;
    }
    if(!published){
        res.status(400).send({message: "Missing published"});
        return;
    }
    if(!until){
        until = null;
    }
    if(!icon){
        icon = null;
    }

    if(!postToEveryone){
        postToEveryone = false;
    }
    if(!postToGids){
        postToGids = [];
    }
    if(!postToSids){
        postToSids = [];
    }
    if(!notifyNow){
        notifyNow = false;
    }
    if(!related_event){
        related_event = null;
    }

    db.setAnnouncement(null, name, content, icon, uid, published, until, postToEveryone, notifyNow, related_event).then((result) => {
        
        // set the announcement to the groups and splits

        let aid = result.data[0].aid;

        postToGids.forEach((gid) => {
            db.setAnnouncementGroup(aid, gid, true);
        });

        postToSids.forEach((sid) => {
            db.setAnnouncementSplit(aid, sid, true);
        });


        res.send(result);
    });
});

router.post("/announcement", async (req, res) => {
    
    // expecting aid in body, not OK if null
    // expecting name in body, OK if null
    // expecting content in body, OK if null
    // expecting icon in body, OK if null
    // expecting published in body, OK if null
    // expecting until in body, OK if null
    // expecting global in body, OK if null
    // expecting notified in body, OK if null
    // expecting related_event in body, OK if null
    // expecting postToGids in body, OK if null
    // expecting postToSids in body, OK if null

    if(! await permissionCheck(req, res, ["announcements_edit"])) return;

    let aid = req.body.aid;
    let name = req.body.name;
    let content = req.body.content;
    let icon = req.body.icon;
    let published = req.body.published;
    let until = req.body.until;
    let global = req.body.global;
    let notified = req.body.notified;
    let related_event = req.body.related_event;

    let postToGids = req.body.postToGids;
    let postToSids = req.body.postToSids;

    let currentAnnouncementGroups = (await db.getAnnouncementsGroups_aid(aid)).data;
    let currentAnnouncementSplits = (await db.getAnnouncementsSplits_aid(aid)).data;

    let removeFromGroups = currentAnnouncementGroups.filter((group) => {
        return !postToGids.includes(group.gid);
    });
    let removeFromSplits = currentAnnouncementSplits.filter((split) => {
        return !postToSids.includes(split.sid);
    });

    let addToGroups = postToGids.filter((gid) => {
        return !currentAnnouncementGroups.find((group) => {
            return group.gid == gid;
        });
    });

    let addToSplits = postToSids.filter((sid) => {
        return !currentAnnouncementSplits.find((split) => {
            return split.sid == sid;
        });
    });



    if(!aid){
        res.status(400).send({message: "Missing aid"});
        return;
    }

    if(!name){
        name = null;
    }
    if(!content){
        content = null;
    }
    if(!icon){
        icon = null;
    }
    if(!published){
        published = null;
    }
    if(!until){
        until = null;
    }
    if(!global){
        global = null;
    }
    if(!notified){
        notified = null;
    }
    if(!related_event){
        related_event = null;
    }

    db.setAnnouncement(aid, name, content, icon, null, published, until, global, notified, related_event).then((result) => {
        res.send(result);
    });

    removeFromGroups.forEach((group) => {
        db.deleteAnnouncementGroup(aid, group.gid);
    });
    removeFromSplits.forEach((split) => {
        db.deleteAnnouncementSplit(aid, split.sid);
    });

    addToGroups.forEach((gid) => {
        db.setAnnouncementGroup(aid, gid, true);
    });
    addToSplits.forEach((sid) => {
        db.setAnnouncementSplit(aid, sid, true);
    });

});

router.post("/announcement/:aid/delete", async (req, res) => {
        
    if(! await permissionCheck(req, res, ["announcements_edit"])) return;

    if(!req.params.aid){
        res.status(400).send({message: "Missing aid"});
        return;
    }

    db.deleteAnnouncement(req.params.aid).then((result) => {
        res.send(result);
    });
    
});

router.get("/images", async (req, res) => {
    
    // if(! await permissionCheck(req, res, ["images"])) return;

    retrieveFiles(10, (files) => {
        res.send({success: true, data: files});
    });
    
});

let allowedFileTypes = [".png", ".jpg", ".jpeg", ".json", ".gif"];

router.post("/image", upload.single("file"), async (req, res) => {


    if(!req.file){
        res.status(400).send({message: "Missing file"});
        return;
    }

    let filePath = req.file.path;

    let name = req.file.originalname;
    
    // if(! await permissionCheck(req, res, ["images"])) {
    //     fs.unlinkSync(filePath);
    //     return;
    // }

    // if(!req.files || !req.files.image){
    //     res.status(400).send({message: "Missing image"});
    //     fs.unlinkSync(filePath);

    //     return;
    // }

    if(!allowedFileTypes.includes(name.slice(name.lastIndexOf(".")).toLowerCase())){
        res.status(400).send({message: "Invalid file type"});
        fs.unlinkSync(filePath);
        return;
    }

    let destination = "images/" + name;

    uploadFile(filePath, destination, (err, file) => {
        if(err){
            res.status(500).send({message: "Error uploading file"});
            fs.unlinkSync(filePath);
            return;
        }

        // strip URL of query parameter
        file = file.split("?")[0];

        res.send({success: true, url: file});
    });

    
    




    // // let image = req.files.image;

    // // let image_id = (await db.setImage(image)).data[0].image_id;

    // res.send({success: true});
});

module.exports = (useDb) => {
    db = useDb;
    return router;
}