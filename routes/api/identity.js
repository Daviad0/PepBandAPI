const express = require('express');

const router = express.Router("/api/identity");

var db;

router.get("/role")

router.get('/overrides', (req, res) => {
    if(req.session.user){
        db.getOverrides_uid(req.session.user.uid).then((result) => {
            res.send(result.data);
        })
    } else {
        res.send({success: false, message: "Not logged in"});
    }
})

router.post('/override', (req, res) => {

    // expecting eid in body, not OK if null
    // expecting override in body, not OK if null

    if(!req.body.eid){
        res.send({success: false, message: "Missing eid"});
        return;
    }

    if(!req.body.override){
        res.send({success: false, message: "Missing override"});
        return;
    }

    if(req.session.user){
        db.setOverride(req.body.eid, req.session.user.uid, req.body.override).then((result) => {
            res.send(result);
        })
    } else {
        res.send({success: false, message: "Not logged in"});
    }
});

router.get("/users", async (req, res) => {
    if(!(await db.checkAccess(req.session.role, "other_users"))){
        res.status(403).send({message: "Access denied"});
        return;
    }

    db.getIdentities().then((result) => {
        res.send(result.data);
    })
});
router.get("/find/:uid", async (req, res) => {
    if(!(await db.checkAccess(req.session.role, "other_users"))){
        res.status(403).send({success:false, message: "Access denied"});
        return;
    }

    db.getIdentity_uid(req.params.uid).then((result) => {
        res.send({success: true, data: result.data});
    })
});

router.get("/:uid/overrides", async (req, res) => {
    if(!(await db.checkAccess(req.session.role, "other_users_membership"))){
        res.status(403).send({message: "Access denied"});
        return;
    }

    // returns event objects based on an inner join
    db.getOverrides_uid(req.params.uid).then((result) => {
        res.send(result.data);
    });
});



module.exports = (useDb) => {
    db = useDb;
    return router;
}