const { Client } = require('pg');
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

        this.sql = new Client({
            user: this.username,
            host: this.link,
            database: this.name,
            password: this.password,
            port: this.port,
        });

        

        //  Server=${this.link},${this.port};Initial Catalog=${this.name};Persist Security Info=False;User ID=${this.username};Password=${this.password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
        //  Data Source=${this.link},${this.port};Network Library=DBMSSOCN;Initial Catalog=${this.name};User ID=${this.username};Password=${this.password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
        //mssql.connect(`Data Source=${this.link},${this.port};Network Library=DBMSSOCN;Initial Catalog=${this.name};User ID=${this.username};Password=${this.password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=True;Connection Timeout=30;`)

        this.setup();

    }

    async setup(){
        await this.sql.connect();
        await this.verifySchema();
        var required_config = process.env.REQUIRED_CONFIG.split(",")
            var default_values = process.env.REQUIRED_CONFIG_DEFAULT.split(",")

            for (var i = 0; i < required_config.length; i++) {
                // ensure that this_config will persist through the loop so that the correct value is used
                let j = i;
                let this_config_key = required_config[i];
                let this_config_value = default_values[i];
                this.getConfigProperty_uniq_name(required_config[i]).then((result) => {
                    if (result.data.length == 0) {
                        console.log("Creating required config " + result.uniq_name)
                        this.setConfig(this_config_key, this_config_key, this_config_value, -1, "string");
                    }
                });
                
            }

    }

    async verifySchema(){
        /*

            ### Config

            * cid (primary) - int
            * name - string
            * value - string
            * updated - datetime
            * uid - string
            * type - string
            * uniq_name - string

        */

        // make sure to use POSTGRES syntax for this

        // create config table if it doesn't exist
        await this.query("CREATE TABLE IF NOT EXISTS config (cid INT GENERATED BY DEFAULT AS IDENTITY (START WITH 1000000 INCREMENT BY 1) PRIMARY KEY, name VARCHAR, value VARCHAR, updated TIMESTAMP, uid VARCHAR, type VARCHAR, uniq_name VARCHAR);")
        

        /*

            ### Identity Management

            * uid (primary) - int
            * full_name - string
            * rid - int
            * last_seen - datetime
            * mtu_based - bool
            * mtu_id - string
            * mtu_uid - string
            * email - string

        */

        // create identity_management table if it doesn't exist
        await this.query("CREATE TABLE IF NOT EXISTS identity_management (uid INT GENERATED BY DEFAULT AS IDENTITY (START WITH 1000000 INCREMENT BY 1) PRIMARY KEY, full_name VARCHAR, rid INT, last_seen TIMESTAMP, mtu_based BOOLEAN, mtu_id VARCHAR, mtu_uid VARCHAR, email VARCHAR)")

        /*

            ### Identity Holds

            * fuid (primary) - int
            * mtu_id - string
            * rid - int
            * created - datetime
            * by_uid - int
            * reason - string
            * expires - datetime

        */

        // create identity_management_holds table if it doesn't exist
        await this.query("CREATE TABLE IF NOT EXISTS identity_management_holds (fuid INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, mtu_id VARCHAR, rid INT, created TIMESTAMP, by_uid INT, reason VARCHAR, expires TIMESTAMP)")

        /*

            ### Alternate Authentication

            * uid (primary) - int
            * email - string
            * pwhash - string
            * pwsalt - string
            * pwiter - int
            
        */

        // create alternate_authentication table if it doesn't exist
        await this.query("CREATE TABLE IF NOT EXISTS alternate_authentication (uid INT PRIMARY KEY, email VARCHAR, pwhash VARCHAR, pwsalt VARCHAR, pwiter INT)")

        /*

            ### Identity Management Groups

            * uid (primary) - int
            * gid (primary) - int
            * updated - datetime
            * elevated - boolean

        */

        // create identity_management_groups table if it doesn't exist
        await this.query("CREATE TABLE IF NOT EXISTS identity_management_groups (uid INT, gid INT, updated TIMESTAMP, elevated BOOLEAN, PRIMARY KEY(uid, gid))")

        /*

            ### Identity Management Splits

            * uid (primary) - int
            * sid (primary) - int
            * updated - datetime
            * elevated - boolean

        */

        // create identity_management_splits table if it doesn't exist
        await this.query("CREATE TABLE IF NOT EXISTS identity_management_splits (uid INT, sid INT, updated TIMESTAMP, elevated BOOLEAN, PRIMARY KEY(uid, sid))")

        /*

            ### Identity Management Roles

            * rid (primary) - int
            * name - string
            * permission - int
            * updated - datetime
            * description - string

        */

        // create identity_management_roles table if it doesn't exist
        await this.query("CREATE TABLE IF NOT EXISTS identity_management_roles (rid INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, name VARCHAR, icon VARCHAR, permission INT, updated TIMESTAMP, description VARCHAR)")

        /*

            ### Event Types

            * etyid (primary) - int
            * name - string
            * icon - string
            * color - string
            * extra_data - string
            * updated - datetime

        */

        // create event_types table if it doesn't exist
        await this.query("CREATE TABLE IF NOT EXISTS event_types (etyid INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, name VARCHAR, icon VARCHAR, color VARCHAR, extra_data VARCHAR, updated TIMESTAMP)")

        /*

            ### Event Templates

            * etid (primary) - int
            * etyid - int
            * name - string
            * data - string
            * updated - datetime

        */

        // create event_templates table if it doesn't exist
        await this.query("CREATE TABLE IF NOT EXISTS event_templates (etid INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, etyid INT, name VARCHAR, data VARCHAR, updated TIMESTAMP)")

        /*
        
            ### Event Splits

            * eid (primary) - int
            * sid (primary) - int
            * updated - datetime

        */

        // create event_splits table if it doesn't exist
        await this.query("CREATE TABLE IF NOT EXISTS event_splits (eid INT, sid INT, updated TIMESTAMP, PRIMARY KEY(eid, sid))")

        /*
        
            ### Event Participation Exceptions

            * eid (primary) - int
            * uid (primary) - int
            * override - int

        */

        // create event_participation_overrides table if it doesn't exist
        await this.query("CREATE TABLE IF NOT EXISTS event_participation_overrides (eid INT, uid INT, override INT, PRIMARY KEY(eid, uid))")

        /*

            ### Events

            * eid (primary) - int
            * etyid - int
            * etid_used - int
            * string - name
            * begin - datetime
            * end - datetime
            * open - boolean
            * show - boolean
            * data - string
            * updated - datetime
            * location - string
            * description - string

        */
        
        // create events table if it doesn't exist
        await this.query("CREATE TABLE IF NOT EXISTS events (eid INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, etyid INT, etid_used INT, name VARCHAR, start TIMESTAMP, ending TIMESTAMP, show BOOLEAN, data VARCHAR, updated TIMESTAMP, location VARCHAR, description VARCHAR)")

        /*

            ### Groups

            * gid (primary) - int
            * name - string
            * icon - string
            * description - string
            * open - boolean
            * extra_data - string
            * color - string

        */

        // create groups table if it doesn't exist
        await this.query("CREATE TABLE IF NOT EXISTS groups (gid INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, name VARCHAR, icon VARCHAR, description VARCHAR, open BOOLEAN, extra_data VARCHAR, updated TIMESTAMP, color VARCHAR)")

        /*

            ### Splits

            * sid (primary) - int
            * gid - int
            * name - string
            * icon - string
            * updated - datetime
            * open - boolean
            * extra_data - string
            * color - string
            
        */

        // create splits table if it doesn't exist
        await this.query("CREATE TABLE IF NOT EXISTS splits (sid INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, gid INT, name VARCHAR, icon VARCHAR, updated TIMESTAMP, open BOOLEAN, extra_data VARCHAR, color VARCHAR)")

        /*

            ### Announcements

            * aid (primary) - int
            * name - string
            * content - string
            * icon - string
            * uid - int
            * published - datetime
            * until - datetime

        */

        // create announcements table if it doesn't exist
        await this.query("CREATE TABLE IF NOT EXISTS announcements (aid INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, name VARCHAR, content VARCHAR, icon VARCHAR, uid INT, published TIMESTAMP, until TIMESTAMP)")

        /*

            ### Songs

            * soid (primary) - int
            * name - string
            * friendly_name - string (for forms of abbreviation)
            * modification - string
            * artist - string
            * updated - datetime
            * duration - int
            * source - string
            * category - string

        */

        // create songs table if it doesn't exist
        await this.query("CREATE TABLE IF NOT EXISTS songs (soid INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, name VARCHAR, friendly_name VARCHAR, modification VARCHAR, artist VARCHAR, updated TIMESTAMP, duration INT, source VARCHAR, category VARCHAR)")

        /*

            ### Song Usage

            * soid (primary) - int
            * eid (primary) - int
            * count - int
            * used - datetime
            
        */

        // create song_usage table if it doesn't exist
        await this.query("CREATE TABLE IF NOT EXISTS song_usage (soid INT, eid INT, count INT, used TIMESTAMP, PRIMARY KEY(soid, eid))")
    }

    query(query) {
        return new Promise(async (resolve, reject) => {

            try{
                let result = await this.sql.query(query)

                let data = result.rows
                let dataObj = {
                    recordset: data
                }
                resolve(new DBQuery(data, true))
            }catch(e){
                resolve(new DBQuery(null, false))
            }
        })
    }

    edit(query) {
        // no difference between query and edit in this case
        return this.query(query)
    }

    /**
     * Check access based on property name that would go into config (what permission level should be granted)
     * 
     * formatted as permission_[permission_name]
     * 
     * All of these should be specified under the REQUIRED_CONFIG environment variable to ensure that there are no permission errors
     */

    async checkAccess(role, permission_name){

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

    async setConfig(uniq_name, name, value, uid, type){
        
        let existing_config = await this.getConfigProperty_uniq_name(uniq_name)

        if(existing_config.success && existing_config.data.length > 0){

            if(name == null) name = existing_config.data[0].name
            if(value == null) value = existing_config.data[0].value
            if(uid == null) uid = -1
            if(type == null) type = existing_config.data[0].type


            // config exists
            let query = `UPDATE config SET name = '${name}', value = '${value}', uid = ${uid}, type = '${type}' WHERE uniq_name = '${uniq_name}'`
            return this.edit(query)
        } else {

            if(name == null) name = uniq_name
            if(value == null) value = ""
            if(uid == null) uid = -1
            if(type == null) type = type

            // config doesn't exist
            let query = "INSERT INTO config (uniq_name, name, value, uid, type) VALUES ('" + uniq_name + "', '" + name + "', '" + value + "', " + uid + ", '" + type + "')"
            return this.edit(query)
        }
    }

    deleteConfig(uniq_name){
        return this.edit("DELETE FROM config WHERE uniq_name = '" + uniq_name + "'")
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

        return this.query("SELECT * FROM identity_management WHERE mtu_id = '" + mtu_id + "'")
    }

    getIdentity_mtuuid(mtu_uid){
        mtu_uid = sanitizer.sanitize(mtu_uid)

        return this.query("SELECT * FROM identity_management WHERE mtu_uid = '" + mtu_uid + "'")
    }

    getIdentity_uid(uid){

        return this.query("SELECT uid, full_name, rid, last_seen, mtu_based, email FROM identity_management WHERE uid = " + uid)
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

    deleteIdentity_uid(uid){
        return this.edit("DELETE FROM identity_management WHERE uid = " + uid)
    }

    deleteIdentity_mtusso(mtu_id){
        return this.edit("DELETE FROM identity_management WHERE mtu_id = '" + mtu_id + "'")
    }



    // returns the direct user
    // ONLY the CAS is allowed to call this function
    async setup_user_cas(mtu_id, mtu_uid, is_mtu){
        mtu_id = sanitizer.sanitize(mtu_id)
        mtu_uid = sanitizer.sanitize(mtu_uid)

        let identity = await this.getIdentity_mtuuid(mtu_uid)
        console.log(identity.data)
        if(identity.success && identity.data.length > 0){
            // user exists

            // set last_seen of user to current time
            // update mtu_id if it's different
            let query = "UPDATE identity_management SET last_seen = CURRENT_TIMESTAMP, mtu_id = '" + mtu_id + "' WHERE mtu_uid = '" + mtu_uid + "'"
            this.edit(query);

            return identity.data[0]
        } else {
            // user doesn't exist
            let is_mtu_bit = is_mtu ? 1 : 0
            let query = "INSERT INTO identity_management (mtu_id, mtu_uid, mtu_based) VALUES ('" + mtu_id + "', '" + mtu_uid + "' , " + is_mtu + ")"

            let result = await this.edit(query)

            if(result.success){
                return await this.setup_user_cas(mtu_id, mtu_uid, is_mtu)
            } else {
                return null
            }
        }
    }

    async createAlternateAuthentication(email, full_name, pwhash, pwsalt, pwiter){
        email = sanitizer.sanitize(email)

        // insert into identity_management first returning uid
        // make mtu_sso and mtu_uid the same as email
        var result = await this.edit("INSERT INTO identity_management (full_name, mtu_id, mtu_uid, email, mtu_based) VALUES ('" + full_name + "', '" + email + "', '', '" + email + "', 'FALSE') RETURNING uid")

        if(result.success){
            await this.edit("INSERT INTO alternate_authentication (uid, email, pwhash, pwsalt, pwiter) VALUES (" + result.data[0].uid + ", '" + email + "', '" + pwhash + "', '" + pwsalt + "', " + pwiter + ")")
            return result;
        }
    }

    getAlternateAuthentication_uid(uid){
        return this.query("SELECT * FROM alternate_authentication WHERE uid = " + uid)
    }

    getAlternateAuthentication_email(email){
        email = sanitizer.sanitize(email)

        return this.query("SELECT * FROM alternate_authentication WHERE email = '" + email + "'")
    }

    async setAlternateAuthentication_seen(uid){
        let existing_user = await this.getIdentity_uid(uid)

        if(existing_user.success && existing_user.data.length > 0){
            return this.edit("UPDATE identity_management SET last_seen = CURRENT_TIMESTAMP WHERE uid = " + uid)
        }
    }

    async setAlternateAuthentication(uid, email, pwhash, pwsalt, pwiter){
        let existing_user = await this.getAlternateAuthentication_uid(uid)

        if(existing_user.success && existing_user.data.length > 0){
            var user = existing_user.data[0]

            if(email == null) email = user.email
            if(pwhash == null) pwhash = user.pwhash
            if(pwsalt == null) pwsalt = user.pwsalt
            if(pwiter == null) pwiter = user.pwiter

            return this.edit("UPDATE alternate_authentication SET email = '" + email + "', pwhash = '" + pwhash + "', pwsalt = '" + pwsalt + "', pwiter = " + pwiter + " WHERE uid = " + uid)
        }else{
            return this.edit("INSERT INTO alternate_authentication (uid, email, pwhash, pwsalt, pwiter) VALUES (" + uid + ", '" + email + "', '" + pwhash + "', '" + pwsalt + "', " + pwiter + ")")
        }
    }

    async setUserRole(uid, rid){
        let existing_user = await this.getIdentity_uid(uid)

        if(existing_user.success && existing_user.data.length > 0){
            var user = existing_user.data[0]

            if(rid == null) rid = user.rid

            return this.edit("UPDATE identity_management SET rid = " + rid + " WHERE uid = " + uid)
        }else{
            return this.edit("INSERT INTO identity_management (uid, rid) VALUES (" + uid + ", " + rid + ")")
        }
    }

    async update_user_information(mtu_uid, full_name, email){
        full_name = sanitizer.sanitize(full_name);
        email = sanitizer.sanitize(email);


        



        let query = "UPDATE identity_management SET full_name = '" + full_name + "', email = '" + email + "' WHERE mtu_uid = '" + mtu_uid + "'";

        return await this.edit(query)
    }


    getRoles(){
        // have each role contain a count of how many users have that role
        return this.query("SELECT identity_management_roles.*, COUNT(identity_management.rid) AS user_count FROM identity_management_roles LEFT JOIN identity_management ON identity_management_roles.rid = identity_management.rid GROUP BY identity_management_roles.rid, identity_management_roles.name, identity_management_roles.description, identity_management_roles.rid, identity_management_roles.permission, identity_management_roles.icon, identity_management_roles.updated")
    }

    getRole(rid){
        return this.query("SELECT * FROM identity_management_roles WHERE rid = " + rid)
    }

    getUsersWithRole(rid){
        return this.query("SELECT * FROM identity_management WHERE rid = " + rid)
    }

    async setRole(rid, name, permission, description){
        let existing_role = await this.getRole(rid)

        if(existing_role.success && existing_role.data.length > 0){
            var role = existing_role.data[0]

            if(name == null) name = role.name
            if(permission == null) permission = role.permission
            if(description == null) description = role.description

            return this.edit("UPDATE identity_management_roles SET name = '" + name + "', permission = " + permission + ", description = '" + description + "', updated = CURRENT_TIMESTAMP WHERE rid = " + rid)
        }else{

            if(name == null) name = name;
            if(permission == null) permission = 0
            if(description == null) description = ""
            // modify to send back the role that was created (or at least the rid)
            return this.edit("INSERT INTO identity_management_roles (name, permission, updated, description) VALUES ('" + name + "', " + permission + ", CURRENT_TIMESTAMP, '" + description + "') RETURNING *")
        }
    }

    deleteRole(rid){
        return this.edit("DELETE FROM identity_management_roles WHERE rid = " + rid)
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
        return this.edit("INSERT INTO events (etid_used) VALUES (" + etid_used + ") RETURNING *")
    }

    async updateEvent(eid, etyid, etid_used, name, start, ending, show, open, data, location, description){
        // each of the parameters should contain the original values if not being changed

        let existing_event = (await this.getEvent(eid)).data[0]

        if(etyid == null) etyid = existing_event.etyid
        if(etid_used == null) etid_used = existing_event.etid_used
        if(name == null) name = existing_event.name
        if(start == null) start = existing_event.start
        if(ending == null) ending = existing_event.ending
        if(show == null) show = existing_event.show
        if(open == null) open = existing_event.open
        if(data == null) data = existing_event.data
        if(location == null) location = existing_event.location
        if(description == null) description = existing_event.description
        


        name = sanitizer.sanitize(name)
        data = sanitizer.sanitize(data)
        description = sanitizer.sanitize(description)
        location = sanitizer.sanitize(location)

        // handle as boolean in Postgres
        show = show ? "TRUE" : "FALSE"

        var tzoffset = (new Date()).getTimezoneOffset() * 60000;

        // if start is a date object, convert it to a string
        if(start instanceof Date){
            start = (new Date(start - tzoffset)).toISOString().slice(0, -1);
        }
        if(ending instanceof Date){
            ending = (new Date(ending - tzoffset)).toISOString().slice(0, -1);
        }

        return this.edit("UPDATE events SET etyid = " + etyid + ", etid_used = " + etid_used + ", name = '" + name + "', location = '" + location + "', description = '" + description + "', start = '" + start + "', ending = '" + ending + "', show = " + show + ", open = " + open + ", data = '" + data + "', updated = CURRENT_TIMESTAMP WHERE eid = " + eid)
    }

    deleteEvent(eid){
        return this.edit("DELETE FROM events WHERE eid = " + eid)
    }

    getEventTypes(){
        return this.query("SELECT * FROM event_types")
    }

    getEventType(etyid){
        return this.query("SELECT * FROM event_types WHERE etyid = " + etyid)
    }

    async setEventType(etyid, name, icon, color, extra_data){
        let existing_event_type = await this.getEventType(etyid)

        if(existing_event_type.success && existing_event_type.data.length > 0){
            var event_type = existing_event_type.data[0]

            if(name == null) name = event_type.name
            if(icon == null) icon = event_type.icon
            if(color == null) color = event_type.color
            if(extra_data == null) extra_data = event_type.extra_data

            return this.edit("UPDATE event_types SET name = '" + name + "', icon = '" + icon + "', color = '" + color + "', extra_data = '" + extra_data + "', updated = CURRENT_TIMESTAMP WHERE etyid = " + etyid)
        }else{
            return this.edit("INSERT INTO event_types (name, icon, color, extra_data, updated) VALUES ('', '', '', '', CURRENT_TIMESTAMP) RETURNING *")
        }

    }

    deleteEventType(etyid){
        return this.edit("DELETE FROM event_types WHERE etyid = " + etyid)
    }

    getEventTemplates(){
        return this.query("SELECT * FROM event_templates")
    }
    getEventTemplates_etyid(etyid){
        return this.query("SELECT * FROM event_templates WHERE etyid = " + etyid)
    }
    getEventTemplate(etid){
        return this.query("SELECT * FROM event_templates WHERE etid = " + etid)
    }

    async setEventTemplate(etid, etyid, name, data){
        let existing_event_template = await this.getEventTemplate(etid)
        if(existing_event_template.success && existing_event_template.data.length > 0){
            var event_template = existing_event_template.data[0]

            if(etyid == null) etyid = event_template.etyid
            if(name == null) name = event_template.name
            if(data == null) data = event_template.data

            return this.edit("UPDATE event_templates SET etyid = " + etyid + ", name = '" + name + "', data = '" + data + "', updated = CURRENT_TIMESTAMP WHERE etid = " + etid)
        }else{
            return this.edit("INSERT INTO event_templates (etyid, name, data, updated) VALUES (" + etyid + ", '', '', CURRENT_TIMESTAMP) RETURNING *")
        }
    }

    deleteEventTemplate(etid){
        return this.edit("DELETE FROM event_templates WHERE etid = " + etid)
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


    getSongs(){
        return this.query("SELECT * FROM songs")
    }

    getSong(soid){
        return this.query("SELECT * FROM songs WHERE soid = " + soid)
    }

    async setSong(soid, name, friendly_name, modification, artist, duration, source, category){
        let existing_song = await this.getSong(soid)

        if(existing_song.success && existing_song.data.length > 0){
            var song = existing_song.data[0]

            if(name == null) name = song.name
            if(friendly_name == null) friendly_name = song.friendly_name
            if(modification == null) modification = song.modification
            if(artist == null) artist = song.artist
            if(duration == null) duration = song.duration
            if(source == null) source = song.source
            if(category == null) category = song.category

            return this.edit("UPDATE songs SET name = '" + name + "', friendly_name = '" + friendly_name + "', modification = '" + modification + "', artist = '" + artist + "', duration = '" + duration + "', source = '" + source + "', category = '" + category + "', updated = CURRENT_TIMESTAMP WHERE soid = " + soid)
        }else{
            return this.edit("INSERT INTO songs (name, friendly_name, modification, artist, duration, source, category, updated) VALUES ('" + name + "', '', '', '', 0, '', 'regular', CURRENT_TIMESTAMP) RETURNING *")
        }
    }

    deleteSong(soid){
        return this.edit("DELETE FROM songs WHERE soid = " + soid)
    }

    getSongUsages(){
        return this.query("SELECT * FROM song_usage")
    }

    getSongUsage(soid){
        return this.query("SELECT * FROM song_usage WHERE soid = " + soid)
    }

    getSongUsage_instance(soid, eid){
        return this.query("SELECT * FROM song_usage WHERE soid = " + soid + " AND eid = " + eid)
    }

    async setSongUsage(soid, eid, count){
        let existing_song_usage = await this.getSongUsage(soid)

        if(existing_song_usage.success && existing_song_usage.data.length > 0){
            var song_usage = existing_song_usage.data[0]

            if(count == null) count = song_usage.count

            return this.edit("UPDATE song_usage SET count = " + count + ", used = CURRENT_TIMESTAMP WHERE soid = " + soid + " AND eid = " + eid)
        }else{
            return this.edit("INSERT INTO song_usage (soid, eid, count, used) VALUES (" + soid + ", " + eid + ", " + count + ", CURRENT_TIMESTAMP)")
        }

    }

    deleteSongUsage(soid, eid){
        return this.edit("DELETE FROM song_usage WHERE soid = " + soid + " AND eid = " + eid)
    }

    getSplits(){
        return this.query("SELECT * FROM splits")
    }

    getSplit(sid){
        return this.query("SELECT * FROM splits WHERE sid = " + sid)
    }

    async setSplit(sid, gid, name, icon, open, extra_data, color){
        let existing_split = await this.getSplit(sid)

        if(existing_split.success && existing_split.data.length > 0){
            var split = existing_split.data[0]

            if(gid == null) gid = split.gid
            if(name == null) name = split.name
            if(icon == null) icon = split.icon
            if(open == null) open = split.open
            if(color == null) color = split.color
            else{
                open = open ? "TRUE" : "FALSE"
            }
            if(extra_data == null) extra_data = split.extra_data

            return this.edit("UPDATE splits SET gid = " + gid + ", name = '" + name + "', icon = '" + icon + "', open = '" + open + "', extra_data = '" + extra_data + "', updated = CURRENT_TIMESTAMP, color = '" + color + "'" + " WHERE sid = " + sid);
        }else{
            return this.edit("INSERT INTO splits (gid, name, icon, open, extra_data, updated, color) VALUES (" + gid + ", '" + name + "', '', 'FALSE', '', CURRENT_TIMESTAMP, '') RETURNING *")
        }
    }

    deleteSplit(sid){
        return this.edit("DELETE FROM splits WHERE sid = " + sid)
    }

    getGroups(){
        return this.query("SELECT * FROM groups")
    }

    getGroup(gid){
        return this.query("SELECT * FROM groups WHERE gid = " + gid)
    }

    async setGroup(gid, name, icon, description, open, extra_data, color){
        let existing_group = await this.getGroup(gid)

        if(existing_group.success && existing_group.data.length > 0){
            var group = existing_group.data[0]

            if(name == null) name = group.name
            if(icon == null) icon = group.icon
            if(description == null) description = group.description
            if(open == null) open = group.open
            if(color == null) color = group.color
            else{
                open = open ? "TRUE" : "FALSE"
            }
            if(extra_data == null) extra_data = group.extra_data



            return this.edit("UPDATE groups SET name = '" + name + "', icon = '" + icon + "', description = '" + description + "', open = '" + open + "', extra_data = '" + extra_data + "', updated = CURRENT_TIMESTAMP, color = '" + color + "'" + " WHERE gid = " + gid)
        }else{
            return this.edit("INSERT INTO groups (name, icon, description, open, extra_data, updated, color) VALUES ('" + name + "', '', '','FALSE', '', CURRENT_TIMESTAMP, '') RETURNING *")
        }
    }

    deleteGroup(gid){
        return this.edit("DELETE FROM groups WHERE gid = " + gid)
    }

    getUserGroups(uid){
        return this.query("SELECT * FROM identity_management_groups INNER JOIN groups ON identity_management_groups.gid = groups.gid WHERE identity_management_groups.uid = " + uid);
    }

    getGroupMembers(gid){
        return this.query("SELECT * FROM identity_management INNER JOIN identity_management_groups ON identity_management.uid = identity_management_groups.uid WHERE identity_management_groups.gid = " + gid)
    }

    getGroupElevated(gid){
        // return all users with elevated status for this group (with a join on identity_management by uid ONLY for full_name and uid)
        return this.query("SELECT identity_management.full_name, identity_management.uid, identity_management_groups.elevated FROM identity_management_groups INNER JOIN identity_management ON identity_management_groups.uid = identity_management.uid WHERE identity_management_groups.gid = " + gid + " AND identity_management_groups.elevated = TRUE")
    }

    getGroupSplits(gid){
        return this.query("SELECT * FROM splits WHERE gid = " + gid)
    }
    
    getGroupMember(uid, gid){
        return this.query("SELECT * FROM identity_management_groups WHERE uid = " + uid + " AND gid = " + gid)
    }

    async setGroupMember(uid, gid, elevated){

        let groupMember = await this.getGroupMember(uid, gid);

        if(groupMember.success && groupMember.data.length > 0){
            elevated = elevated ? "TRUE" : "FALSE"
            return this.edit("UPDATE identity_management_groups SET updated = CURRENT_TIMESTAMP, elevated = '" + elevated + "' WHERE uid = " + uid + " AND gid = " + gid)
        }else{
            elevated = elevated ? "TRUE" : "FALSE"
            return this.edit("INSERT INTO identity_management_groups (uid, gid, updated, elevated) VALUES (" + uid + ", " + gid + ", CURRENT_TIMESTAMP, '" + elevated + "')");
        }

        

        
    }

    deleteGroupMember(uid, gid){
        return this.edit("DELETE FROM identity_management_groups WHERE uid = " + uid + " AND gid = " + gid)
    }

    getUserSplits(uid){
        return this.query("SELECT * FROM identity_management_splits INNER JOIN splits ON identity_management_splits.sid = splits.sid WHERE identity_management_splits.uid = " + uid);
    }

    getSplitMembers(sid){
        return this.query("SELECT * FROM identity_management INNER JOIN identity_management_splits ON identity_management.uid = identity_management_splits.uid WHERE identity_management_splits.sid = " + sid)
    }

    getSplitElevated(sid){
        return this.query("SELECT identity_management.full_name, identity_management_splits.elevated FROM identity_management_splits INNER JOIN identity_management ON identity_management_splits.uid = identity_management.uid WHERE identity_management_splits.sid = " + sid + " AND identity_management_splits.elevated = TRUE")
    }

    setSplitMember(uid, sid, elevated){
            
        elevated = elevated ? "TRUE" : "FALSE"
    
        return this.edit("INSERT INTO identity_management_splits (uid, sid, updated, elevated) VALUES (" + uid + ", " + sid + ", CURRENT_TIMESTAMP, '" + elevated + "')");
    }

    deleteSplitMember(uid, sid){
        return this.edit("DELETE FROM identity_management_splits WHERE uid = " + uid + " AND sid = " + sid)
    }
}

module.exports = Database