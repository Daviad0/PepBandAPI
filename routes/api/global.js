const express = require('express');

const router = express.Router("/api/global");

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

    if(! await permissionCheck(req, res, ["announcements", "announcements_edit"])) return;

    let name = req.body.name;
    let content = req.body.content;
    let icon = req.body.icon;
    let published = req.body.published;
    let until = req.body.until;
    let uid = req.session.user.uid;

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

    db.setAnnouncement(null, name, content, icon, uid, published, until).then((result) => {
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

    if(! await permissionCheck(req, res, ["announcements_edit"])) return;

    let aid = req.body.aid;
    let name = req.body.name;
    let content = req.body.content;
    let icon = req.body.icon;
    let published = req.body.published;
    let until = req.body.until;

    if(!aid){
        res.status(400).send({message: "Missing aid"});
        return;
    }

    db.setAnnouncement(aid, name, content, icon, null, published, until).then((result) => {
        res.send(result);
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

module.exports = (useDb) => {
    db = useDb;
    return router;
}