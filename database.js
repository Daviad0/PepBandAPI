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

        setTimeout(() => {
            var required_config = process.env.REQUIRED_CONFIG.split(",")
            var default_values = process.env.REQUIRED_CONFIG_DEFAULT.split(",")

            for (var i = 0; i < required_config.length; i++) {
                var j = i;
                this.getConfigProperty_uniq_name(required_config[i]).then((result) => {
                    if (result.data.length == 0) {
                        console.log("Creating required config " + result.uniq_name)
                        this.setConfig(required_config[j], required_config[j], default_values[j], -1, "string");
                    }
                });
                
            }
        },5000);

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
            let query = "INSERT INTO identity_management (mtu_id, mtu_uid, mtu_based) VALUES ('" + mtu_id + "', '" + mtu_uid + "' , " + is_mtu_bit + ")"

            let result = await this.edit(query)

            if(result.success){
                return await this.setup_user_cas(mtu_id, mtu_uid, is_mtu)
            } else {
                return null
            }
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
        return this.query("SELECT identity_management_roles.*, COUNT(identity_management.rid) AS user_count FROM identity_management_roles LEFT JOIN identity_management ON identity_management_roles.rid = identity_management.rid GROUP BY identity_management_roles.rid, identity_management_roles.name, identity_management_roles.[description], identity_management_roles.rid, identity_management_roles.permission, identity_management_roles.icon, identity_management_roles.updated")
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
            return this.edit("INSERT INTO identity_management_roles (name, permission, updated, description) OUTPUT Inserted.rid VALUES ('" + name + "', " + permission + ", CURRENT_TIMESTAMP, '" + description + "')")
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
            return this.edit("INSERT INTO event_types (name, icon, color, extra_data, updated) OUTPUT Inserted.etyid VALUES ('" + name + "', '" + icon + "', '" + color + "', '" + extra_data + "', CURRENT_TIMESTAMP)")
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
            return this.edit("INSERT INTO event_templates (etyid, name, data, updated) OUTPUT Inserted.etid VALUES (" + etyid + ", '" + name + "', '" + data + "', CURRENT_TIMESTAMP)")
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
            return this.edit("INSERT INTO songs (name, updated) OUTPUT Inserted.soid VALUES ('" + name + "', CURRENT_TIMESTAMP)")
        }
    }

    deleteSong(soid){
        return this.edit("DELETE FROM songs WHERE soid = " + soid)
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
            return this.edit("INSERT INTO song_usage (soid, eid, count, last_used) OUTPUT Inserted.suid VALUES (" + soid + ", " + eid + ", " + count + ", CURRENT_TIMESTAMP)")
        }

    }

    deleteSongUsage(soid, eid){
        return this.edit("DELETE FROM song_usage WHERE soid = " + soid + " AND eid = " + eid)
    }

}

module.exports = Database