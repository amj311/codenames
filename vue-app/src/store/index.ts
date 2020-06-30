import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    view: 'start',
    game: {
      layoutSqrFactor: 5,
      
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
  },
  modules: {
  }
})
