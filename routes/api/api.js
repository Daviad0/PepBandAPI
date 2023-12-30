const express = require('express');

const router = express.Router("/api");

var db;

router.use((req, res, next) => {


    // eventually we want to implement API keys to get the user's role
});

router.use("/event", require('./event.js')(db));
router.use("/identity", require('./identity.js')(db));

module.exports = (useDb) => {
    db = useDb;
    return router;
}