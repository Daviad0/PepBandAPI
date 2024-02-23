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

router.get("/login", async (req, res) => {
    console.log(req.session.user);

    

    // config for images is prefixed with index_image_#
    var images = await await generateImagesList("index_images");


    try{
        res.render("alternate_login", {user: req.session.user, role: req.session.role, images: images});
    }catch(err){
        console.log(err);
    }
    
});

router.get("/events", async (req, res) => {

    var images = await generateImagesList("corner_images");
    var events = (await db.getEvents()).data;

    var eventTypes = (await db.getEventTypes()).data;

    res.render("events", {user: req.session.user, role: req.session.role, events: events, images: images, eventTypes: eventTypes});
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

router.get("/event/:eid/edit", async (req, res) => {
    var images = await generateImagesList("corner_images");
    // access control for later :)

    // if(!(await db.checkAccess(req.session.role, "event_edit"))){
        //     res.status(403).render("special/error", {user: req.session.user, role: req.session.role, error: {
        //         code: 403,
        //         message: "Access denied"  + (req.session.user ? "" : " (are you signed in?)")
        //     }});
        //     return;
        // }

    var event = (await db.getEvent(req.params.eid)).data;
    if(event.length == 0){
        res.status(404).render("special/error", {user: req.session.user, role: req.session.role, error: {
            code: 404,
            message: "Event not found"
        }});
        return;
    }

    event = event[0];
    var event_types = (await db.getEventTypes()).data;
    var event_templates = (await db.getEventTemplates()).data;


    // before we send back data, do a segment data check

    try{
        let formatted = JSON.parse(event.data);
        formatted.segments.forEach((segment) => {
            if(segment.slots == null || segment.slots == undefined){
                segment.slots = [];
                segment.error = true;
            }else{
                segment.error = undefined;
            }
        });
        event.data = JSON.stringify(formatted);
    }catch(e){
        event.data = "{}";
    }

    res.render("event_edit", {user: req.session.user, role: req.session.role, event: event, eventTypes: event_types, eventTemplates: event_templates, images: images});

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

router.get("/group/:gid", async (req, res) => {
    var images = await generateImagesList("corner_images");

    let gid = req.params.gid;
    if(gid == ""){
        res.redirect("/groups");
        return;
    }
    // check if gid is number
    if(isNaN(gid)){
        res.status(404).render("special/error", {user: req.session.user, role: req.session.role, error: {
            code: 404,
            message: "Group not found"
        }});
        return;
    }

    var group = (await db.getGroup(gid)).data;

    if(group.length == 0){
        res.status(404).render("special/error", {user: req.session.user, role: req.session.role, error: {
            code: 404,
            message: "Group not found"
        }});
        return;
    }

    group = group[0];

    let allMembership = (await db.getGroupMembers(gid)).data;
    let splits = (await db.getSplits(gid)).data;

    var gradientBackground = (await db.getConfigProperty_uniq_name("event_gradient_background")).data;

    if(gradientBackground.length > 0){
        group.gradientBackground = gradientBackground[0].value;
    }
    // check if color is in hex format
    if(group.color.match(/^#[0-9A-F]{6}$/i)){
        // generate RGBA representation
        var colorA = "rgba(" + parseInt(group.color.substring(1, 3), 16) + "," + parseInt(group.color.substring(3, 5), 16) + "," + parseInt(group.color.substring(5, 7), 16) + ",0.7)";
        var colorB = "rgba(" + parseInt(group.color.substring(1, 3), 16) + "," + parseInt(group.color.substring(3, 5), 16) + "," + parseInt(group.color.substring(5, 7), 16) + ",1)";

        group.gradientBackground = `linear-gradient(160deg, ${colorA}, ${colorB})`;
    }else{
        group.gradientBackground = "linear-gradient(160deg, rgba(0,0,0,0.7), rgba(0,0,0,1))";
    }

    

    res.render("group", {user: req.session.user, role: req.session.role, group: group, users: allMembership, splits: splits, images: images});

});

router.get("/event/:eid", async (req, res) => {

    // check if eid is number
    if(isNaN(req.params.eid)){
        res.status(404).render("special/error", {user: req.session.user, role: req.session.role, error: {
            code: 404,
            message: "Event not found"
        }});
        return;
    }

    var images = await generateImagesList("corner_images");
    var event = (await db.getEvent(req.params.eid)).data;

    if(event.length == 0){
        res.status(404).render("special/error", {user: req.session.user, role: req.session.role, error: {
            code: 404,
            message: "Event not found"
        }});
        return;
    }

    

    event = event[0];

    var eventTypes = (await db.getEventTypes()).data;

    var applicableEventType = eventTypes.find(e => e.etyid == event.etyid);
    if(applicableEventType){
        event.color = applicableEventType.color;
        event.icon = applicableEventType.icon;
        event.eventType = applicableEventType.name;
    }else{
        event.color = "black";
        event.icon = "question_mark";
        event.eventType = "Unknown";
    }

    var gradientBackground = (await db.getConfigProperty_uniq_name("event_gradient_background")).data;

    if(gradientBackground.length > 0){
        event.gradientBackground = gradientBackground[0].value;
    }
    // check if color is in hex format
    if(event.color.match(/^#[0-9A-F]{6}$/i)){
        // generate RGBA representation
        var colorA = "rgba(" + parseInt(event.color.substring(1, 3), 16) + "," + parseInt(event.color.substring(3, 5), 16) + "," + parseInt(event.color.substring(5, 7), 16) + ",0.7)";
        var colorB = "rgba(" + parseInt(event.color.substring(1, 3), 16) + "," + parseInt(event.color.substring(3, 5), 16) + "," + parseInt(event.color.substring(5, 7), 16) + ",1)";

        event.gradientBackground = `linear-gradient(160deg, ${colorA}, ${colorB})`;
    }else{
        event.gradientBackground = "linear-gradient(160deg, rgba(0,0,0,0.7), rgba(0,0,0,1))";
    }

    

    // before we send back data, do a segment data check

    try{
        let formatted = JSON.parse(event.data);
        formatted.segments.forEach((segment) => {
            if(segment.slots == null || segment.slots == undefined){
                segment.slots = [];
                segment.error = true;
            }else{
                segment.error = undefined;
            }
        });
        event.data = JSON.stringify(formatted);
    }catch(e){
        event.data = "{}";
    }


    res.render("event", {user: req.session.user, role: req.session.role, event: event, images: images});
});

router.get("/report/songs", async (req, res) => {

    // start and end date are optional
    // in the format YYYY-MM-DD

    let start = req.query.start;
    let end = req.query.end;

    let startBound = new Date(start);
    let endBound = new Date(end);
    if(isNaN(startBound.getTime())){
        startBound = new Date("1970-01-01");
    }
    if(isNaN(endBound.getTime())){
        endBound = new Date("2100-01-01");
    }

    var images = await generateImagesList("corner_images");

    var songUsages = (await db.getSongUsages()).data;
    var songs = (await db.getSongs()).data;

    var eventTypes = (await db.getEventTypes()).data;
    var events = (await db.getEvents()).data;

    var songUsageGroups = {};
    var songSums = {};
    songUsageGroups[-1] = [];
    eventTypes.forEach((eventType) => {
        songUsageGroups[eventType.etyid] = [];
    });

    songUsages.forEach((songUsage) => {
        let eid = songUsage.eid;

        let event = events.find(e => e.eid == eid);
        if(event){
            if(new Date(event.start) < startBound || new Date(event.start) > endBound){
                return;
            }
        }

        let soid = songUsage.soid;
        let count = songUsage.count;
        // add count and event to proper arrays to send back to frontend
        if(!songSums[soid]){
            songSums[soid] = 0;
        }
        songSums[soid] += count;

        if(event){
            songUsageGroups[event.etyid].push(songUsage);
        }else{
            songUsageGroups[-1].push(songUsage);
        }
    });

    // don't send back events
    res.render("report_usage", {user: req.session.user, role: req.session.role, songs: songs, songUsageGroups: songUsageGroups, eventTypes: eventTypes, songSums: songSums, images: images, start: start, end: end});

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