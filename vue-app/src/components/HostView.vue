<template>
  <div class="hello" style="max-width: 60rem; margin: 0 auto;">
    <div id="scoreboard" v-if="this.teamOfTurn && !gameOver">
      <div id="activeTeam" :style="{color: this.teamOfTurn.color}">Go {{this.teamOfTurn.name}}!</div>
      <div id="activeHint">{{this.roundStatus =='guessing' ? `"${state.game.turnHint}"` : "Waiting for hint..."}}</div>
      <div id="guessCounter" v-if="roundStatus == 'guessing'">Attempts: {{Math.max(0, state.game.turnGuesses-state.game.usedGuesses)}}<span class="extraHint"> + 1</span></div>
    </div>
    <div id="winnerMsg" v-if="this.winner && gameOver"><div :style="`text-align: center; margin: 0 auto; background-color: ${this.winner.color}; color: #fff; padding: 0 .4em; border-radius: 5px;`">{{this.winner.name}} Wins!</div></div>
    <div v-if="cards.length > 0" class="cards-table" :style="{'pointer-events': (roundStatus == 'guessing' || gameOver) ? 'all' : 'none'}">
      <div v-for="card in cards" :key="card.word" class="card-cell">
        <Card :freeRotate="gameOver" :card="card" @tryFlip="handleCardFlip" />
      </div>
    </div>

    <br>

    <div id="bottomBar">
      <div style="display: flex; justify-content: flex-start;">
        <button @click="setNewGame" v-if="gameOver" class="ui-raised ui-pressable ui-shiny">PLAY AGAIN</button>
      </div>
      <div>
        <button @click="giveHint" v-if="roundStatus == 'givingHint'" class="ui-raised ui-pressable ui-shiny" :style="{'background-color': teamOfTurn.color}">GIVE HINT</button>
        <button @click="advanceTurn" v-if="roundStatus == 'guessing'" class="ui-raised ui-pressable ui-shiny" :style="{'background-color': cardDist.bystander.color}">END TURN</button>
      </div>
      <div style="display: flex; justify-content: flex-end;">
        <button @click="promptEndGame" class="ui-raised ui-pressable ui-shiny" :style="{'background-color': '#888'}">END GAME</button>
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
    state: this.$store.state,
    cards: [],
    cardDist: {
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

    ninjasImgs: this.$store.state.ninjasImgs,

    anims: [],
  }},

  created() {
    this.canPlay = this.deckIsGood();
    this.cardDist.assassin.img = this.ninjasImgs.black;
    this.cardDist.teamOne.img = this.ninjasImgs.blue;
    this.cardDist.teamTwo.img = this.ninjasImgs.red;
    this.cardDist.bystander.img = this.ninjasImgs.yellow;

    this.setNewGame();
  },

  computed: {
    numCards() { return this.state.game.layoutSqrFactor**2 }
  },

  methods: {
    deckIsGood() {
      let totCards = 0;
      for (let [, team] of Object.entries(this.cardDist)) {
        totCards += team.qty;
      }
      return totCards == this.numCards;
    },

    resetBoard() {
      this.teamOfTurn = null;
      this.winner = null;
      this.gameOver = false;
      this.canPlay = false;
    },

    endGame() {
      this.resetBoard();
      this.$store.commit('endGame');     
    },
    promptEndGame() {
      this.$store.dispatch('openModal', {
        msg: "Would you like to end the game?",
        onOK: () => this.endGame(),
        onNO: () => {return},
        onEX: () => {return},
      })
    },

    setNewGame() {
      this.resetBoard();
      this.generateNewCards();
      let context = this;
      this.$store.dispatch('openModal', {
        msg: "Are you ready to start?",
        onOK() { 
          context.$store.dispatch('closeModal');
          setTimeout( context.advanceTurn, 0 );
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
        e.card.team.points++;
        // this.turnGuessesUsed++;
        e.card.flipped = true;

        if (e.card.team == this.teamOfTurn) this.animateGoodFlip(e.event);
        else if (e.card.team == this.cardDist.assassin) this.animateAssassin(e.event);
        else this.animateBadFlip(event)

        if (e.card.team.points == e.card.team.qty && e.card.team != this.cardDist.bystander) {
          this.pausePlay();
          this.roundStatus = "";
          this.winner = e.card.team;
          e.card.showTeamImg = true;
          let context = this;
          setTimeout( () => {
            this.$store.dispatch('openModal', {
              msg: this.winner.name + " wins!",
              img: {path: e.card.team.img, w:'15em', h:'15em'},
              onEX() { context.gameOver = true; },
              timeout: 3000,
            });
            this.canPlay = true;
          }
          , 500)
        }

        else {
          if (e.card.team != this.teamOfTurn || this.state.game.usedGuesses > this.state.game.turnGuesses) {
            this.pausePlay();
            setTimeout(this.advanceTurn, 1000);
          }
        }
      }
    },

    advanceTurn() {
      this.$store.commit('resetRound')

      if (this.teamOfTurn == this.cardDist.teamOne) this.teamOfTurn = this.cardDist.teamTwo;
      else this.teamOfTurn = this.cardDist.teamOne;
      
      this.roundStatus = "givingHint";
      
      this.$store.dispatch('openModal', {
        msg: this.teamOfTurn.name + "'s turn!",
        img: {path: this.teamOfTurn.img, w:'5em', h:'5em'},
        timeout: 3000,
      })
    },

    giveHint() {
      let context = this;
      this.$store.dispatch('openModal', {
        msg: "Write a hint for your team!",
        img: {path: this.teamOfTurn.img, w:'5em', h:'5em'},
        form: 'turnHint',
        onOK() { 
          context.canPlay = true;
          context.roundStatus = "guessing";
        },
        onEX: () => {return},
        onNO: () => {return},
        isValid: () => { return context.$store.state.game.turnHint },
        alert: "You must provide a hint!",
      })
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


div#bottomBar {
  display: flex;
}
div#bottomBar > div {
  display: flex;
  flex-grow: 1;
  width: 100%;
  justify-content: center;
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
