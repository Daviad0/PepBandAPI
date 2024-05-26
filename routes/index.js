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

async function shouldParticipateInEvent(req, eid){
    // same algorithm as participatingInEvent, but do not factor in overrides
    if(req.session.user){
            
            let splits = (await db.getEventSplits_eid(eid)).data;
            for(var i = 0; i < splits.length; i++){
                let split = splits[i];
                let membership = (await db.getSplitMembers(split.sid)).data.find(m => m.uid == req.session.user.uid);
                if(membership){
                    return true;
                }
            }
        
    }
    return false;
}

async function participatingInEvent(req, eid){
    if(req.session.user){

        let override = (await db.getParticipationOverride(eid, req.session.user.uid)).data;
        if(override.length > 0){
            override = override[0];

            if(override.override == 1){
                return true;
            }
            if(override.override == 0){
                return false;
            }
        }

        

        if(await shouldParticipateInEvent(req, eid)){
            return true;
        }
    }
    return false;
}

/*
 LOGIN - user must be logged in
*/
async function permissionCheck(req, res, permissions_allowed){

    if(permissions_allowed.length == 0) return true;
    if(!req.session.user){
        res.status(403).render("special/error", {user: req.session.user, role: req.session.role, error: {
            code: 403,
            message: "Access denied" + (req.session.user ? "" : " (are you signed in?)")
        }});
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

    res.status(403).render("special/error", {user: req.session.user, role: req.session.role, error: {
        code: 403,
        message: "Access denied" + (req.session.user ? "" : " (are you signed in?)")
    }});
    return false;
}

router.get("/authenticate", (req, res) => {
    console.log(req.query);

    let isApp = req.isApp == true || req.query.app == "true";

    res.redirect("/account/authenticate" + (isApp ? "?app=true" : ""));
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
    

    if(! await permissionCheck(req, res, [])) return;

    

    // config for images is prefixed with index_image_#
    var images = await await generateImagesList("index_images");


    try{
        res.render("index", {user: req.session.user, role: req.session.role, images: images});
    }catch(err){
        console.log(err);
    }
    
});

router.get("/login", async (req, res) => {
    

    if(! await permissionCheck(req, res, [])) return;

    if(req.session.user){
        res.redirect("/");
        return;
    }

    

    // config for images is prefixed with index_image_#
    var images = await await generateImagesList("index_images");


    try{
        res.render("alternate_login", {user: req.session.user, role: req.session.role, images: images});
    }catch(err){
        console.log(err);
    }
    
});

router.get("/events", async (req, res) => {

    if(! await permissionCheck(req, res, [])) return;

    var images = await generateImagesList("corner_images");
    var events = (await db.getEvents()).data;

    var eventTypes = (await db.getEventTypes()).data;


    var permissionsToPass = (await permissionsRequest(req, ["events", "events_edit", "announcements", "announcements_edit"]));
    showHiddenEvents = permissionsToPass.includes("events") || permissionsToPass.includes("events_edit");


    var eventsTaken = 0;
    // TODO: Allow configuration on eventsTaken
    for(var i = 0; i < events.length && eventsTaken < 10; i++){

        // check if the ending is before now
        // if it is, remove it from the list

        if(new Date(events[i].ending) < new Date()){
            events.splice(i, 1);
            i--;
            continue;
        }

        if(!showHiddenEvents && !events[i].show){
            events.splice(i, 1);
            i--;
            continue;
        }

        if(await participatingInEvent(req, events[i].eid)){
            events[i].participating = true;
        }else{
            events[i].participating = false;
        }

       

        eventsTaken++;
    }

    events = events.slice(0, 10);

    let announcements = (await db.getAnnouncements()).data;
    let announcementsToPass = [];
    let announcementsTaken = 0;
    let now = new Date();
    for(var i = 0; i < announcements.length && announcementsTaken < 5; i++){
        let announcement = announcements[i];
        

        if(new Date(announcement.published) > now || new Date(announcement.until) < now){
            continue;
        }

        if(announcement.global){
            announcementsToPass.push(announcement);
            announcementsTaken++;
        }
    }

    res.render("events", {user: req.session.user, role: req.session.role, events: events, images: images, eventTypes: eventTypes, permissions: permissionsToPass, announcements: announcementsToPass});
});



router.get("/config", async (req, res) => {
    
    if(! await permissionCheck(req, res, ["config_view", "config"])) return;
   
    var permissionsToPass = (await permissionsRequest(req, ["config", "config_view"]));

    var images = await generateImagesList("corner_images");
    var config = (await db.getConfig()).data;

    res.render("config", {user: req.session.user, role: req.session.role, config: config, images: images, permissions: permissionsToPass});
    
});

router.get("/roles", async (req, res) => {

    if(! await permissionCheck(req, res, ["other_roles", "other_roles_edit"])) return;

    var permissionsToPass = (await permissionsRequest(req, ["other_roles", "other_roles_edit", "config", "config_view"]));
    

    var images = await generateImagesList("corner_images");
    var roles = (await db.getRoles()).data;
    var default_role = (await db.getConfigProperty_uniq_name("registered_default_rid_mtu"));
    if(default_role.data.length == 0){
        default_role = null;
    }else{
        default_role = default_role.data[0].value;
    }

    for(var i = 0; i < roles.length; i++){
        let role = roles[i];
        let permissions = (await db.getPermissions_rid(role.rid)).data;
        role.permissions = permissions;
    }

    // check if user has access to other_roles
    // if(!(await db.checkAccess(req.session.role, "other_roles"))){
    //     res.status(403).render("special/error", {user: req.session.user, role: req.session.role, error: {
    //         code: 403,
    //         message: "Access denied" + (req.session.user ? "" : " (are you signed in?)")
    //     }});
    //     return;
    // }

    let userPower = req.session.role.power;

    res.render("roles_edit", {user: req.session.user, role: req.session.role, roles: roles, default_role: default_role, images: images, permissions: permissionsToPass, power: userPower});

});

router.get("/users", async (req, res) => {

    if(! await permissionCheck(req, res, ["other_users", "other_roles_assign", "other_users_remove"])) return;

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

    if(! await permissionCheck(req, res, ["events", "events_edit"])) return;

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

    if(! await permissionCheck(req, res, ["events_types", "events_types_remove"])) return;

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

    if(! await permissionCheck(req, res, ["events_edit", "events_attendance"])) return;

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

    var splits = (await db.getSplits()).data;

    var gradientBackground = (await db.getConfigProperty_uniq_name("event_gradient_background")).data;

    if(gradientBackground.length > 0){
        group.gradientBackground = gradientBackground[0].value;
    }
    

    for(var i = 0; i < splits.length; i++){
        let split = splits[i];
        
        // check if color is in hex format
        if(split.color.match(/^#[0-9A-F]{6}$/i)){
            // generate RGBA representation
            var colorA = "rgba(" + parseInt(split.color.substring(1, 3), 16) + "," + parseInt(split.color.substring(3, 5), 16) + "," + parseInt(split.color.substring(5, 7), 16) + ",0.7)";
            var colorB = "rgba(" + parseInt(split.color.substring(1, 3), 16) + "," + parseInt(split.color.substring(3, 5), 16) + "," + parseInt(split.color.substring(5, 7), 16) + ",1)";

            split.gradientBackground = `linear-gradient(160deg, ${colorA}, ${colorB})`;
        }else{
            split.gradientBackground = "linear-gradient(160deg, rgba(0,0,0,0.7), rgba(0,0,0,1))";
        }
    }

    var groups = (await db.getGroups()).data;
    var splitAttending = (await db.getEventSplits_eid(req.params.eid)).data;

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

    res.render("event_edit", {user: req.session.user, role: req.session.role, event: event, eventTypes: event_types, eventTemplates: event_templates, images: images, splits: splits, groups: groups, eventParticipation: splitAttending});

});

router.get("/event/template", async (req, res) => {
    res.redirect("/event/templates");
});

router.get("/event/templates", async (req, res) => {
    
    if(! await permissionCheck(req, res, [])) return;

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
    
    if(! await permissionCheck(req, res, ["events_templates"])) return;

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

router.get("/groups", async (req, res) => {
    
    if(! await permissionCheck(req, res, [])) return;

    var permissionsToPass = (await permissionsRequest(req, ["splits_join", "groups_join", "groups", "splits"]));
    
    var images = await generateImagesList("corner_images");

    let groups = (await db.getGroups()).data;

    var gradientBackground = (await db.getConfigProperty_uniq_name("event_gradient_background")).data;

    for(var i = 0; i < groups.length; i++){
        let group = groups[i];
        let splits = (await db.getSplits(group.gid)).data;
        let groupMembership = (await db.getGroupMembers(group.gid)).data;

        group.splits = splits;
        group.user_count = groupMembership.length;
        if(req.session.user){
            group.membership = groupMembership.find(m => m.uid == req.session.user.uid);
        }

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
            group.color = "#000000";
        }


    }


    res.render("groups", {user: req.session.user, role: req.session.role, groups: groups, images: images, permissions: permissionsToPass});

});

router.get("/split/:sid", async (req, res) => {
    if(! await permissionCheck(req, res, [])) return;
    
    var permissionsToPass = (await permissionsRequest(req, ["events", "events_edit", "groups", "splits", "splits_join", "other_users_membership"]));
    
    var images = await generateImagesList("corner_images");

    let sid = req.params.sid;
    if(sid == ""){
        res.redirect("/groups");
        return;
    }
    // check if gid is number
    if(isNaN(sid)){
        res.status(404).render("special/error", {user: req.session.user, role: req.session.role, error: {
            code: 404,
            message: "Split not found"
        }});
        return;
    }

    var split = (await db.getSplit(sid)).data;

    if(split.length == 0){
        res.status(404).render("special/error", {user: req.session.user, role: req.session.role, error: {
            code: 404,
            message: "Split not found"
        }});
        return;
    }

    split = split[0];

    let allMembership = (await db.getSplitMembers(sid)).data;
    let group = (await db.getGroup(split.gid)).data[0];


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
        group.color = "#000000";
    }

    if(gradientBackground.length > 0){
        split.gradientBackground = gradientBackground[0].value;
    }
    // check if color is in hex format
    if(split.color.match(/^#[0-9A-F]{6}$/i)){
        // generate RGBA representation
        var colorA = "rgba(" + parseInt(split.color.substring(1, 3), 16) + "," + parseInt(split.color.substring(3, 5), 16) + "," + parseInt(split.color.substring(5, 7), 16) + ",0.7)";
        var colorB = "rgba(" + parseInt(split.color.substring(1, 3), 16) + "," + parseInt(split.color.substring(3, 5), 16) + "," + parseInt(split.color.substring(5, 7), 16) + ",1)";

        split.gradientBackground = `linear-gradient(160deg, ${colorA}, ${colorB})`;
    }
    else{
        split.color = "#000000";
        split.gradientBackground = "linear-gradient(160deg, rgba(0,0,0,0.7), rgba(0,0,0,1))";
    }

    let eventParticipation = (await db.getEventSplits_sid(sid)).data;
    let events = (await db.getEvents()).data;
    // only send back the events that are in the future (by end date)

    let now = new Date();
    events = events.filter(e => new Date(e.ending) > now);
    events = events.filter(e => eventParticipation.find(ep => ep.eid == e.eid) != undefined);

    let eventTypes = (await db.getEventTypes()).data;

    let elevated = false;
    if(req.session.user){
        elevated = permissionsToPass.includes("splits") || permissionsToPass.includes("groups");

        let membership = allMembership.find(m => m.uid == req.session.user.uid)
        if(membership != undefined && membership.elevated){
            elevated = true;
        }
    }
    

    res.render("split", {user: req.session.user, role: req.session.role, group: group, users: allMembership, split: split, images: images, events: events, eventTypes: eventTypes, elevated: elevated, permissions: permissionsToPass});

});

router.get("/group/:gid", async (req, res) => {
    
    if(! await permissionCheck(req, res, [])) return;

    var permissionsToPass = (await permissionsRequest(req, ["events", "events_edit", "groups", "groups_join", "other_users_membership"]));
    
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
    splits = splits.filter(s => s.gid == group.gid);

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
        group.color = "#000000";
    }

    let events = (await db.getEvents()).data;
    // filter to only future events (where start or end date is after now)
    let now = new Date();
    events = events.filter(e => new Date(e.ending) > now);

    let attendingEvents = [];

    for(var i = 0; i < splits.length; i++){
        let split = splits[i];

        let splitAttendingEvents = (await db.getEventSplits_sid(split.sid)).data;
        for(var j = 0; j < splitAttendingEvents.length; j++){
            let event = events.find(e => e.eid == splitAttendingEvents[j].eid);
            if(event){
                if(attendingEvents.find(e => e.eid == event.eid) == undefined){
                    event.splits = [split.sid];
                    attendingEvents.push(event);
                }else{
                    attendingEvents.find(e => e.eid == event.eid).splits.push(split.sid);
                }
            }
        }

        if(gradientBackground.length > 0){
            split.gradientBackground = gradientBackground[0].value;
        }
        // check if color is in hex format
        if(split.color.match(/^#[0-9A-F]{6}$/i)){
            // generate RGBA representation
            var colorA = "rgba(" + parseInt(split.color.substring(1, 3), 16) + "," + parseInt(split.color.substring(3, 5), 16) + "," + parseInt(split.color.substring(5, 7), 16) + ",0.7)";
            var colorB = "rgba(" + parseInt(split.color.substring(1, 3), 16) + "," + parseInt(split.color.substring(3, 5), 16) + "," + parseInt(split.color.substring(5, 7), 16) + ",1)";
    
            split.gradientBackground = `linear-gradient(160deg, ${colorA}, ${colorB})`;
        }
        else{
            split.color = "#000000";
            split.gradientBackground = "linear-gradient(160deg, rgba(0,0,0,0.7), rgba(0,0,0,1))";
        }

        let splitMemberships = (await db.getSplitMembers(split.sid)).data;
        split.user_count = splitMemberships.length;
        let userMembership = undefined;
        if(req.session.user){
            userMembership = splitMemberships.find(m => m.uid == req.session.user.uid);
        }
        split.membership = userMembership;
    }

    let eventTypes = (await db.getEventTypes()).data;

    let elevated = false;
    if(req.session.user){
        elevated = permissionsToPass.includes("groups");

        let membership = allMembership.find(m => m.uid == req.session.user.uid)
        if(membership != undefined && membership.elevated){
            elevated = true;
        }
    }



    

    res.render("group", {user: req.session.user, role: req.session.role, group: group, users: allMembership, splits: splits, images: images, elevated: elevated, events: attendingEvents, eventTypes: eventTypes, permissions: permissionsToPass});

});

router.get("/group/:gid/edit", async (req, res) => {

    let gid = req.params.gid;
    if(gid == ""){
        res.redirect("/groups");
        return;
    }

    let allMembership = (await db.getGroupMembers(gid)).data;
    let isElevated = req.session.user ? allMembership.find(m => m.uid == req.session.user.uid && m.elevated) : false;

    if(!isElevated && ! await permissionCheck(req, res, ["groups", "other_users_membership"])) return;

    var permissionsToPass = (await permissionsRequest(req, ["events", "events_edit", "groups", "splits", "other_users_membership"]));
    
    var images = await generateImagesList("corner_images");

    
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

    // check for user's permission to edit the group (as a manager or have an overriding permission)

    group = group[0];

    
    let splits = (await db.getSplits(gid)).data;
    splits = splits.filter(s => s.gid == group.gid);

    

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
        group.color = "#000000";
    }

    for(var i = 0; i < splits.length; i++){
        let split = splits[i];
        if(gradientBackground.length > 0){
            split.gradientBackground = gradientBackground[0].value;
        }
        // check if color is in hex format
        if(split.color.match(/^#[0-9A-F]{6}$/i)){
            // generate RGBA representation
            var colorA = "rgba(" + parseInt(split.color.substring(1, 3), 16) + "," + parseInt(split.color.substring(3, 5), 16) + "," + parseInt(split.color.substring(5, 7), 16) + ",0.7)";
            var colorB = "rgba(" + parseInt(split.color.substring(1, 3), 16) + "," + parseInt(split.color.substring(3, 5), 16) + "," + parseInt(split.color.substring(5, 7), 16) + ",1)";
    
            split.gradientBackground = `linear-gradient(160deg, ${colorA}, ${colorB})`;
        }
        else{
            split.color = "#000000";
            split.gradientBackground = "linear-gradient(160deg, rgba(0,0,0,0.7), rgba(0,0,0,1))";
        }

        let splitMemberships = (await db.getSplitMembers(split.sid)).data;
        split.user_count = splitMemberships.length;
        let userMembership = undefined;
        if(req.session.user){
            userMembership = splitMemberships.find(m => m.uid == req.session.user.uid);
        }
        split.membership = userMembership;
    }

    let events = (await db.getEvents()).data;
    // only send back the events that are in the future (by end date)
    let now = new Date();
    events = events.filter(e => new Date(e.ending) > now);   

    let eventParticipation = [];
    for(var i = 0; i < splits.length; i++){
        let split = splits[i];
        let splitEvents = (await db.getEventSplits_sid(split.sid)).data;
        eventParticipation.push(splitEvents);
    }

    var eventTypes = (await db.getEventTypes()).data;

    res.render("group_edit", {user: req.session.user, role: req.session.role, group: group, users: allMembership, splits: splits, images: images, eventParticipation: eventParticipation, events: events, eventTypes: eventTypes, permissions: permissionsToPass, elevated: isElevated});

});

router.get("/split/:sid/edit", async (req, res) => {
    let sid = req.params.sid;
    if(sid == ""){
        res.redirect("/groups");
        return;
    }

    let allMembership = (await db.getSplitMembers(sid)).data;
    let isElevated = req.session.user ? allMembership.find(m => m.uid == req.session.user.uid && m.elevated) : false;
    
    if(!isElevated && ! await permissionCheck(req, res, ["splits", "groups", "other_users_membership"])) return;
    
    var permissionsToPass = (await permissionsRequest(req, ["events", "events_edit", "groups", "splits", "other_users_membership"]));

    var images = await generateImagesList("corner_images");

    
    // check if gid is number
    if(isNaN(sid)){
        res.status(404).render("special/error", {user: req.session.user, role: req.session.role, error: {
            code: 404,
            message: "Split not found"
        }});
        return;
    }

    var split = (await db.getSplit(sid)).data;

    if(split.length == 0){
        res.status(404).render("special/error", {user: req.session.user, role: req.session.role, error: {
            code: 404,
            message: "Split not found"
        }});
        return;
    }

    split = split[0];

    
    let group = (await db.getGroup(split.gid)).data[0];

    

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
        group.color = "#000000";
    }

    if(gradientBackground.length > 0){
        split.gradientBackground = gradientBackground[0].value;
    }
    // check if color is in hex for30mat
    if(split.color.match(/^#[0-9A-F]{6}$/i)){
        // generate RGBA representation
        var colorA = "rgba(" + parseInt(split.color.substring(1, 3), 16) + "," + parseInt(split.color.substring(3, 5), 16) + "," + parseInt(split.color.substring(5, 7), 16) + ",0.7)";
        var colorB = "rgba(" + parseInt(split.color.substring(1, 3), 16) + "," + parseInt(split.color.substring(3, 5), 16) + "," + parseInt(split.color.substring(5, 7), 16) + ",1)";

        split.gradientBackground = `linear-gradient(160deg, ${colorA}, ${colorB})`;
    }
    else{
        split.color = "#000000";
        split.gradientBackground = "linear-gradient(160deg, rgba(0,0,0,0.7), rgba(0,0,0,1))";
    }

    let events = (await db.getEvents()).data;
    let eventParticipation = (await db.getEventSplits_sid(sid)).data;
    // only send back the events that are in the future (by end date)
    let now = new Date();
    events = events.filter(e => new Date(e.ending) > now);

    let eventTypes = (await db.getEventTypes()).data;

    res.render("split_edit", {user: req.session.user, role: req.session.role, group: group, users: allMembership, split: split, images: images, eventParticipation: eventParticipation, events: events, eventTypes: eventTypes, permissions: permissionsToPass, elevated: isElevated});

});

router.get("/event/:eid", async (req, res) => {

    if(! await permissionCheck(req, res, [])) return;

    var permissionsToPass = (await permissionsRequest(req, ["events", "events_edit", "events_attendance"]));

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

    
    var participationOverride = undefined;
    if(req.session.user){
        participationOverride = (await db.getParticipationOverride(event.eid, req.session.user.uid)).data;
        if(participationOverride.length > 0){
            participationOverride = participationOverride[0].override;
        }else{
            participationOverride = undefined;
        }
    }

    let defaultParticipation = await shouldParticipateInEvent(req, event.eid);
    event.defaultParticipation = defaultParticipation;
    // before we send back data, do a segment data check

    let groups = (await db.getGroups()).data;
    let splitParticipation = (await db.getEventSplits_eid(event.eid)).data;

    for(var i = 0; i < splitParticipation.length; i++){
        let split = (await db.getSplit(splitParticipation[i].sid)).data[0];

        let group = groups.find(g => g.gid == split.gid);
        if(!group.splits){
            group.splits = [];
        }

        if(gradientBackground.length > 0){
            split.gradientBackground = gradientBackground[0].value;
        }
        // check if color is in hex format
        if(split.color.match(/^#[0-9A-F]{6}$/i)){
            // generate RGBA representation
            var colorA = "rgba(" + parseInt(split.color.substring(1, 3), 16) + "," + parseInt(split.color.substring(3, 5), 16) + "," + parseInt(split.color.substring(5, 7), 16) + ",0.7)";
            var colorB = "rgba(" + parseInt(split.color.substring(1, 3), 16) + "," + parseInt(split.color.substring(3, 5), 16) + "," + parseInt(split.color.substring(5, 7), 16) + ",1)";

            split.gradientBackground = `linear-gradient(160deg, ${colorA}, ${colorB})`;
        }else{
            split.gradientBackground = "linear-gradient(160deg, rgba(0,0,0,0.7), rgba(0,0,0,1))";
        }

        // check if user is a part of split
        if(!req.session.user){
            split.partOf = false;
        }else{
            let userParticipation = (await db.getSplitMembers(split.sid)).data.find(m => m.uid == req.session.user.uid);
            split.partOf = userParticipation != undefined;
        }
        

        group.splits.push(split);
    }

    for(var i = 0; i < groups.length; i++){
        let group = groups[i];

        if(!group.splits){
            // don't send down group
            groups.splice(i, 1);
            i--;
            continue;
        }

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
    }


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


    res.render("event", {user: req.session.user, role: req.session.role, event: event, images: images, override: participationOverride, groups: groups, permissions: permissionsToPass});
});

router.get("/report/songs", async (req, res) => {

    if(! await permissionCheck(req, res, [])) return;


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

router.get("/report/overrides", async (req, res) => {

    if(! await permissionCheck(req, res, ["other_users", "other_users_attendance"])) return;

    
    // start and end date are optional
    // in the format YYYY-MM-DD

    var images = await generateImagesList("corner_images");

    var users = (await db.getIdentities()).data;

    for(var i = 0; i < users.length; i++){
        let user = users[i];
        let overrides = (await db.getParticipationOverrides_uid(user.uid)).data;
        user.override_yes = overrides.filter(o => o.override == 1).length;
        user.override_no = overrides.filter(o => o.override == 0).length;
        user.override_maybe = overrides.filter(o => o.override == 2).length;
    }

    

    // don't send back events
    res.render("report_override", {user: req.session.user, role: req.session.role, images: images, users: users});

});

router.get("/songs", async (req, res) => {
    if(! await permissionCheck(req, res, [])) return;

    var images = await generateImagesList("corner_images");
    var songs = (await db.getSongs()).data;

    let permissionsToPass = (await permissionsRequest(req, ["songs", "songs_remove"]));

    if(permissionsToPass.length == 0){
        
        res.render("songs", {user: req.session.user, role: req.session.role, songs: songs, images: images});
        return;
    }
    
    

    res.render("songs_edit", {user: req.session.user, role: req.session.role, songs: songs, images: images, permissions: permissionsToPass});

});

router.get("/splits/edit", async (req, res) => {
    if(! await permissionCheck(req, res, ["splits", "groups"])) return;
    
    var permissionsToPass = (await permissionsRequest(req, ["splits", "groups"]));

    var images = await generateImagesList("corner_images");
    var splits = (await db.getSplits()).data;
    var groups = (await db.getGroups()).data;

    for(var i = 0; i < splits.length; i++){
        var splitManagers = (await db.getSplitElevated(splits[i].sid)).data;
        splits[i].managers = splitManagers;
    }

    res.render("splits_edit", {user: req.session.user, role: req.session.role, splits: splits, images: images, groups: groups, permissions: permissionsToPass});
});

router.get("/groups/edit", async (req, res) => {
    if(! await permissionCheck(req, res, ["groups"])) return;
    
    var permissionsToPass = (await permissionsRequest(req, ["groups"]));

    var images = await generateImagesList("corner_images");
    var groups = (await db.getGroups()).data;

    

    for(var i = 0; i < groups.length; i++){
        var groupManagers = (await db.getGroupElevated(groups[i].gid)).data;
        groups[i].managers = groupManagers;
    }
    
    res.render("groups_edit", {user: req.session.user, role: req.session.role, groups: groups, images: images, permissions: permissionsToPass});
});

router.get("/account", async (req, res) => {
    if(! await permissionCheck(req, res, ["LOGIN"])) return;

    var permissionsToPass = (await permissionsRequest(req, ["splits_join", "groups_join"]));
    
    var images = await generateImagesList("corner_images");

    if(!req.session.user){
        res.status(403).render("special/error", {user: req.session.user, role: req.session.role, error: {
            code: 403,
            message: "Access denied (are you signed in?)"
        }});
        return;
    }

    let uid = req.session.user.uid;

    var user = (await db.getIdentity_uid(uid)).data[0];

    let groups = (await db.getIdentityGroups(uid)).data;

    var gradientBackground = (await db.getConfigProperty_uniq_name("event_gradient_background")).data;
    
    for(var i = 0; i < groups.length; i++){
        let group = groups[i];

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
    }

    let splits = (await db.getIdentitySplits(uid)).data;

    res.render("account", {user: req.session.user, role: req.session.role, groups: groups, splits: splits, images: images, userDetails: user, permissions: permissionsToPass});

});

router.get("/announcement/create", async (req, res) => {
    if(! await permissionCheck(req, res, ["announcements"])) return;
    
    var images = await generateImagesList("corner_images");

    let splits = (await db.getSplits()).data;
    let groups = (await db.getGroups()).data;

    let gradientBackground = (await db.getConfigProperty_uniq_name("event_gradient_background")).data;

    for(var i = 0; i < groups.length; i++){
        let group = groups[i];

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
            group.color = "#000000";
        }
    }

    for(var i = 0; i < splits.length; i++){
        let split = splits[i];

        if(gradientBackground.length > 0){
            split.gradientBackground = gradientBackground[0].value;
        }
        // check if color is in hex format
        if(split.color.match(/^#[0-9A-F]{6}$/i)){
            // generate RGBA representation
            var colorA = "rgba(" + parseInt(split.color.substring(1, 3), 16) + "," + parseInt(split.color.substring(3, 5), 16) + "," + parseInt(split.color.substring(5, 7), 16) + ",0.7)";
            var colorB = "rgba(" + parseInt(split.color.substring(1, 3), 16) + "," + parseInt(split.color.substring(3, 5), 16) + "," + parseInt(split.color.substring(5, 7), 16) + ",1)";
    
            split.gradientBackground = `linear-gradient(160deg, ${colorA}, ${colorB})`;
        }else{
            split.gradientBackground = "linear-gradient(160deg, rgba(0,0,0,0.7), rgba(0,0,0,1))";
            split.color = "#000000";
        }
    }

    let events = (await db.getEvents()).data;
    // filter to only future events (where start or end date is after now)
    let now = new Date();
    events = events.filter(e => new Date(e.ending) > now);

    

    res.render("announcement_create", {user: req.session.user, role: req.session.role, images: images, groups: groups, splits: splits, events: events});

});

router.get("/announcement/:aid/edit", async (req, res) => {
    if(! await permissionCheck(req, res, ["announcements_edit"])) return;

    var images = await generateImagesList("corner_images");

    let aid = req.params.aid;
    if(aid == "" || isNaN(aid)){
        res.status(404).render("special/error", {user: req.session.user, role: req.session.role, error: {
            code: 404,
            message: "Announcement not found"
        }});
        return;
    }

    let splits = (await db.getSplits()).data;
    let groups = (await db.getGroups()).data;

    let gradientBackground = (await db.getConfigProperty_uniq_name("event_gradient_background")).data;

    for(var i = 0; i < groups.length; i++){
        let group = groups[i];

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
            group.color = "#000000";
        }
    }

    for(var i = 0; i < splits.length; i++){
        let split = splits[i];

        if(gradientBackground.length > 0){
            split.gradientBackground = gradientBackground[0].value;
        }
        // check if color is in hex format
        if(split.color.match(/^#[0-9A-F]{6}$/i)){
            // generate RGBA representation
            var colorA = "rgba(" + parseInt(split.color.substring(1, 3), 16) + "," + parseInt(split.color.substring(3, 5), 16) + "," + parseInt(split.color.substring(5, 7), 16) + ",0.7)";
            var colorB = "rgba(" + parseInt(split.color.substring(1, 3), 16) + "," + parseInt(split.color.substring(3, 5), 16) + "," + parseInt(split.color.substring(5, 7), 16) + ",1)";
    
            split.gradientBackground = `linear-gradient(160deg, ${colorA}, ${colorB})`;
        }else{
            split.gradientBackground = "linear-gradient(160deg, rgba(0,0,0,0.7), rgba(0,0,0,1))";
            split.color = "#000000";
        }
    }

    let announcement = (await db.getAnnouncement(req.params.aid));
    if(announcement.data.length == 0){
        res.status(404).render("special/error", {user: req.session.user, role: req.session.role, error: {
            code: 404,
            message: "Announcement not found"
        }});
        return;
    }

    announcement = announcement.data[0];

    let announcementGroups = (await db.getAnnouncementsGroups_aid(aid)).data;
    let announcementSplits = (await db.getAnnouncementsSplits_aid(aid)).data;

    announcement.groups = announcementGroups;
    announcement.splits = announcementSplits;

    res.render("announcement_edit", {user: req.session.user, role: req.session.role, images: images, groups: groups, splits: splits, announcement: announcement, announcementGroups: announcementGroups, announcementSplits: announcementSplits});
});

router.get("/redirect", (req, res) => {
    res.render("special/redirect", {user: req.session.user, role: req.session.role});
})

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