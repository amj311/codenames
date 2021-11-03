const GameHelpers = require("./GameHelpers");

class UniqueIdManager {
    constructor(length) {
        this.idLength = length;
        this.ids = new Set();
    }

    getNew() {
        let newId;
        do {
            newId = GameHelpers.randomString(this.idLength);
        } while (this.ids.has(newId))
        this.ids.add(newId);
        return newId;
    }

    remove(id) {
        this.ids.delete(id);
    }
}

module.exports = UniqueIdManager;