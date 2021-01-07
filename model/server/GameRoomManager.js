const Game = require("../model/entities/Game");

class GameRoomManager {

    constructor(rid, mode) {
        console.log("Creating new "+mode+" room: "+rid)
        this.id = rid;
        this.mode = mode;

        this.game = new Game();
        
        this.connections = [];
        this.host = null;
    }

    addPlayer(socket, userData) {
        this.connections.push({socket,userData});
        if (userData.isHost) this.host = this.connections[this.connections.length-1];
        socket.join(this.id);
        socket.emit('updateRoom', this.getRoomSummary())
        socket.emit('updateGamePieces', this.game)

        this.setupPlayerSocket(socket);
    }

    setupPlayerSocket(socket) {
        socket.on('invokeGameMethod', (method,args) => {
            let payload = this.game[method](...args);
            this.emitToAllConnections("handleGameplay", {method, payload});
        })

        socket.on('updateGamePieces', (props) => {
            for (let key of Object.keys(props)) {
                this.game[key] = props[key];
            }
            this.emitToAllConnections('updateGamePieces', props);

        })

        socket.on('updateUserData', (newUserData) => {
            this.connections.forEach(c => {
                if (c.socket.id == socket.id) c.userData = newUserData;
            })
            this.emitToAllConnections('updatePlayers', this.getPlayers());
        })
    }

    getRoomSummary() {
        return {
            id: this.id,
            mode: this.mode || null,
            players: this.getPlayers(),
        }
    }

    getPlayers() {
        let players = [];
        this.connections.forEach(c => {
            if (c.userData.isPlayer) players.push(c.userData);
        })
        return players;
    }

    emitToAllConnections(action, data) {
        this.connections.forEach(c => {
            c.socket.emit(action, data);
        })
    }

    emitAll() {}
}

module.exports = GameRoomManager;