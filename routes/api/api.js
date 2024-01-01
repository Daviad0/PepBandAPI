const express = require('express');

const router = express.Router("/api");

var db;

router.use((req, res, next) => {

    next();
    // eventually we want to implement API keys to get the user's role
});



module.exports = (useDb) => {
    db = useDb;
    router.use("/event", require('./event.js')(db));
    router.use("/identity", require('./identity.js')(db));
    router.use("/global", require('./global.js')(db));
    return router;
}