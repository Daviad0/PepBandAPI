const express = require('express');
const CASAuthentication = require('cas-authentication');

const router = express.Router("/account");

var db;

var isDev = process.env.CAS_TEST_MODE == "false" ? false : true;

var cas = new CASAuthentication({
    cas_url         : 'https://sso.mtu.edu/cas',
    service_url     : 'https://pep.robosmrt.com/account',
    cas_version     : '3.0',
    renew           : false,
    is_dev_mode     : isDev,
    dev_mode_user   : 'djreeves',
    dev_mode_info   : {
        displayName: 'David Reeves',
        uid: 1313131
    },
    session_name    : 'cas_user',
    session_info    : 'cas_userinfo',
    destroy_session : false
});


// token is the key, value is the user's session
let user_app_sessions = {};



// middleware to check if the user is using the app
function isUsingApp(req, res, next){

    // set session to remember if the user is using the app


    if(req.query.app == "true"){
        req.isApp = true;
        req.session.isApp = true;
    }else{
        req.isApp = false;
        req.session.isApp = false;
    }
    next();
    
}

router.use(isUsingApp);

router.get("/validate", async (req, res) => {
    let token = req.query.token;

    if(!user_app_sessions[token]){
        res.status(403).send({message: "Invalid token"});
        return;
    }

    req.session.user = user_app_sessions[token];

    res.send(user_app_sessions[token]);
});

router.get( '/authenticate', cas.bounce, (req, res) => {
    console.log(req.query);
    let isApp = req.isApp == true || req.query.app == "true";
    // all MTU-related accounts will have a uid determined by the identity table
    db.setup_user_cas(req.session[cas.session_name], req.session[cas.session_info].udc_identifier, true).then(async (result) => {
        if(result != null){

            var default_role = (await db.getConfigProperty_uniq_name("registered_default_rid_mtu"));
            if(default_role.data.length == 0){
                default_role = null;
            }else{
                default_role = default_role.data[0].value;
            }

            db.update_user_information(req.session[cas.session_info].udc_identifier, req.session[cas.session_info].displayname, req.session[cas.session_info].mail, default_role);
            req.session.user = result;


            

            if(isApp){
                // create a token for the user
                let token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                user_app_sessions[token] = req.session.user;

                res.redirect("pepband://login?token=" + token);
            }
            else
                res.redirect('/');
        } else {
            res.send(result);
        }
    })
});

router.get( '/logout', cas.logout );


module.exports = (useDb) => {
    console.log("CAS: " + db)
    db = useDb;
    return router;
}