class UserConnectionRecord {
    constructor(socket,userData) {
        this.socket = socket;
        this.userData = userData;
        this.metadata = {};
    }
        
    setMeta(key, value) {
        this.metadata[key] = value;
    }

    getMeta(key) {
        return this.metadata[key];
    }

    hasMeta(key) {
        return !!this.metadata[key];
    }

    deleteMeta(key) {
        delete this.metadata[key];
    }
}


module.exports = UserConnectionRecord;