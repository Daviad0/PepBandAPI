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

        this.configCache = [];

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
                    console.log(err);
                    resolve(new DBQuery(null, false))
                } else {
                    resolve(new DBQuery(result, true))
                }
            })
        });
    }

    /**
     * Check access based on property name that would go into config (what permission level should be granted)
     */

    async checkAccess(permission_name, role){

        if(!role) return false;

        let permission = role.permission;
        let config_uniq_name = "permission_" + permission_name;
        let config = await this.getConfigProperty_uniq_name(config_uniq_name);

        if(config.data.length == 0) return false;

        try{
            let config_value = parseInt(config.data[0].value);
            return permission >= config_value;
        }catch(e){
            return false;
        }
    }


    /**
     * Custom SQL queries based off of database schema to GET
     */

    getConfig(){
        return this.query("SELECT * FROM config")
    }

    setConfig(uniq_name, name, value, uid, type){
        
        let existing_config = this.getConfigProperty_uniq_name(uniq_name)

        if(existing_config.success && existing_config.data.length > 0){

            if(name == null) name = existing_config.data[0].name
            if(value == null) value = existing_config.data[0].value
            if(uid == null) uid = -1
            if(type == null) type = existing_config.data[0].type


            // config exists
            let query = "UPDATE config SET name = '" + name + "', value = '" + value + "', uid = " + uid + ", type = " + type + " WHERE uniq_name = '" + uniq_name + "'"
            return this.edit(query)
        } else {

            if(name == null) name = uniq_name
            if(value == null) value = ""
            if(uid == null) uid = -1
            if(type == null) type = null

            // config doesn't exist
            let query = "INSERT INTO config (uniq_name, name, value, uid, type) VALUES ('" + uniq_name + "', '" + name + "', '" + value + "', " + uid + ", " + type + ")"
            return this.edit(query)
        }
    }

    getConfigProperty_cid(cid){
        return this.query("SELECT * FROM config WHERE cid = " + cid)
    }

    getConfigProperty_uniq_name(uniq_name){
        return this.query("SELECT * FROM config WHERE uniq_name = '" + uniq_name + "'")
    }

    getIdentities(){
        return this.query("SELECT * FROM identity_management")
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
    async setup_user(mtu_id, uid, is_mtu){
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
            let query = "INSERT INTO identity_management (mtu_id, uid, mtu_based) VALUES ('" + mtu_id + "', " + uid + ", " + is_mtu + ")"

            let result = await this.edit(query)

            if(result.success){
                return await this.setup_user(mtu_id, uid, is_mtu)
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

    async updateEvent(eid, etyid, etid_used, name, begin, end, show, open, data, location, description){
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
        if(location == null) location = existing_event.location
        if(description == null) description = existing_event.description
        

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
        // return all users with overrides for this event (with a join on identity_management by uid)
        return this.query("SELECT * FROM event_participation_overrides INNER JOIN identity_management ON event_participation_overrides.uid = identity_management.uid WHERE eid = " + eid)
    }

    getOverrides_uid(uid){
        return this.query("SELECT * FROM event_participation_overrides WHERE uid = " + uid)
    }

    removeOverride(eid, uid){
        return this.edit("UPDATE events SET event_participation_overrides = NULL WHERE eid = " + eid + " AND uid = " + uid)
    }



}

module.exports = Database