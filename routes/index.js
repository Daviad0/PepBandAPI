const express = require('express');

const router = express.Router("/");

var db;



router.get("/", (req, res) => {
    console.log(req.session.user);
    res.render("index", {user: req.session.user, role: req.session.role});
});



module.exports = (useDb) => {
    db = useDb;
    return router;
}