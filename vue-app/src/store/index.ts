import Vue from 'vue'
import Vuex from 'vuex'
import socketio from 'socket.io-client'
import axios from 'axios'
import Notification from '../utils/Notification'

Vue.use(Vuex)

let gameplayHandler:any;
let roomHandler:any;


export default new Vuex.Store({
  state: {
    apiUrl: process.env.NODE_ENV=="development"? "http://localhost:3000" : "",
    socket: null,
    view: 'start',
    wordSet: [],
    room: {
      mode: null,
      id: null,
      players: [],
      codeMasters: [],
    },
    
    game: {
      state: null,
      config: {
        numCardsSqrt:5,
        numTeams:2,
        numTeamCards:9,
        numAssassins:1,
        numBystanders:6,
      },

      cards: [],

      teams: {
        teamOne: { qty: 9, selectable: true, color: "#0bf", name: "Blue", deck: [], points: 0, img: require('@/assets/ninjas/blue.png'), members: [] },
        teamTwo: { qty: 9, selectable: true, color: "#f22", name: "Red", deck: [], points: 0, img: require('@/assets/ninjas/red.png'), members: [] },
        teamThree: { qty: 0, selectable: false, color: "#0f2", name: "Green", deck: [], points: 0, img: require('@/assets/ninjas/green.png'), members: [] },
        bystander: { qty: 6, selectable: true, color: "#edcb40", name: "Bystander", deck: [], points: 0, img: require('@/assets/ninjas/yellow.png'), members: [] },
        assassin: { qty: 1, color: "#2c3e50", name: "Assassin", deck: [], points: 0, img: require('@/assets/ninjas/black.png') },
      },


      teamOfTurn: null,
      canPlay: false,
      roundStatus: 'room',
      winner: null,
      turnHint: "",
      usedGuesses: 0,
    },

    user: {
      id: Date.now()+Math.random()*(Math.random()+1),
      isHost: false,
      isPlayer: false,
      isCaptain: false,
      teamCode: null,
      nickname: '',
    },

    ninjasImgs: {
      black: require('@/assets/ninjas/black.png'),
      red: require('@/assets/ninjas/red.png'),
      blue: require('@/assets/ninjas/blue.png'),
      yellow: require('@/assets/ninjas/yellow.png'),
    },
    
    modal: {
      msg: "",
      img: null,
      form: null,
      onEX: null,
      onOK: null,
      onNO: null,
      closeTimeout: function() {},
      isValid: function() { return true },
    },

    notifs: [],

  },
  mutations: {
    goToView(state: any, view:string) {
      state.view = view;
    },
    updateStateObject(state, options:{object:string, props:any}) {
      let stateKeys = Object.keys(state[options.object]);
      if (!state[options.object]) return console.log('State has no such member: '+options.object)

      for (let key of Object.keys(options.props)) {
        if (stateKeys.lastIndexOf(key) >= 0) state[options.object][key] = options.props[key];
        // else console.error("state."+options.object+" has no property " + key)
      }
    },
    updateTeamMembers(state, props:{teamCode:string,members:any}) {
      state.game.teams[props.teamCode].members = props.members;
    },
    setTeamQty(state, props:{team: string, qty:number}) {
      state.game.teams[props.team].qty = Number(props.qty);
      console.log(props.team+" qty is now: "+state.game.teams[props.team].qty)
    },
    setTeamCaptain(state, props:{team: string, captain:any}) {
      console.log(props.captain)
      Array.from(Object.values(state.game.teams)).forEach((t:any)=>{
        if (props.captain && t.captain && t.captain.name == props.captain.name) t.captain = null;
      })
      state.game.teams[props.team].captain = props.captain;
    },
    resetRound(state) {
      state.game.turnHint = "";
      state.game.turnGuesses = 1;
      state.game.usedGuesses = 0;
    },
    resetGame(state){
      state.game.teamOfTurn = null;
      state.game.canPlay = false;
      state.game.roundStatus = '';
      state.game.winner = null;
      state.game.turnHint = "";
      state.game.usedGuesses = 0;
    },
    newHint(state, props: {turnHint: string, turnGuesses: number}) {
      state.game.turnHint = props.turnHint;
      state.game.turnGuesses = props.turnGuesses;
    },
    updateModal(state: any, props) {
      state.modal.form = props.form;
      state.modal.onEX = props.onEX;
      state.modal.onOK = props.onOK;
      state.modal.onNO = props.onNO;
      state.modal.img = props.img;
      state.modal.msg = props.msg;
      state.modal.alert = props.alert;
      state.modal.isValid = props.isValid || function() { return true };
    },

    setWords(state, set) {
      state.wordSet = set;
    },

    clearBoard(state) {
      state.game.cards = [];
      
      let team: any;
      for (team of Object.values(state.game.teams)) {
        team.deck = [];
        team.points = 0;
      }
    },

    setGameplayHandler(state, handler) {
      gameplayHandler = handler;
    },
    setRoomHandler(state, handler) {
      roomHandler = handler;
    },

  },



  actions: {
    resetToStart(context) {
      context.state.room =  {
        mode: null,
        id: null,
        players: [],
        codeMasters: [],
      }
      context.state.user = {
        isHost: false,
        isPlayer: false,
        isCaptain: false,
        teamCode: null,
        nickname: '',
      }
      context.commit('goToView', 'start')
      removeUnclosedConn();
      context.state.socket.disconnect()
      context.state.socket = null;
    },

    closeRoom(context) {
      axios.delete(context.state.apiUrl+"/api/closeroom/"+context.state.room.id)
    },

    updateGameState(context, props) {
      context.commit('updateStateObject', {object:'game',props})
      console.log("game:",context.state.game)
    },
    updateRoomState(context, props) {
      context.commit('updateStateObject', {object:'room',props})
    },
    updateUserState(context, props) {
      context.commit('updateStateObject', {object:'user',props})
    },



    connectToRoom(context:any, options:{rid:string, cb: any}) {
      removeUnclosedConn();

      let state = context.state;
      state.socket = setupNewSocket(state.socket,context);
      let socket = state.socket;
      
      socket.emit('joinRoom',options.rid, state.user, () => {
        state.room.id = options.rid;
        setUnclosedConn(socket.id,state.room.id);
        options.cb();
      })
    },
    
    setupGameRoom(context, props: {id:string}) {
      context.state.user.isHost = true;

      context.dispatch('connectToRoom', {rid: props.id, cb: () => {
        context.dispatch('updateRoomState', props)
        context.commit('goToView', 'room')
      }});
    },
    joinGameRoom(context, rid:string) {
      context.state.user.isHost = false;
      context.state.user.isPlayer = true;
      
      console.log('joinGameRoom '+rid)
      context.dispatch('connectToRoom', {rid, cb: () => {
        context.dispatch('updateRoomState', rid)
        context.commit('goToView', 'room')
      }});
    },

    async attemptReconnect(context,oldConn) {
      let res = await axios.get(context.state.apiUrl+"/api/canrejoin/"+oldConn.roomId+"/"+oldConn.socketId)
        .then(res=>res.data)
        .catch(err=>{
          console.log(err);
          context.dispatch("publishNotif", new Notification({
            type:"err",
            msg: `Lost connection to server.`
          }))
        })

      console.log("Trying to reconnect: ",oldConn)

      context.dispatch("publishNotif", new Notification({
        msg: `Trying to reconnect to room ${oldConn.roomId.toUpperCase()}`
      }))
      let tryNotifId = context.state.notifs[context.state.notifs.length-1].id;

      if(res && res.ok) {
        removeUnclosedConn();

        let state = context.state;
        if (!state.socket) state.socket = setupNewSocket(state.socket,context);
        let socket = state.socket;
        
        socket.emit('rejoinRoom', oldConn.roomId, oldConn.socketId, (userData:Object,gameData:Object,roomData:Object) => {
          console.log("Reconnecting with data:",userData,roomData,gameData)

          state.user = userData;
          state.room = roomData;
          state.game = gameData;

          setUnclosedConn(socket.id,state.room.id);

          context.dispatch("removeNotif", tryNotifId);
          context.dispatch("publishNotif", new Notification({
            msg: "Reconnected to room "+context.getters.roomId
          }))
          context.commit('goToView', 'room')

        })  
      }

      
      else {
        context.dispatch("removeNotif", tryNotifId);

        context.dispatch("publishNotif", new Notification({
          type:"err",
          msg: `Reconnect failed.`
        }))
        removeUnclosedConn();
        context.dispatch("resetToStart");
      }
    },

    emitUserData(context) {
      context.state.socket.emit('updateUserData', context.state.user)
    },
    emitRoom(context) {
      context.state.socket.emit('updateRoom', context.state.room)
    },
    emitGamePieces(context, keys) {
      let props:any = {};
      keys.forEach((key:any) => {
        props[key] = context.state.game[key];
      });
      
      console.log("emitting game pieces:", props)
      context.state.socket.emit('updateGamePieces', props)
    },


    invokeGameMethod(context,props:{method:string,args:any[]}) {
      context.state.socket.emit('invokeGameMethod', props.method,props.args)
    },

    openModal(context: any, props) {
      context.commit('updateModal', props)
      if (props.timeout) context.state.modal.closeTimeout = setTimeout( () => context.dispatch('closeModal'), props.timeout);
    },
    modal_on(context: any, action: string) {
      if (action == "OK" && !context.state.modal.isValid()) return alert(context.state.modal.alert);
      if (context.state.modal["on"+action]) {
        context.state.modal["on"+action]();
      }
      context.dispatch('closeModal');
    },
    closeModal(context) {
      if (context.state.modal.onEX) context.state.modal.onEX();
      context.state.modal.msg = "";
      context.state.modal.onOK = context.state.modal.onNO = context.state.modal.onEX = context.state.modal.img = context.state.modal.form = null;
      window.clearTimeout(context.state.modal.closeTimeout);
    },

    publishNotif(context, notif) {
      context.state.notifs.push(notif);
      if (!notif.sticky) setTimeout(()=>context.dispatch("removeNotif",notif.id), 5000)
    },

    removeNotif(context,notifId) {
      context.state.notifs = context.state.notifs.filter((n:any)=>n.id!=notifId);
    },
    consumeNotif(context,props:{id:any,action:any}) {
      props.action();
      context.dispatch("removeNotif",props.id)
    },

  },
  modules: {
  },

  getters: {
    roomId: state => state.room.id.toUpperCase()
  }
})


function setupNewSocket(socket:any,context:any) {
  let state = context.state;
  if (!socket) socket = socketio(context.state.apiUrl);

  
  socket.on('connect', () => {
    let oldConnection = getUnclosedConn();
    if (oldConnection) {
      console.log("Can try reconnecting to old connection.")
      context.dispatch("attemptReconnect",oldConnection);
    }
  });

  socket.on('msg', (msg: string) => console.log("Message from socket: "+msg));
  socket.on('err', (msg: string) => {
    console.log("Error from socket: "+msg);
    context.dispatch("publishNotif", new Notification({msg}))
  });

  socket.on('updateGamePieces', (props:any)=> {
    context.dispatch('updateGameState', props)
  })
  socket.on('updateRoom', (props:any)=> {
    context.dispatch('updateRoomState', props)
  })
  socket.on('updatePlayers', (props:any)=> {
    context.dispatch('updateRoomState', {players: props})
    for (let teamCode of Object.keys(state.game.teams)) {
      let members = state.room.players.filter( (p:any) => (p.teamCode == teamCode) || (teamCode == 'bystander' && !p.teamCode));
      context.commit('updateTeamMembers', { teamCode, members })
    }
  })
  socket.on('handleGameplay', (props:{method:string,payload:any})=> {
    if (gameplayHandler && gameplayHandler[props.method]) gameplayHandler[props.method](props.payload);
    else console.warn("Gameplayhandler does not have method "+props.method)
  })
  socket.on('handleRoomUpdate', (props:{method:string,payload:any})=> {
    if (roomHandler && roomHandler[props.method]) roomHandler[props.method](props.payload);
    else console.warn("Roomhandler does not have method "+props.method)
  })

  socket.on('roomClosed', ()=> {
    console.log("The game was closed.")
    context.dispatch("publishNotif", new Notification({
      type:"err",
      msg: "The room was closed."
    }))
    context.dispatch("resetToStart")
  })

  socket.on('disconnect', ()=> {
    if(getUnclosedConn()) {
      context.dispatch("publishNotif", new Notification({
        type:"err",
        msg: "You've been disconnected!. Trying to reconnect..."
      }))

      setTimeout(()=>{
        context.dispatch("attemptReconnect",getUnclosedConn());
      }, 5000)
    }
  })

  return socket;
}


function setUnclosedConn(socketId:string,roomId:string) {
  let connectionData = {socketId,roomId}
  sessionStorage.setItem("unclosedConnection",JSON.stringify(connectionData))
}
function getUnclosedConn() {
  let json = sessionStorage.getItem("unclosedConnection")
  console.log("Unclosed connection:",json)
  return json? JSON.parse(json) : null;
}
function removeUnclosedConn() {
  return sessionStorage.removeItem("unclosedConnection")
}