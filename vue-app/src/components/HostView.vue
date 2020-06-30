<template>
  <div class="hello" style="max-width: 60rem; margin: 0 auto;">
    <button @click="setNewGame" class="ui-raised ui-pressable ui-shiny">NEW GAME</button>
    <br><br><hr/><br/>
    <div id="scoreboard" v-if="this.teamOfTurn && !gameOver">
      <div id="activeTeam" :style="{color: this.teamOfTurn.color}">Go {{this.teamOfTurn.name}}!</div>
      <div id="activeHint">{{this.roundStatus =='guessing' ? `"${this.turnHint}"` : "Waiting for hint..."}}</div>
      <div id="guessCounter" v-if="roundStatus == 'guessing'">Attempts: {{Math.max(0, this.turnGuesses-this.turnGuessesUsed)}}<span class="extraHint"> + 1</span></div>
    </div>
    <div id="winnerMsg" v-if="this.winner && gameOver"><div :style="`text-align: center; margin: 0 auto; background-color: ${this.winner.color}; color: #fff; padding: 0 .4em; border-radius: 5px;`">{{this.winner.name}} Wins!</div></div>
    <div v-if="cards.length > 0" class="cards-table" :style="{'pointer-events': (roundStatus == 'guessing' || gameOver) ? 'all' : 'none'}">
      <div v-for="card in cards" :key="card.word" class="card-cell">
        <Card :freeRotate="gameOver" :card="card" @tryFlip="handleCardFlip" />
      </div>
    </div>

    <br>
    <button @click="giveHint" v-if="roundStatus == 'givingHint'" class="ui-raised ui-pressable ui-shiny" :style="{'background-color': teamOfTurn.color}">GIVE HINT</button>
    <button @click="advanceTurn" v-if="roundStatus == 'guessing'" class="ui-raised ui-pressable ui-shiny" :style="{'background-color': cardDist.bystander.color}">END TURN</button>

    <div id="modalWrapper" v-show="modalMsg">
      <div id="modalCloser" v-if="modalcbEX || !(modalcbOK || modalcbNO)" @click="modal_on('EX')">&times;</div>
      <div id="modalContainer" class="ui-raised">
        <div id="modalContent">
          <img id="modalImg" class="ui-raised" v-if="modalImg" :src="modalImg.path" :style="{width: modalImg.w, height: modalImg.h}" />
          <div id="modalMsg">{{modalMsg}}</div>
          <form id="turnHintForm" v-if="modalForm == 'turnHint'" @submit.prevent="modal_on('OK')">
            <div class="form-row"><input v-model="turnHint" type="text" placeholder="Hint" ref="hintInput" /><input type="number" min="1" v-model="turnGuesses" /></div>
            <input type="submit" hidden />
          </form>
          <div id="modalButtons">
            <button id="modalOK" v-if="modalcbOK" @click="modal_on('OK')" class="ui-raised ui-shiny ui-pressable">OK</button>
            <button id="modalNo" v-if="modalcbNO" @click="modal_on('NO')" class="ui-raised ui-shiny ui-pressable" style="background-color: #888">Cancel</button>
          </div>
        </div>
      </div>
    </div>

    <div id="animationOverlay">
      <div v-for="anim in anims" :key="anim.id" class="track" :class="anim.class" :style="{left: anim.left+'px', top: anim.top+'px', 'font-size': anim.spriteText ? anim.size : '0'}"><div class="sprite" :style="{'animation-duration': anim.duration+'ms'}">
        {{anim.spriteText}}
        <img class="spriteImg" v-if="anim.spriteImg" :src="anim.spriteImg" :style="{width: anim.size}" />
      </div></div>
    </div>
  </div>
</template>

<script>
import Card from './Card.vue'
import wordSet from '../assets/words/test_rel.json'

export default {
  name: 'HostView',
  props: ["msg"],
  components: {
    Card
  },

  data() { return {
    cards: [],
    layoutSqrFactor: 5,
    colors: ["yellow", "red", "#0bf"],
    cardDist: {
      teamOne: { qty: 9, color: "#0bf", name: "Blue", deck: [], points: 0, img: require("@/assets/ninjas/blue.png") },
      teamTwo: { qty: 9, color: "#f22", name: "Red", deck: [], points: 0, img: require("@/assets/ninjas/red.png") },
      bystander: { qty: 6, color: "#f4d96a", name: "Bystander", deck: [], points: 0, img: require("@/assets/ninjas/yellow.png") },
      assassin: { qty: 1, color: "#2c3e50", name: "Assassin", deck: [], points: 0, img: require("@/assets/ninjas/black.png") },
    },
    teamOfTurn: null,
    turnHint: "",
    turnGuesses: 0,
    turnGuessesUsed: 0,
    canPlay: false,
    roundStatus: '',
    gameOver: false,
    winner: null,

    ninjasImgs: {
      black: null,
      red: null,
      blue: null,
      yellow: null,
    },

    modalMsg: "",
    modalImg: null,
    modalForm: null,
    modalcbEX: null,
    modalcbOK: null,
    modalcbNO: null,
    modal_timeout: null,

    anims: [],
  }},

  created() {
    this.canPlay = this.deckIsGood();
    this.ninjasImgs.black = require('@/assets/ninjas/black.png');
    this.ninjasImgs.blue = require('@/assets/ninjas/blue.png');
    this.ninjasImgs.red = require('@/assets/ninjas/red.png');
    this.ninjasImgs.yellow = require('@/assets/ninjas/yellow.png');
  },

  computed: {
    numCards() { return this.layoutSqrFactor**2 }
  },

  methods: {
    deckIsGood() {
      let totCards = 0;
      for (let [, team] of Object.entries(this.cardDist)) {
        totCards += team.qty;
      }
      return totCards == this.numCards;
    },

    setNewGame() {
      this.teamOfTurn = null;
      this.winner = null;
      this.gameOver = false;
      this.canPlay = false;
      this.generateNewCards();

      this.modal_open({
        msg: "Are you ready to start?",
        onOK() { 
          this.modal_close();
          setTimeout( this.advanceTurn, 0 );
        },
      })
    },

    clearBoard() {
      this.cards = [];
      for (let [, team] of Object.entries(this.cardDist)) {
        team.deck = [];
        team.points = 0;
      }

    },

    generateNewCards() {
      this.clearBoard();
      let openCardIdxs = [];
      let usedWordIdxs = [];
      for (let i = 0; i < this.numCards; i++) openCardIdxs.push(i);

      do {
        let randIdx = openCardIdxs[Math.floor(Math.random()*openCardIdxs.length)];
        if (openCardIdxs.lastIndexOf(randIdx) < 0) continue;
        openCardIdxs = openCardIdxs.filter(idx => idx != randIdx);
        
        let wordIdx;
        do {
          wordIdx = Math.floor(Math.random()*wordSet.words.length);
        } while (usedWordIdxs.lastIndexOf(wordIdx) != -1);
        usedWordIdxs.push(wordIdx);

        let teams = Object.entries(this.cardDist);
        let team;
        let teamCap = 0;
        let teamIdx = 0;
        do {
          team = teams[teamIdx][1];
          teamCap += team.qty;
          teamIdx++;
        } while (teamCap <= randIdx)

        let card = {word: wordSet.words[wordIdx], color: team.color, flipped: false, team };
        this.cards.push( card )
        team.deck.push(this.cards[this.cards.length-1])

      } while (openCardIdxs.length > 0);

      this.printSecretKey();
    },

    printSecretKey() {
      console.group('cards')
      let cards = this.cards;
      for (let i = 0; i < cards.length; i+=5) {
        console.log(`%c ${cards[i].word[0]} %c ${cards[i+1].word[0]} %c ${cards[i+2].word[0]} %c ${cards[i+3].word[0]} %c ${cards[i+4].word[0]} `, `color: #777; background-color: ${cards[i].color}`, `color: #777; background-color: ${cards[i+1].color}`, `color: #777; background-color: ${cards[i+2].color}`, `color: #777; background-color: ${cards[i+3].color}`, `color: #777; background-color: ${cards[i+4].color}`);
      }
      console.groupEnd();
    },

    pausePlay(){
      this.roundStatus = "";
      this.canPlay = false;
    },

    handleCardFlip(e) {
      if(this.roundStatus == "guessing" && !this.gameOver) {
        console.log(e)
        e.card.team.points++;
        this.turnGuessesUsed++;
        e.card.flipped = true;

        if (e.card.team == this.teamOfTurn) this.animateGoodFlip(e.event);
        else if (e.card.team == this.cardDist.assassin) this.animateAssassin(e.event);
        else this.animateBadFlip(event)

        if (e.card.team.points == e.card.team.qty && e.card.team != this.cardDist.bystander) {
          this.pausePlay();
          this.roundStatus = "";
          this.winner = e.card.team;
          e.card.showTeamImg = true;
          setTimeout( () => {
            this.modal_open({
              msg: this.winner.name + " wins!",
              img: {path: e.card.team.img, w:'15em', h:'15em'},
              onEX() { this.gameOver = true; }
            }, 3000);
            this.canPlay = true;
          }
          , 500)
        }

        else {
          if (e.card.team != this.teamOfTurn || this.turnGuessesUsed > this.turnGuesses) {
            this.pausePlay();
            setTimeout(this.advanceTurn, 1000);
          }
        }
      }
    },

    advanceTurn() {
      this.turnHint = "";
      this.turnGuesses = 1;
      this.turnGuessesUsed = 0;

      if (this.teamOfTurn == this.cardDist.teamOne) this.teamOfTurn = this.cardDist.teamTwo;
      else this.teamOfTurn = this.cardDist.teamOne;
      
      this.roundStatus = "givingHint";
      
      this.modal_open({
        msg: this.teamOfTurn.name + "'s turn!",
        img: {path: this.teamOfTurn.img, w:'5em', h:'5em'},
      }, 3000)
    },

    giveHint() {
      this.modal_open({
        msg: "Write a hint for your team!",
        img: {path: this.teamOfTurn.img, w:'5em', h:'5em'},
        form: 'turnHint',
        onOK() { 
          this.canPlay = true;
          this.roundStatus = "guessing";

        },
        onEX: () => console.log('closed'),
        onNO: () => console.log('closed'),
        isValid() {
          if (!this.turnHint) this.modal_alert = "You must provide a hint!";
          return this.turnHint
        }
      })
      this.$nextTick(() => {
        this.focusInput();
      });
    },

    focusInput() {
      this.$refs.hintInput.focus();
    },


    modal_open(props, timeout = 0) {
      this.modalForm = props.form;
      this.modalcbEX = props.onEX;
      this.modalcbOK = props.onOK;
      this.modalcbNO = props.onNO;
      this.modalImg = props.img;
      this.modalMsg = props.msg;
      this.modal_isValid = props.isValid || function() { return true };

      if (timeout) this.modal_timeout = setTimeout( this.modal_close, timeout);
    },
    modal_on(action) {
      if (action == "OK" && !this.modal_isValid()) return alert(this.modal_alert);
      if (this["modalcb"+action]) {
        this["modalcb"+action]();
      }
      this.modal_close();
    },
    modal_close() {
      if (this.modalcbEX) this.modalcbEX();
      this.modalMsg = "";
      this.modalcbOK = this.modalcbNO = this.modalcbEX = this.modalImg = this.modalForm = null;
      window.clearTimeout(this.modal_timeout);
    },


    removeAnim(id){
      this.anims = this.anims.filter(a => a.id != id)
    },

    animateGoodFlip(event) {
      let duration = 2000;
      let id = `anim_${Date.now()}`
      this.anims.push({id, class: 'fade-up', left: event.x, top: event.y, duration, spriteText: '👍', size: '3rem'})
      let app = this;
      setTimeout( function() { app.removeAnim(id) }, duration)
    },

    animateBadFlip(event) {
      let duration = 2000;
      let id = `anim_${Date.now()}`
      this.anims.push({id, class: 'fade-down', left: event.x, top: event.y, duration, spriteText: '😥', size: '3rem'})
      let app = this;
      setTimeout( function() { app.removeAnim(id) }, duration)
    },
    animateAssassin(event) {
      let duration = 1500;
      let id = `anim_${Date.now()}`
      this.anims.push({id, class: 'fade-grow', left: event.x, top: event.y, duration, spriteImg: this.ninjasImgs.black, size: '3rem'})
      let app = this;
      setTimeout( function() { app.removeAnim(id) }, duration)
    }

  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}

button {
  border: none;
  padding: 1em 2em;
  font-weight: bold;
  color: white;
  background-color: #0bf;
  margin: .5em;
}

.cards-table {
  display: flex;
  flex-wrap: wrap;
}
.card-cell {
  box-sizing: border-box;
  min-width: 20%;
  max-width: 20%;
  padding: .4em;
}











div#modalWrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0003;
}

div#modalCloser {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
    user-select: none;
    text-align: right;
    padding: .5rem 1rem;
    box-sizing: border-box;
    font-size: 2.5em;
    color: #fff;
}

div#modalContainer {
    position: relative;
    width: 100%;
    background: #fff;
    padding: 2rem;
    display: flex;
    justify-content: center;
}

div#modalContent {
    max-width: 40rem;
}

div#modalMsg {
    text-align: center;
    font-weight: bold;
    font-size: 1.5em;
}
img#modalImg {
    max-width: 100%;
}




div#scoreboard {
    display: flex;
    justify-content: space-between;
    font-weight: bold;
    font-size: 1.75rem;
    padding: .25em;
}

span.extraHint {
    color: #888;
}

.form-row {
    margin: 1rem 0;
    display: flex;
}

form input {
    font-size: 1.25em;
    padding: .25em;
}

input[type="number"] {
    text-align: right;
    width: 3em;
}



div#scoreboard, div#winnerMsg {
    display: flex;
    justify-content: space-between;
    font-weight: bold;
    font-size: 1.75rem;
    padding: .4em;
    text-align: center;
    width: 100%;
    box-sizing: border-box;
}

span.extraHint {
    color: #aaa;
}




#animationOverlay {
  position: fixed;
  top: 0;
  left: 0;
}
#animationOverlay .track {
  pointer-events: none;
  user-select: none;
  position: fixed;
}
#animationOverlay .track.fade-up {
  transform: translate(-50%, -50%);
  height: 3em;
}
#animationOverlay .track.fade-down {
  transform: translate(-50%, 100%);
  height: 3em;
}
#animationOverlay .track.fade-grow {
  transform: translate(-50%, -50%);
}
#animationOverlay .track .sprite {
  position: absolute;
  left: 0;
  bottom: 0;
  transform: translate(-50%, -100%);
  text-align: center;
}
.fade-up .sprite {
  animation: fadeUp;
}
.fade-down .sprite {
  animation: fadeDown;
}
.fade-grow .sprite {
  animation: fadeGrow;
}

@keyframes fadeUp {
  from { opacity: 1; bottom: 0% }
  to { opacity: 0; bottom: 100% }
}
@keyframes fadeDown {
  from { opacity: 1; bottom: 100% }
  to { opacity: 0; bottom: 0% }
}
@keyframes fadeGrow {
  from { opacity: 1; transform: translate(-50%, 50%) scale(1) }
  to { opacity: 0; transform: translate(-50%, 50%) scale(5)  }
}
</style>
