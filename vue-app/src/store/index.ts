import Vue from 'vue'
import Vuex from 'vuex'
import socketio from 'socket.io-client'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    socket: null,
    view: 'start',
    wordSet: [],
    room: {
      mode: null,
      id: null,
      players: []
    },
    
    game: {
      layoutSqrFactor: 5,
      cards: [],

      teams: {
        teamOne: { qty: 9, selectable: true, color: "#0bf", name: "Blue", deck: [], points: 0, img: require('@/assets/ninjas/blue.png'), members: [] },
        teamTwo: { qty: 9, selectable: true, color: "#f22", name: "Red", deck: [], points: 0, img: require('@/assets/ninjas/red.png'), members: [] },
        teamThree: { qty: 0, selectable: false, color: "#0f2", name: "Green", deck: [], points: 0, img: require('@/assets/ninjas/green.png'), members: [] },
        bystander: { qty: 6, selectable: true, color: "#f4d96a", name: "Bystander", deck: [], points: 0, img: require('@/assets/ninjas/yellow.png'), members: [] },
        assassin: { qty: 1, color: "#2c3e50", name: "Assassin", deck: [], points: 0, img: require('@/assets/ninjas/black.png') },
      },

      teamOfTurn: null,
      canPlay: false,
      roundStatus: '',
      winner: null,
      turnHint: "",
      turnGuesses: 1,
      usedGuesses: 0,
    },

    user: {
      isHost: false,
      isPlayer: false,
      isCaptain: false,
      teamCode: 'bystander',
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
    }
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
        else console.error("state."+options.object+" has no property " + key)
      }
    },
    updateTeamMembers(state, props:{teamCode:string,members:any}) {
      state.game.teams[props.teamCode].members = props.members;
    },
    setTeamQty(state, props:{team: string, qty:number}) {
      state.game.teams[props.team].qty = Number(props.qty);
      console.log(props.team+" qty is now: "+state.game.teams[props.team].qty)
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
      state.game.turnGuesses = 1;
      state.game.usedGuesses = 0;
    },
    newHint(state, props: {turnHint: string, turnGuesses: number}) {
      state.game.turnHint = props.turnHint;
      state.game.turnGuesses = props.turnGuesses;
    },
    useGuess(state){
      state.game.usedGuesses++;
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
  },



  actions: {
    updateGameState(context, props) {
      context.commit('updateStateObject', {object:'game',props})
    },
    updateRoomState(context, props) {
      context.commit('updateStateObject', {object:'room',props})
    },
    updateUserState(context, props) {
      context.commit('updateStateObject', {object:'user',props})
    },



    setupSocket(context:any, options:{rid:string, cb: any}) {
      let state = context.state;
      if (!state.socket) state.socket = socketio('');
      let socket = state.socket;
      console.log('joinRoom '+options.rid)

      socket.on('msg', (msg: string) => console.log(msg));
      socket.on('updateGamePieces', (props:any)=> {
        context.dispatch('updateGameState', props)
      })
      socket.on('updateRoom', (props:any)=> {
        console.log('updating room: ',props)
        context.dispatch('updateRoomState', props)
      })
      socket.on('updatePlayers', (props:any)=> {
        context.dispatch('updateRoomState', {players: props})
        for (let teamCode of Object.keys(context.state.game.teams)) {
          let members = this.state.room.players.filter( (p:any) => (p.teamCode == teamCode) || (teamCode == 'bystander' && !p.teamCode));
          context.commit('updateTeamMembers', { teamCode, members })
        }
      })


      
      socket.emit('joinRoom',options.rid, () => {
        state.room.id = options.rid;
        console.log("I'm connected to room: "+options.rid)
        options.cb();
      })

    },
    setupGameRoom(context, props: {id:string, mode: string}) {
      context.state.user.isHost = true;
      context.state.user.isPlayer = (props.mode != 'party');
      console.log('setupGameRoom '+props.id)

      context.dispatch('setupSocket', {rid: props.id, cb: () => {
        context.dispatch('updateRoomState', props)
        context.commit('goToView', 'room')
      }});

    },
    joinGameRoom(context, rid:string) {
      context.state.user.isHost = false;
      context.state.user.isPlayer = true;
      console.log('joinGameRoom '+rid)
      context.dispatch('setupSocket', {rid, cb: () => {
        context.dispatch('updateRoomState', rid)
        context.commit('goToView', 'room')
      }});
    },
    emitUserData(context) {
      context.state.socket.emit('updateUserData', context.state.user)
    },
    emitRoom(context) {
      context.state.socket.emit('updateRoom', context.state.room)
    },
    emitGamePieces(context, keys) {
      let props:any = {};
      for (let key in keys) {
        props[key] = context.state.game[key];
      }
      context.state.socket.emit('updateGamePieces', props)
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


    
    generateNewCards(context) {
      context.commit('clearBoard');
      let openCardIdxs = [];
      let usedWordIdxs = [];
      let numCards: number = context.state.game.layoutSqrFactor ** 2;
      let teams = Object.values(context.state.game.teams);
      console.log(numCards)
      console.log(context.state.game.teams)
      for (let i = 0; i < numCards; i++) openCardIdxs.push(i);

      do {
        let randIdx: number = openCardIdxs[Math.floor(Math.random()*openCardIdxs.length)];
        if (openCardIdxs.lastIndexOf(randIdx) < 0) continue;
        openCardIdxs = openCardIdxs.filter(idx => idx != randIdx);
        
        let wordIdx;
        do {
          wordIdx = Math.floor(Math.random()*context.state.wordSet.length);
        } while (usedWordIdxs.lastIndexOf(wordIdx) != -1);
        usedWordIdxs.push(wordIdx);

        let team: any;
        let teamCap: number = 0;
        let teamIdx = 0;
        do {
          team = teams[teamIdx];
          teamCap = Number(teamCap) + Number(team.qty);
          teamIdx++;
        } while (teamCap <= randIdx)

        let card = {word: context.state.wordSet[wordIdx], color: team.color, flipped: false, team };
        context.state.game.cards.push( card )
        team.deck.push(card)

      } while (openCardIdxs.length > 0);
    },

  },
  modules: {
  }
})
