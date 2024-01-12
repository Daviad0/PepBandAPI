const express = require('express');

const router = express.Router("/");

var db;


// public folder
router.use(express.static('public'));
router.use(express.static('views/partials'));


router.get("/authenticate", (req, res) => {
    res.redirect("/account/authenticate");
})

router.get("/", (req, res) => {
    console.log(req.session.user);
    res.render("index", {user: req.session.user, role: req.session.role});
});

router.get("/events", async (req, res) => {

    var events = (await db.getEvents()).data;

    res.render("events", {user: req.session.user, role: req.session.role, events: events});
});

router.get("/config", async (req, res) => {
    var config = (await db.getConfig()).data;

    res.render("config", {user: req.session.user, role: req.session.role, config: config});
    
});

router.get("/roles/edit", async (req, res) => {
    var roles = (await db.getRoles()).data;
    var default_role = (await db.getConfigProperty_uniq_name("registered_default_rid_mtu"));
    if(default_role.data.length == 0){
        default_role = null;
    }else{
        default_role = default_role.data[0].value;
    }

    // check if user has access to other_roles
    if(!(await db.checkAccess(req.session.role, "other_roles"))){
        res.status(403).render("special/error", {user: req.session.user, role: req.session.role, error: {
            code: 403,
            message: "Access denied"
        }});
        return;
    }

    res.render("roles_edit", {user: req.session.user, role: req.session.role, roles: roles, default_role: default_role});

});

router.get("/roles/assign", async (req, res) => {
    var roles = (await db.getRoles()).data;
    var identities = (await db.getIdentities()).data;

    // check if user has access to other_roles
    if(!(await db.checkAccess(req.session.role, "other_roles_assign"))){
        res.status(403).render("special/error", {user: req.session.user, role: req.session.role, error: {
            code: 403,
            message: "Access denied"
        }});
        return;
    }

    res.render("roles_assign", {user: req.session.user, role: req.session.role, roles: roles, identities: identities});

});

router.get("/event/create", async (req, res) => {
        // access control for later :)

        // if(!(await db.checkAccess(req.session.role, "event_create"))){
        //     res.status(403).render("special/error", {user: req.session.user, role: req.session.role, error: {
        //         code: 403,
        //         message: "Access denied"
        //     }});
        //     return;
        // }
    
        var event_types = (await db.getEventTypes()).data;

        res.render("event_create", {user: req.session.user, role: req.session.role, eventTypes: event_types});
    
});

router.get("/event/types", async (req, res) => {

    // access control for later :)

    // if(!(await db.checkAccess(req.session.role, "event_types_edit"))){
        //     res.status(403).render("special/error", {user: req.session.user, role: req.session.role, error: {
        //         code: 403,
        //         message: "Access denied"
        //     }});
        //     return;
        // }

    var event_types = (await db.getEventTypes()).data;

    res.render("event_types", {user: req.session.user, role: req.session.role, eventTypes: event_types});
});

router.get("/event/templates", async (req, res) => {
    
    // access control for later :)

    // if(!(await db.checkAccess(req.session.role, "event_templates_edit"))){
        //     res.status(403).render("special/error", {user: req.session.user, role: req.session.role, error: {
        //         code: 403,
        //         message: "Access denied"
        //     }});
        //     return;
        // }

    var event_templates = (await db.getEventTemplates()).data;

    res.render("event_templates", {user: req.session.user, role: req.session.role, eventTemplates: event_templates});
});

router.get("/event/template/:etid", async (req, res) => {
        
    // access control for later :)

    // if(!(await db.checkAccess(req.session.role, "event_templates_edit"))){
        //     res.status(403).render("special/error", {user: req.session.user, role: req.session.role, error: {
        //         code: 403,
        //         message: "Access denied"
        //     }});
        //     return;
        // }

    var etid = req.params.etid;

    if(etid == "create"){
        db.setEventTemplate(null, null, null, null).then((result) => {
            let etid = result.data.recordset[0].etid;
        
            res.redirect("/event/template/" + etid);
        });
        return;
    }

    var event_template = (await db.getEventTemplate(req.params.etid)).data;

    res.render("event_template_edit", {user: req.session.user, role: req.session.role, eventTemplate: event_template});
});



// WARNING: this route must be last

router.get("*", (req, res) => {
    res.status(404).render("special/error", {user: req.session.user, role: req.session.role, error: {
        code: 404,
        message: "Page not found"
    }});
});



module.exports = (useDb) => {
    db = useDb;
    return router;
}