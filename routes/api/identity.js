const express = require('express');

var crypto = require('crypto');

const router = express.Router("/api/identity");

var db;


function hashPassword(password){
    let salt = crypto.randomBytes(16).toString('hex');
    let iterations = 1000;
    let hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return {salt: salt, hash: hash, iterations: iterations};
}

function verifyPassword(password, hash, salt){
    let verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return verifyHash == hash;
}



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

    if(!req.params.uid){
        res.status(400).send({success: false, message: "Missing uid"});
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

    if(!req.params.uid){
        res.status(400).send({message: "Missing uid"});
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

    if(!req.params.rid){
        res.status(400).send({message: "Missing rid"});
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
        let rid = result.data[0].rid;
        // we also want to get the role we just created to send back (with rid)
        db.getRole(rid).then((result) => {
            res.send(result);
        })
    });
});

router.post("/roles/:rid/permission", async (req, res) => {
    // expecting permission in body, not OK if null

    // if(!(await db.checkAccess(req.session.role, "other_roles_edit"))){
    //     res.status(403).send({message: "Access denied"});
    //     return;
    // }

    if(!req.params.rid){
        res.status(400).send({message: "Missing rid"});
        return;
    }
    if(!req.body.permission){
        res.status(400).send({message: "Missing permission"});
        return;
    }

    let permission = req.body.permission;

    // check access to make change here

    db.setPermission_rid(req.params.rid, permission).then((result) => {
        res.send(result);
    });
});

router.post("/roles/:rid/permission/delete", async (req, res) => {
    // expecting permission in body, not OK if null

    // if(!(await db.checkAccess(req.session.role, "other_roles_edit"))){
    //     res.status(403).send({message: "Access denied"});
    //     return;
    // }

    if(!req.params.rid){
        res.status(400).send({message: "Missing rid"});
        return;
    }
    if(!req.body.permission){
        res.status(400).send({message: "Missing permission"});
        return;
    }

    let permission = req.body.permission;

    // check access to make change here

    db.deletePermission_rid(req.params.rid, permission).then((result) => {
        res.send(result);
    });
});

router.post("/roles", async (req, res) => {
    
    // expecting name in body, OK if null
    // expecting power in body, OK if null
    // expecting rid in body, not OK if null
    // expecting description in body, OK if null

    if(!(await db.checkAccess(req.session.role, "other_roles_edit"))){
        res.status(403).send({message: "Access denied"});
        return;
    }

    let name = req.body.name;
    let power = req.body.power;
    let rid = req.body.rid;
    let description = req.body.description;
    if(!name) name = null;
    if(!power) power = null;
    if(power){
        let userPower = req.session.role.power;
        if(userPermission <= power){
            res.status(403).send({message: "Cannot set power higher than or equal to your own"});
            return;
        }
    }
    if(!rid){
        res.status(400).send({message: "Missing rid"});
        return;
    }
    if(!description) description = null;

    // check role power against user power
    let role = await db.getRole(rid);
    if(role.data.length == 0){
        res.status(400).send({message: "Invalid rid"});
        return;
    }
    role = role.data[0];
    let userPower = req.session.role.power;
    if(userPower <= role.power){
        res.status(403).send({message: "Cannot set power higher than or equal to your own"});
        return;
    }

    db.setRole(rid, name, power, description).then((result) => {
        res.send(result);
    })
});

router.post("/roles/:rid/delete", async (req, res) => {
    
    // have to do some damage control to change roles of users with this role

    if(!req.params.rid){
        res.status(400).send({message: "Missing rid"});
        return;
    }

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

router.post("/login", async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    if(!username || !password){
        res.status(400).send({message: "Missing username or password"});
        return;
    }

    // mtu_sso is treated as the username
    let userObject = await db.getIdentity_mtusso(username);
    if(userObject.data.length == 0){
        res.status(400).send({message: "Invalid username or password"});
        return;
    }
    userObject = userObject.data[0];

    let alternateAuthUser = await db.getAlternateAuthentication_uid(userObject.uid);

    if(alternateAuthUser.data.length > 0){
        alternateAuthUser = alternateAuthUser.data[0];
        if(verifyPassword(password, alternateAuthUser.pwhash, alternateAuthUser.pwsalt)){
            req.session.user = userObject;
            db.setAlternateAuthentication_seen(userObject.uid);
            res.send({success: true, message: "Logged in"});
            return;
        }
    }

    res.status(400).send({message: "Invalid username or password"});
});

router.post("/register", async (req, res) => {
    // treat email as username
    let email = req.body.email;
    let password = req.body.password;
    let full_name = req.body.full_name;
    
    if(!email || !password || !full_name){
        res.status(400).send({message: "Missing email, password, or full_name"});
        return;
    }

    let userObject = await db.getIdentity_mtusso(email);
    if(userObject.data.length > 0){
        res.status(400).send({message: "Username already exists"});
        return;
    }

    let hashedPassword = hashPassword(password);

    db.createAlternateAuthentication(email, full_name, hashedPassword.hash, hashedPassword.salt, hashedPassword.iterations).then((result) => {
        var uid = result.data[0].uid;
        var userObject = db.getIdentity_uid(uid);
        if(!userObject.success || userObject.data.length == 0){
            res.status(500).send({message: "Error creating user"});
            return;
        }
        req.session.user = userObject.data[0];
        
        res.send(result);
    });

});


module.exports = (useDb) => {
    db = useDb;
    return router;
}