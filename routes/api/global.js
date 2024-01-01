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
    console.log("Creating");
    db.setConfig(uniq_name, null, null, req.session.user.uid, null).then((result) => {
        console.log(result)
        res.send(result);
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

module.exports = (useDb) => {
    db = useDb;
    return router;
}