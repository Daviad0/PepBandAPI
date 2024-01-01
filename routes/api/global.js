const express = require('express');

const router = express.Router("/api/global");

var db;

router.get("/config", async (req, res) => {
    var config = (await db.getConfig()).data;

    res.send(config);
});

router.get("/config/:cid", async (req, res) => {
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

module.exports = (useDb) => {
    db = useDb;
    return router;
}