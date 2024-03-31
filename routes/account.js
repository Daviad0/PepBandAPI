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
    destroy_session : true
});

router.get( '/authenticate', cas.bounce, (req, res) => {
    // all MTU-related accounts will have a uid determined by the identity table
    db.setup_user_cas(req.session[cas.session_name], req.session[cas.session_info].udc_identifier, true).then((result) => {
        if(result != null){
            db.update_user_information(req.session[cas.session_info].udc_identifier, req.session[cas.session_info].displayname, req.session[cas.session_info].mail);
            req.session.user = result;

            

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