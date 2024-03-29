const express = require('express');

const router = express.Router("/api");

var db;

router.use((req, res, next) => {

    next();
    // eventually we want to implement API keys to get the user's role
});

router.get("/", (req, res) => {
    res.send({message: "I'm alive!"})
});



module.exports = (useDb) => {
    db = useDb;
    router.use("/event", require('./event.js')(db));
    router.use("/identity", require('./identity.js')(db));
    router.use("/global", require('./global.js')(db));
    router.use("/song", require('./song.js')(db));
    router.use("/groups", require('./groups.js')(db));
    return router;
}