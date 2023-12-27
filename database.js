const mssql = require('mssql')
const sanitizer = require('sanitizer');

class DBQuery {
    constructor(data, success) {
        this.data = data
        this.success = success
    }
}

class Database {

    constructor(link, username, password, name, port) {
        this.link = link
        this.username = username
        this.password = password
        this.name = name
        this.port = port

        mssql.connect(`Server=${this.link},${this.port};Initial Catalog=${this.name};Persist Security Info=False;User ID=${this.username};Password=${this.password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;`)


    }

    query(query) {
        return new Promise((resolve, reject) => {
            mssql.query(query, function (err, result) {
                if (err) {
                    resolve(new DBQuery(null, false))
                } else {
                    console.log(result)
                    resolve(new DBQuery(result.recordset, true))
                }
            })
        })
    }

    edit(query) {
        return new Promise((resolve, reject) => {
            mssql.query(query, function (err, result) {
                if (err) {
                    resolve(new DBQuery(null, false))
                } else {
                    resolve(new DBQuery(result, true))
                }
            })
        });
    }


    /**
     * Custom SQL queries based off of database schema to GET
     */

    getConfig(){
        return this.query("SELECT * FROM config")
    }

    getIdentity_mtusso(mtu_id){
        mtu_id = sanitizer.sanitize(mtu_id)

        return this.query("SELECT * FROM identity_management WHERE mtu_id = " + mtu_id)
    }

    getIdentity_uid(uid){

        return this.query("SELECT * FROM identity_management WHERE uid = " + uid)
    }

    getIdentityGroups(uid){
        // join groups table with identity_management_groups with common key gid

        return this.query("SELECT * FROM groups INNER JOIN identity_management_groups ON groups.gid = identity_management_groups.gid WHERE identity_management_groups.uid = " + uid)
    }

    getIdentitySplits(uid){
        // join splits table with identity_management_splits with common key sid

        return this.query("SELECT * FROM splits INNER JOIN identity_management_splits ON splits.sid = identity_management_splits.sid WHERE identity_management_splits.uid = " + uid)
    }

    getIdentityRole(uid){
        // identity_management has an rid that's common with identity_management_roles

        return this.query("SELECT * FROM identity_management_roles INNER JOIN identity_management ON identity_management_roles.rid = identity_management.rid WHERE identity_management.uid = " + uid)
    }


    // returns the direct user
    // ONLY the CAS is allowed to call this function
    async setup_user(mtu_id, uid){
        mtu_id = sanitizer.sanitize(mtu_id)

        let identity = await this.getIdentity_uid(uid)
        console.log(identity.data)
        if(identity.success && identity.data.length > 0){
            // user exists

            // set last_seen of user to current time
            let query = "UPDATE identity_management SET last_seen = CURRENT_TIMESTAMP WHERE uid = " + uid
            this.edit(query);

            return identity.data[0]
        } else {
            // user doesn't exist
            let query = "INSERT INTO identity_management (mtu_id, uid) VALUES ('" + mtu_id + "', " + uid + ")"

            let result = await this.edit(query)

            if(result.success){
                return await this.setup_user(mtu_id, uid)
            } else {
                return null
            }
        }
    }

    async update_user_information(uid, full_name){
        full_name = sanitizer.sanitize(full_name);

        let query = "UPDATE identity_management SET full_name = '" + full_name + "' WHERE uid = " + uid

        return await this.edit(query)
    }



    getEvent(eid){
        return this.query("SELECT * FROM events WHERE eid = " + eid)
    }

    getEvent_concurrency(concurrency){
        return this.query("SELECT * FROM events WHERE concurrency = " + concurrency)
    }

    getEvents(){
        return this.query("SELECT * FROM events")
    }

    createEvent(etid_used){
        return this.edit("INSERT INTO events (etid_used) VALUES (" + etid_used + ")")
    }

    async updateEvent(eid, etyid, etid_used, name, begin, end, show, open, data){
        // each of the parameters should contain the original values if not being changed

        let existing_event = (await this.getEvent(eid))[0]

        if(etyid == null) etyid = existing_event.etyid
        if(etid_used == null) etid_used = existing_event.etid_used
        if(name == null) name = existing_event.name
        if(begin == null) begin = existing_event.begin
        if(end == null) end = existing_event.end
        if(show == null) show = existing_event.show
        if(open == null) open = existing_event.open
        if(data == null) data = existing_event.data
        

        name = sanitizer.sanitize(name)
        data = sanitizer.sanitize(data)

        return this.edit("UPDATE events SET etyid = " + etyid + ", etid_used = " + etid_used + ", name = '" + name + "', begin = '" + begin + "', end = '" + end + "', show = " + show + ", open = " + open + ", data = '" + data + "', updated = CURRENT_TIMESTAMP WHERE eid = " + eid)
    }

    deleteEvent(eid){
        return this.edit("DELETE FROM events WHERE eid = " + eid)
    }

    setOverride(eid, uid, override){
        return this.edit("UPDATE events SET event_participation_overrides = " + override + " WHERE eid = " + eid + " AND uid = " + uid)
    }

    getOverrides_eid(eid){
        return this.query("SELECT * FROM event_participation_overrides WHERE eid = " + eid)
    }

    getOverrides_uid(uid){
        return this.query("SELECT * FROM event_participation_overrides WHERE uid = " + uid)
    }

    removeOverride(eid, uid){
        return this.edit("UPDATE events SET event_participation_overrides = NULL WHERE eid = " + eid + " AND uid = " + uid)
    }



}

module.exports = Database