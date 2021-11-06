const Game = require("../entities/Game");
const UserConnectionRecord = require("../entities/UserConnectionRecord");
const GameHelpers = require("../services/GameHelpers");
const UniqueIdManager = require("../services/UniqueIdManager");

const WAS_CAPTAIN_TEAM = "WAS_CAPTAIN_TEAM";
class GameRoomManager {

    constructor(rid) {
        console.log("Creating new room: "+rid)
        this.id = rid;
        this.game = new Game();
        this.userIds = new UniqueIdManager(10);
        this.connections = new Map(); //Map<SocketID,{socket,userData}>
        this.lostConnections = new Map(); //Map<SocketID,{socket,userRecord}>
    }

    addPlayer(socket, userData) {
        if (userData.id) console.log("New player already had ID!", userData.id);
        userData.id = this.userIds.getNew();
        this.setupPlayerSocket(socket,userData,()=>{
            this.emitToAllConnections('handleRoomUpdate', {method:"playerConnect",payload:userData});
            socket.emit('updateRoom', this.getRoomSummary())
            socket.emit('updateGamePieces', this.game)    
        });
        return userData;
    }

    setupPlayerSocket(socket,userData,cb) {
        console.log("setting up socket "+socket.id)
        this.connections.set(socket.id, new UserConnectionRecord(socket,userData));

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

            this.handleLostUserRecord(oldConn);
        })

        socket.on('updateUserData', (newUserData) => {
            this.connections.set(socket.id, new UserConnectionRecord(socket,newUserData));
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

        this.handleLostUserRecord(lostConn);
    }

    handleLostUserRecord(record) {
        let userData = record.userData;
        if (userData.isHost) this.emitToAllConnections('handleRoomUpdate', {method:"hostDisconnect",payload:userData});
        if (userData.isPlayer) this.emitToAllConnections('handleRoomUpdate', {method:"playerDisconnect",payload:userData});
        
        let captainTeam = GameHelpers.getCaptainsTeam(userData,this.game.teams);
        if (captainTeam) {
            record.setMeta('wasCaptainOfTeam',captainTeam);
            this.game.setTeamCaptain(false,captainTeam.id,userData);
            this.emitToAllConnections('updateGamePieces', this.game);
        }
        this.emitToAllConnections('updatePlayers', this.getPlayers());
    }

    canReconnect(socketId) {
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

        if (oldConnPair.hasMeta(WAS_CAPTAIN_TEAM)) {
            let oldTeamId = oldConnPair.getMeta(WAS_CAPTAIN_TEAM).id;
            
            // If the team does not have a new captain.
            if(!this.game.teams[oldTeamId].captain) {
                this.game.setTeamCaptain(true,oldTeamId,oldUserData);
            }
            this.emitToAllConnections('updateGamePieces', this.game);
        }

        if (newSocket.id != oldSockId) this.setupPlayerSocket(newSocket,oldUserData,()=>{
            cb(oldUserData,this.game,this.getRoomSummary())
        })
        this.emitToAllConnections('updatePlayers', this.getPlayers());

        return true;
    }

    beforeClose() {
        Array.from(this.connections.values()).forEach(c => {
            this.connections.delete(c.socket.id);
            c.socket.emit('roomClosed');
        })
    }

    emitToAllConnections(action, data) {
        Array.from(this.connections.values()).forEach(c => {
            c.socket.emit(action, data);
        })
    }

}

module.exports = GameRoomManager;