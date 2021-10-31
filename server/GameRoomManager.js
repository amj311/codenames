const Game = require("../model/entities/Game");

class GameRoomManager {

    constructor(rid) {
        console.log("Creating new room: "+rid)
        this.id = rid;
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

        socket.on('invokeGameMethod', (method,args,cb) => {
            let payload = this.game[method](...args,cb);
            this.emitToAllConnections("handleGameplay", {method, payload});
        })

        socket.on('updateGamePieces', (props) => {
            for (let key of Object.keys(props)) {
                this.game[key] = props[key];
            }
            this.emitToAllConnections('updateGamePieces', props);
        })

        socket.on('leaveRoom', () => {
            let oldConn = this.connections.get(socket.id);
            if (!oldConn) return;
    
            this.connections.delete(socket.id)
            this.handleLostUserData(oldConn.userData);
        })

        socket.on('updateUserData', (newUserData) => {
            this.connections.set(socket.id, {socket,userData:newUserData});
            console.log("new user data",this.connections.get(socket.id).userData)
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

    handleLostSocket(socket) {
        let lostConn = this.connections.get(socket.id);
        if (!lostConn) return;

        console.log("Lost user: "+socket.id, lostConn.userData);

        this.connections.delete(socket.id);
        this.lostConnections.set(socket.id,lostConn);

        this.handleLostUserData({...lostConn.userData});
    }

    handleLostUserData(userData) {
        if (userData.isHost) this.emitToAllConnections('handleRoomUpdate', {method:"hostDisconnect",payload:userData});
        if (userData.isPlayer) this.emitToAllConnections('handleRoomUpdate', {method:"playerDisconnect",payload:userData});

        if (userData.isCaptain) {
            this.game.setTeamCaptain(false,userData.teamCode,userData);
            this.emitToAllConnections('updateGamePieces', {teams:this.game.teams});
        }
        this.emitToAllConnections('updatePlayers', this.getPlayers());
    }

    canReconnect(socketId) {
        console.log(socketId)
        return this.lostConnections.has(socketId) || this.connections.has(socketId);
    }

    handleReturningPlayer(newSocket,oldSockId,cb) {
        let oldConnPair = this.lostConnections.get(oldSockId) || this.connections.get(oldSockId);
        if (!oldConnPair) return false;

        this.lostConnections.delete(oldSockId);

        let oldUserData = oldConnPair.userData;
        console.log("returning user:", oldSockId, oldUserData);

        if (oldUserData.isHost) this.emitToAllConnections('handleRoomUpdate', {method:"hostReconnect",payload:oldUserData});
        if (oldUserData.isPlayer) this.emitToAllConnections('handleRoomUpdate', {method:"playerReconnect",payload:oldUserData});

        if (oldUserData.isCaptain) {
            if(!this.game.teams[oldUserData.teamCode].captain)
                this.game.setTeamCaptain(true,oldUserData.teamCode,oldUserData);
            else {
                oldUserData.isCaptain = false;
                oldUserData.teamCode = null;
            }
            this.emitToAllConnections('updateGamePieces', {teams:this.game.teams});
        }

        if (newSocket.id != oldSockId) this.setupPlayerSocket(newSocket,oldUserData,()=>{
            cb(oldUserData,this.game,this.getRoomSummary())
        })
        this.emitToAllConnections('updatePlayers', this.getPlayers());

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