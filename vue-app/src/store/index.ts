import Vue from 'vue'
import Vuex from 'vuex'
import socketio from 'socket.io-client'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
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
        teamOne: { qty: 9, color: "#0bf", name: "Blue", deck: [], points: 0, img: null },
        teamTwo: { qty: 9, color: "#f22", name: "Red", deck: [], points: 0, img: null },
        bystander: { qty: 6, color: "#f4d96a", name: "Bystander", deck: [], points: 0, img: null },
        assassin: { qty: 1, color: "#2c3e50", name: "Assassin", deck: [], points: 0, img: null },
      },

      teamOfTurn: null,
      canPlay: false,
      roundStatus: '',
      gameOver: false,
      winner: null,
      turnHint: "",
      turnGuesses: 1,
      usedGuesses: 0,
    },
    user: {
      socket: null,
      role: null,
      team: null,
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
    updateStatePortion(state, options:{portion:string, props:any}) {
      let stateKeys = Object.keys(state[options.portion]);
      if (!state[options.portion]) return console.log('State has no such member: '+options.portion)

      for (let key of Object.keys(options.props)) {
        if (stateKeys.lastIndexOf(key) >= 0) state[options.portion][key] = options.props[key];
        else console.error("state."+options.portion+" has no property " + key)
      }
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
      state.game.gameOver = false;
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
      context.commit('updateStatePortion', {portion:'game',props})
    },
    updateRoomState(context, props) {
      context.commit('updateStatePortion', {portion:'room',props})
    },
    updateUserState(context, props) {
      context.commit('updateStatePortion', {portion:'user',props})
    },



    setupSocket(context:any, options:{rid:string, cb: any}) {
      let state = context.state;
      if (!state.user.socket) state.user.socket = socketio('localhost:3000');
      let socket = state.user.socket;
      socket.on('connect', () => console.log('connected'))

      socket.emit('joinRoom',options.rid, () => {
        state.room.id = options.rid;
        console.log("I'm connected to room: "+options.rid)
        options.cb();
      })

      socket.on('msg', (msg: string) => console.log(msg));
      socket.on('updateGame', (props:any)=> {
        context.dispatch('updateGameState', props)
      })
      socket.on('updateRoom', (props:any)=> {
        context.dispatch('updateRoomState', props)
      })
      socket.on('updateUser', (props:any)=> {
        context.dispatch('updateUserState', props)
      })

    },
    setupGameRoom(context, props: {id:string, mode: string}) {
      context.dispatch('setupSocket', {rid: props.id, cb: () => {
        context.dispatch('updateRoomState', props)
        context.commit('goToView', 'room')
        console.log(context.state.view)
      }});

    },
    emitRoom(context) {
      context.state.user.socket.emit('updateRoom', context.state.room)
    },
    emitGame(context) {
      context.state.user.socket.emit('updateGame', context.state.game)
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

        let teams = Object.entries(context.state.game.teams);
        let team: any;
        let teamCap = 0;
        let teamIdx = 0;
        do {
          team = teams[teamIdx][1];
          teamCap += team.qty;
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
