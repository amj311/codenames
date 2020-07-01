import Vue from 'vue'
import Vuex from 'vuex'
import socketio from 'socket.io-client'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    view: 'start',
    wordSet: [],
    board: {
      layoutSqrFactor: 5,
      cards: [],
    },
    game: {
      mode: null,

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
      room: null,
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
    newGame(state: any) {
      state.view = "play";
    },
    endGame(state: any) {
      state.view = "start";
    },
    updateGameState(state, props) {
      let stateKeys = Object.keys(state.game);
      for (let key of Object.keys(props)) {
        if (stateKeys.lastIndexOf(key) >= 0) state.game[key] = props[key];
        else console.error("Game state has no property " + key)
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
      state.board.cards = [];
      
      let team: any;
      for (team of Object.values(state.game.teams)) {
        team.deck = [];
        team.points = 0;
      }
    },




    setupSocket(context, room:string) {
      let socket = context.user.socket;
      context.user.room = room;
      socket = socketio('localhost:3000');
      socket.on('msg', () => {
        console.log('I\'m connected!');
        socket.emit('joinRoom',room)
      })
    }
  },



  actions: {
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
      let numCards: number = context.state.board.layoutSqrFactor ** 2;
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
        context.state.board.cards.push( card )
        team.deck.push(card)

      } while (openCardIdxs.length > 0);
    },

  },
  modules: {
  }
})
