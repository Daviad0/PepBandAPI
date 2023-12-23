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

router.get( '/logout', cas.logout );


module.exports = (useDb) => {
    console.log("CAS: " + db)
    db = useDb;
    return router;
}