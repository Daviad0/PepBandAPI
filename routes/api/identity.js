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
        res.send(result);
    })
});

router.post("/users/:uid/role", async (req, res) => {
    // expecting rid in body, not OK if null

    if(!(await db.checkAccess(req.session.role, "other_users"))){
        res.status(403).send({message: "Access denied"});
        return;
    }

    if(!req.params.uid){
        res.status(400).send({message: "Missing uid"});
        return;
    }
    if(!req.body.rid){
        res.status(400).send({message: "Missing rid"});
        return;
    }

    // we need to see if the user giving the role has permission greater or equal to the role they have
    try{
        let userPermission = req.session.role.permission;
        let givingRole = await db.getRole(req.body.rid);
        if(userPermission <= givingRole.data[0].permission){
            res.status(403).send({message: "Cannot set role higher than or equal to your own"});
            return;
        }
    }catch(e){
        // if role doesn't exist for some reason (probably invalid input)
        res.status(400).send({message: "Invalid rid"});
        return;
    }
    

    let uid = req.body.uid;
    let rid = req.body.rid;

    db.setUserRole(uid, rid).then((result) => {
        res.send(result);
    });
});

router.post("/users/:uid/delete", async (req, res) => {

    // expecting uid in body, not OK if null

    if(!(await db.checkAccess(req.session.role, "other_users_remove"))){
        res.status(403).send({message: "Access denied"});
        return;
    }

    if(!req.params.uid){
        res.status(400).send({message: "Missing uid"});
        return;
    }

    let uid = req.params.uid;

    db.deleteIdentity_uid(uid).then((result) => {
        res.send(result);
    });

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


router.get("/roles", async (req, res) => {
    if(!(await db.checkAccess(req.session.role, "other_roles"))){
        res.status(403).send({message: "Access denied"});
        return;
    }

    db.getRoles().then((result) => {
        res.send(result);
    })
});

router.get("/roles/:rid", async (req, res) => {
    if(!(await db.checkAccess(req.session.role, "other_roles"))){
        res.status(403).send({message: "Access denied"});
        return;
    }

    db.getRole(req.params.rid).then((result) => {
        res.send(result.data);
    })

});

router.post("/roles/create", async (req, res) => {
    // expecting name in body, not OK if null

    if(!(await db.checkAccess(req.session.role, "other_roles_edit"))){
        res.status(403).send({message: "Access denied"});
        return;
    }

    let name = req.body.name;
    if(!name){
        res.status(400).send({message: "Missing name"});
        return;
    }

    db.setRole(null, req.body.name, null, null).then((result) => {
        let rid = result.data.recordset[0].rid;
        // we also want to get the role we just created to send back (with rid)
        db.getRole(rid).then((result) => {
            res.send(result);
        })
    });
});

router.post("/roles", async (req, res) => {
    
    // expecting name in body, OK if null
    // expecting permission in body, OK if null
    // expecting rid in body, not OK if null
    // expecting description in body, OK if null

    if(!(await db.checkAccess(req.session.role, "other_roles_edit"))){
        res.status(403).send({message: "Access denied"});
        return;
    }

    let name = req.body.name;
    let permission = req.body.permission;
    let rid = req.body.rid;
    let description = req.body.description;
    if(!name) name = null;
    if(!permission) permission = null;
    if(permission){
        let userPermission = req.session.role.permission;
        if(userPermission <= permission){
            res.status(403).send({message: "Cannot set permission higher than or equal to your own"});
            return;
        }
    }
    if(!rid){
        res.status(400).send({message: "Missing rid"});
        return;
    }
    if(!description) description = null;

    db.setRole(rid, name, permission, description).then((result) => {
        res.send(result);
    })
});

router.post("/roles/:rid/delete", async (req, res) => {
    
    // have to do some damage control to change roles of users with this role


        if(!(await db.checkAccess(req.session.role, "other_roles_remove"))){
            res.status(403).send({message: "Access denied"});
            return;
        }

        let usersWithRole = await db.getUsersWithRole(req.params.rid);

        if(usersWithRole.data.length > 0){
            res.status(400).send({message: "Cannot delete role with assigned users"});
            return;
        }
    
    
        db.deleteRole(req.params.rid).then((result) => {
            res.send(result);
        })
    
});



module.exports = (useDb) => {
    db = useDb;
    return router;
}