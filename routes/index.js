const express = require('express');

const router = express.Router("/");

var db;


// public folder
router.use(express.static('public'));
router.use(express.static('views/partials'));

async function permissionsRequest(req, permissions){
    let available_permissions = [];
    for(var p = 0; p < permissions.length; p++){
        if((await db.checkAccess(req.session.role, permissions[p]))){
            available_permissions.push(permissions[p]);
        }
    }
    return available_permissions;
}

router.get("/authenticate", (req, res) => {
    res.redirect("/account/authenticate");
})

async function generateImagesList(config_name){
    var images = [];

    var config = (await db.getConfig()).data;

    config = config.find(c => c.uniq_name.startsWith(config_name));

    if(config){
        var cImages = config.value.split(" ");
        for(var i = 0; i < cImages.length; i++){
            images.push(cImages[i]);
        }
    }

    // shuffle images around 

    for(var i = 0; i < images.length; i++){
        var j = Math.floor(Math.random() * (i + 1));
        var temp = images[i];
        images[i] = images[j];
        images[j] = temp;
    }

    return images;
}

router.get("/", async (req, res) => {
    console.log(req.session.user);

    

    // config for images is prefixed with index_image_#
    var images = await await generateImagesList("index_images");


    try{
        res.render("index", {user: req.session.user, role: req.session.role, images: images});
    }catch(err){
        console.log(err);
    }
    
});

router.get("/events", async (req, res) => {

    var images = await generateImagesList("corner_images");
    var events = (await db.getEvents()).data;

    res.render("events", {user: req.session.user, role: req.session.role, events: events, images: images});
});

router.get("/config", async (req, res) => {
    var images = await generateImagesList("corner_images");
    var config = (await db.getConfig()).data;

    res.render("config", {user: req.session.user, role: req.session.role, config: config, images: images});
    
});

router.get("/roles", async (req, res) => {
    var images = await generateImagesList("corner_images");
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
            message: "Access denied" + (req.session.user ? "" : " (are you signed in?)")
        }});
        return;
    }

    res.render("roles_edit", {user: req.session.user, role: req.session.role, roles: roles, default_role: default_role, images: images});

});

router.get("/users", async (req, res) => {
    var images = await generateImagesList("corner_images");
    var roles = (await db.getRoles()).data;

    if(!(await db.checkAccess(req.session.role, "other_users"))){
        res.status(403).render("special/error", {user: req.session.user, role: req.session.role, error: {
            code: 403,
            message: "Access denied" + (req.session.user ? "" : " (are you signed in?)")
        }});
        return;
    }

    // permissions to reflect on the front-end ONLY
    let permissions = await permissionsRequest(req, ["other_roles_assign", "other_users"]);

    res.render("users", {user: req.session.user, role: req.session.role, permissions: permissions, roles: roles, images: images});

});

router.get("/event/create", async (req, res) => {
    var images = await generateImagesList("corner_images");
        // access control for later :)

        // if(!(await db.checkAccess(req.session.role, "event_create"))){
        //     res.status(403).render("special/error", {user: req.session.user, role: req.session.role, error: {
        //         code: 403,
        //         message: "Access denied"  + (req.session.user ? "" : " (are you signed in?)")
        //     }});
        //     return;
        // }
    
        var event_types = (await db.getEventTypes()).data;
        var event_templates = (await db.getEventTemplates()).data;

        res.render("event_create", {user: req.session.user, role: req.session.role, eventTypes: event_types, eventTemplates: event_templates, images: images});
    
});

router.get("/event/types", async (req, res) => {

    var images = await generateImagesList("corner_images");
    // access control for later :)

    // if(!(await db.checkAccess(req.session.role, "event_types_edit"))){
        //     res.status(403).render("special/error", {user: req.session.user, role: req.session.role, error: {
        //         code: 403,
        //         message: "Access denied"  + (req.session.user ? "" : " (are you signed in?)")
        //     }});
        //     return;
        // }

    var event_types = (await db.getEventTypes()).data;

    res.render("event_types", {user: req.session.user, role: req.session.role, eventTypes: event_types, images: images});
});

router.get("/event/template", async (req, res) => {
    res.redirect("/event/templates");
});

router.get("/event/templates", async (req, res) => {
    
    var images = await generateImagesList("corner_images");
    // access control for later :)

    // if(!(await db.checkAccess(req.session.role, "event_templates_edit"))){
        //     res.status(403).render("special/error", {user: req.session.user, role: req.session.role, error: {
        //         code: 403,
        //         message: "Access denied"  + (req.session.user ? "" : " (are you signed in?)")
        //     }});
        //     return;
        // }

    var event_templates = (await db.getEventTemplates()).data;

    res.render("event_templates", {user: req.session.user, role: req.session.role, eventTemplates: event_templates, images: images});
});

router.get("/event/template/:etid", async (req, res) => {
        
    var images = await generateImagesList("corner_images");
    // access control for later :)

    // if(!(await db.checkAccess(req.session.role, "event_templates_edit"))){
        //     res.status(403).render("special/error", {user: req.session.user, role: req.session.role, error: {
        //         code: 403,
        //         message: "Access denied"  + (req.session.user ? "" : " (are you signed in?)")
        //     }});
        //     return;
        // }

    var etid = req.params.etid;

    if(etid == ""){
        res.redirect("/event/templates");
        return;
    }

    if(etid == "create"){
        db.setEventTemplate(null, null, null, null).then((result) => {
            let etid = result.data[0].etid;
            db.setEventTemplate(etid, null, "New Event Template", `{"segments": []}`).then((result) => {
                res.redirect("/event/template/" + etid);
            });
        
            
        });
        return;
    }

    var event_types = (await db.getEventTypes()).data;
    var event_template = (await db.getEventTemplate(req.params.etid)).data;

    if(event_template.length == 0){
        res.status(404).render("special/error", {user: req.session.user, role: req.session.role, error: {
            code: 404,
            message: "Event template not found"
        }});
        return;
    }

    event_template = event_template[0];
    try{
        let formatted = JSON.parse(event_template.data);
    }catch(e){
        event_template.data = "{}";
    }

    res.render("event_template_edit", {user: req.session.user, role: req.session.role, eventTemplate: event_template, eventTypes: event_types, images: images});
});

router.get("/songs", async (req, res) => {
    var images = await generateImagesList("corner_images");
    var songs = (await db.getSongs()).data;

    res.render("songs", {user: req.session.user, role: req.session.role, songs: songs, images: images});

});

router.get("/splits/edit", async (req, res) => {
    var images = await generateImagesList("corner_images");
    var splits = (await db.getSplits()).data;

    res.render("splits_edit", {user: req.session.user, role: req.session.role, splits: splits, images: images});
});

router.get("/groups/edit", async (req, res) => {
    var images = await generateImagesList("corner_images");
    var groups = (await db.getGroups()).data;

    res.render("groups_edit", {user: req.session.user, role: req.session.role, groups: groups, images: images});
});



// WARNING: this route must be last

// router.get("*", (req, res) => {
//     res.status(404).render("special/error", {user: req.session.user, role: req.session.role, error: {
//         code: 404,
//         message: "Page not found"
//     }});
// });



module.exports = (useDb) => {
    db = useDb;
    return router;
}