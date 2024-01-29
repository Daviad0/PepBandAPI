const express = require('express');
const app = express();
const dotenv = require('dotenv');
const session = require('express-session');
dotenv.config();

console.log("ENV: ");
console.log(process.env)

// session initialization
app.use( session({
    secret            : process.env.SESSION_SECRET,
    resave            : false,
    saveUninitialized : true
}));

const port = process.env.PORT || 3000;

// database initialization
const db_host = process.env.DB_HOST;
const db_user = process.env.DB_USER;
const db_pass = process.env.DB_PASS;
const db_name = process.env.DB_NAME;
const db_port = process.env.DB_PORT;
const Database = require('./database.js');
const db = new Database(db_host, db_user, db_pass, db_name, db_port);

// body parser
const bodyParser = require('body-parser');
app.use(bodyParser.json());

// authentication update every time a page is loaded
app.use((req, res, next) => {
    if(req.session.user){
        db.getIdentityRole(req.session.user.uid).then((result) => {
            console.log(result)
            if(result.data.length == 0) {
                req.session.role = null;
                next();
                return;
            }
            req.session.role = result.data[0];
            next();
        })
    } else {
        req.session.role = null;
        next();
    }
})

app.use("/account", require('./routes/account.js')(db));
app.use("/api", require('./routes/api/api.js')(db));
app.use("/", require('./routes/index.js')(db));

app.set("view engine", "ejs");


app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});