<template>
  <div>
    <div id="topBar">
      <div id="scoreboard" v-if="gameState.teamOfTurn && gameState.roundStatus != 'gameOver'">
        <div id="activeTeam" :style="{color: gameState.teamOfTurn.color}">Go {{gameState.teamOfTurn.name}}!</div>
        <div id="activeHint">{{gameState.roundStatus =='guessing' ? `"${gameState.turnHint}"` : "Waiting for hint..."}}</div>
        <div id="guessCounter" v-if="gameState.roundStatus == 'guessing'">Attempts: {{Math.max(0, gameState.turnGuesses-gameState.usedGuesses)}}<span class="extraHint"> + 1</span></div>
      </div>
      <div id="winnerMsg" v-else-if="gameState.roundStatus == 'gameOver'"><div class="ui-raised ui-shiny" :style="`text-align: center; margin: 0 auto; background-color: ${gameState.winner? gameState.winner.color : gameState.teams.bystander.color}; color: #fff; padding: 0 .4em; border-radius: 5px;`">{{gameState.winner? gameState.winner.name+" Wins!" : "DRAW!"}}</div></div>
      <div v-else>Ready!</div>
    </div>

    <div v-if="gameState.cards.length > 0" class="cards-table" :style="{'pointer-events': (gameState.roundStatus == 'guessing' || gameState.roundStatus == 'gameOver') ? 'all' : 'none'}">
      <div v-for="card in gameState.cards" :key="card.word" class="card-cell" :style="{width: cardWidth}">
        <Card :freeRotate="gameState.roundStatus == 'gameOver'" :card="card" @tryFlip="handleCardFlip" />
      </div>
    </div>

    <br>

    <div id="bottomBar">
      <div style="display: flex; justify-content: flex-start;">
      </div>
      <div>
        <button @click="giveHint" v-if="gameState.roundStatus == 'givingHint'" class="ui-raised ui-pressable ui-shiny" :style="{'background-color': gameState.teamOfTurn.color}">GIVE HINT</button>
        <button @click="advanceTurn" v-if="gameState.roundStatus == 'guessing'" class="ui-raised ui-pressable ui-shiny" :style="{'background-color': gameState.teams.bystander.color}">END TURN</button>
        <button @click="$store.commit('goToView','room')" v-if="gameState.roundStatus == 'gameOver'" class="ui-raised ui-pressable ui-shiny">PLAY AGAIN</button>
      </div>
      <div style="display: flex; justify-content: flex-end;">
        <button @click="promptEndGame" v-if="gameState.roundStatus != 'gameOver'" class="ui-raised ui-pressable ui-shiny" :style="{'background-color': '#888'}">END GAME</button>
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

export default {
  name: 'Board',
  props: ["msg"],
  components: {
    Card
  },

  data() { return {
    state: this.$store.state,
    gameState: this.$store.state.game,
    ninjasImgs: this.$store.state.ninjasImgs,

    anims: [],
  }},

  created() {
    this.canPlay = this.deckIsGood();
    this.gameState.teams.assassin.img = this.ninjasImgs.black;
    this.gameState.teams.teamOne.img = this.ninjasImgs.blue;
    this.gameState.teams.teamTwo.img = this.ninjasImgs.red;
    this.gameState.teams.bystander.img = this.ninjasImgs.yellow;

    console.log('Setting new Game')

    this.setNewGame();
  },

  computed: {
    cardWidth() { return Math.floor(100/this.gameState.layoutSqrFactor)+'%' }
  },

  methods: {
    deckIsGood() {
      let totCards = 0;
      for (let team of Object.values(this.gameState.teams)) {
        totCards += team.qty;
      }
      return totCards == this.numCards;
    },

    resetBoard() {
      this.$store.commit('clearBoard');
      this.$store.commit("resetGame")
    },

    endGame() {
      // this.resetBoard();
      // this.$store.commit('goToView','room');  
      this.$store.dispatch('updateGameState',{roundStatus: 'gameOver'});  
    },
    promptEndGame() {
      this.$store.dispatch('openModal', {
        msg: "Are you sure you want to end this game?",
        onOK: () => this.endGame(),
        onNO: () => {return},
        onEX: () => {return},
      })
    },

    setNewGame() {
      this.resetBoard();
      this.generateNewCards();
      let context = this;
      this.$nextTick( ()=> this.$store.dispatch('openModal', {
        msg: "Are you ready to start?",
        onOK() { 
          context.$store.dispatch('closeModal');
          setTimeout( context.advanceTurn, 0 );
        },
      }))
    },

    generateNewCards() {
      this.$store.dispatch('generateNewCards');

      // this.printSecretKey();
    },

    printSecretKey() {
      console.group('cards')
      let cards = this.state.game.cards;
      for (let i = 0; i < cards.length; i+=this.gameState.layoutSqrFactor) {
        console.log(`%c ${cards[i].word[0]} %c ${cards[i+1].word[0]} %c ${cards[i+2].word[0]} %c ${cards[i+3].word[0]} %c ${cards[i+4].word[0]} `, `color: #777; background-color: ${cards[i].color}`, `color: #777; background-color: ${cards[i+1].color}`, `color: #777; background-color: ${cards[i+2].color}`, `color: #777; background-color: ${cards[i+3].color}`, `color: #777; background-color: ${cards[i+4].color}`);
      }
      console.groupEnd();
    },

    pausePlay(){
      this.$store.dispatch('updateGameState', {
        roundStatus: "",
        canPlay: false,
      })
    },

    handleCardFlip(e) {
      if(this.gameState.roundStatus == "guessing" && this.gameState.roundStatus != 'gameOver') {
        e.card.team.points++;
        this.$store.commit('useGuess');
        e.card.flipped = true;

        if (e.card.team == this.gameState.teamOfTurn) this.animateGoodFlip(e.event);
        else if (e.card.team == this.gameState.teams.assassin) this.animateAssassin(e.event);
        else this.animateBadFlip(event)

        if (
          (e.card.team == this.gameState.teams.assassin || e.card.team.points == e.card.team.qty) &&
          e.card.team != this.gameState.teams.bystander) {
          this.pausePlay();
          
          this.$store.dispatch('updateGameState', {
            roundStatus: "",
            winner: e.card.team,
          });
          
          e.card.showTeamImg = true;
          let context = this;
          setTimeout( () => {
            this.$store.dispatch('updateGameState', {canPlay: true});
            this.$store.dispatch('openModal', {
              msg: context.gameState.winner.name + " wins!",
              img: {path: e.card.team.img, w:'15em', h:'15em'},
              onEX() { context.endGame(); },
              timeout: 3000,
            });
          }
          , 1000)
        }

        else {
          if (e.card.team != this.gameState.teamOfTurn || this.gameState.usedGuesses > this.gameState.turnGuesses) {
            this.pausePlay();
            setTimeout(this.advanceTurn, 1000);
          }
        }
      }
    },

    advanceTurn() {
      this.$store.commit('resetRound')

      if (this.gameState.teamOfTurn == this.gameState.teams.teamOne) this.$store.dispatch('updateGameState', {teamOfTurn: this.gameState.teams.teamTwo});
      else this.$store.dispatch('updateGameState', {teamOfTurn: this.gameState.teams.teamOne});
      
      this.$store.dispatch('updateGameState', {roundStatus: 'givingHint'});
      
      this.$store.dispatch('openModal', {
        msg: this.gameState.teamOfTurn.name + "'s turn!",
        img: {path: this.gameState.teamOfTurn.img, w:'5em', h:'5em'},
        timeout: 3000,
      })
    },

    giveHint() {
      let context = this;
      this.$store.dispatch('openModal', {
        msg: "Write a hint for your team!",
        img: {path: this.gameState.teamOfTurn.img, w:'5em', h:'5em'},
        form: 'turnHint',
        onOK() {
          context.$store.dispatch('updateGameState', {
            canPlay: true,
            roundStatus: "guessing",
          });
        },
        onEX: () => {return},
        onNO: () => {return},
        isValid: () => { return context.gameState.turnHint },
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
  flex-grow: 1;
  position: relative;
  padding-top: 10%;
}




div#topBar {
  font-weight: bold;
  font-size: 1.75rem;
  padding: .4em;
  text-align: center;
  width: 100%;
  box-sizing: border-box;
}

div#scoreboard, div#winnerMsg {
  display: flex;
  justify-content: space-between;
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
