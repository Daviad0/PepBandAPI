const express = require('express');
const CASAuthentication = require('cas-authentication');

const router = express.Router("/account");

var db;

var cas = new CASAuthentication({
    cas_url         : 'https://sso.mtu.edu/cas',
    service_url     : 'https://pep.robosmrt.com',
    cas_version     : '3.0',
    renew           : false,
    is_dev_mode     : true,
    dev_mode_user   : 'djreeves',
    dev_mode_info   : {
        uid: 1313131
    },
    session_name    : 'cas_user',
    session_info    : 'cas_userinfo',
    destroy_session : false
});

router.get( '/authenticate', cas.bounce, (req, res) => {
    console.log(db);
    db.setup_user(req.session[cas.session_name], req.session[cas.session_info].uid).then((result) => {
        if(result != null){
            db.update_user_information(result.uid, req.session[cas.session_info].displayName);
            req.session.user = result;
            res.redirect('/');
        } else {
            res.send(result);
        }
    })
});

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

router.get( '/logout', cas.logout );


module.exports = (useDb) => {
    console.log("CAS: " + db)
    db = useDb;
    return router;
}