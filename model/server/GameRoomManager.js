const Game = require("../model/entities/Game");

class GameRoomManager {

    constructor(rid, mode) {
        console.log("Creating new "+mode+" room: "+rid)
        this.id = rid;
        this.mode = mode;

        this.game = new Game();
        
        this.connections = new Map(); //Map<SocketID,{socket,userData}>
        this.lostConnections = new Map(); //Map<SocketID,{socket,userData}>
        this.host = null;
    }

    addPlayer(socket, userData) {
        if (userData.isHost) this.host = this.connections.get(socket.id);
        this.setupPlayerSocket(socket,userData,()=>{
            this.emitToAllConnections('handleRoomUpdate', {method:"playerConnect",payload:userData});
            socket.emit('updateRoom', this.getRoomSummary())
            socket.emit('updateGamePieces', this.game)    
        });
    }

    setupPlayerSocket(socket,userData,cb) {
        console.log("setting up socket "+socket.id)
        this.connections.set(socket.id,{socket,userData});

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
            Array.from(this.connections.values()).forEach(c => {
                if (c.socket.id == socket.id) c.userData = newUserData;
            })
            this.emitToAllConnections('updatePlayers', this.getPlayers());
        })

        
        socket.on('disconnect', () => {
            this.handleLostSocket(socket)
        })

        cb();
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
        Array.from(this.connections.values()).forEach(c => {
            if (c.userData.isPlayer) players.push(c.userData);
        })
        return players;
    }

    handleLostSocket(newSocket) {
        let oldConn = this.connections.get(newSocket.id);
        console.log("Lost user: "+newSocket.id, oldConn.userData);

        this.connections.delete(newSocket.id);
        this.lostConnections.set(newSocket.id,oldConn);

        if (oldConn.userData.isHost) this.emitToAllConnections('handleRoomUpdate', {method:"hostDisconnect",payload:oldConn.userData});
        if (oldConn.userData.isPlayer) this.emitToAllConnections('handleRoomUpdate', {method:"playerDisconnect",payload:oldConn.userData});

        this.emitToAllConnections('updatePlayers', this.getPlayers());
    }

    canReconnect(socketId) {
        console.log(socketId)
        return this.lostConnections.has(socketId);
    }

    handleReturningPlayer(newSocket,oldSockId,cb) {        
        let oldConnPair = this.lostConnections.get(oldSockId);
        if (!oldConnPair) return false;

        this.lostConnections.delete(oldSockId);

        this.setupPlayerSocket(newSocket,oldConnPair.userData,()=>{
            cb(oldConnPair.userData,this.game,this.getRoomSummary())

            if (oldConnPair.userData.isHost) this.emitToAllConnections('handleRoomUpdate', {method:"hostReconnect",payload:oldConnPair.userData});
            if (oldConnPair.userData.isPlayer) this.emitToAllConnections('handleRoomUpdate', {method:"playerReconnect",payload:oldConnPair.userData});
    
            this.emitToAllConnections('updatePlayers', this.getPlayers());    
        })
        return true;
    }

    beforeClose() {
        this.emitToAllConnections('roomClosed');
    }

    emitToAllConnections(action, data) {
        Array.from(this.connections.values()).forEach(c => {
            c.socket.emit(action, data);
        })
    }

    emitAll() {}
}

module.exports = GameRoomManager;