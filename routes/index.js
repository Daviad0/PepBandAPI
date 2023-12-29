const express = require('express');

const router = express.Router("/");

var db;


// public folder
router.use(express.static('public'));
router.use(express.static('views/partials'));


router.get("/", (req, res) => {
    console.log(req.session.user);
    res.render("index", {user: req.session.user, role: req.session.role});
});

router.get("/events", (req, res) => {
    res.render("events", {user: req.session.user, role: req.session.role});
});



module.exports = (useDb) => {
    db = useDb;
    return router;
}