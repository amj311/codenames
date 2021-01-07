<template>
  <div>
    <div id="topBar">
      <div id="scoreboard" v-if="gameState.teamOfTurn && gameState.roundStatus != 'gameOver'">
        <div id="activeTeam" :style="{color: gameState.teamOfTurn.color}">Go {{gameState.teamOfTurn.name}}!</div>
        
        <!-- FOR FULL REMOTE -->
        <!-- <div id="activeHint">{{gameState.roundStatus =='guessing' ? `"${gameState.turnHint}"` : "Waiting for hint..."}}</div> -->
        <!-- <div id="guessCounter" v-if="gameState.roundStatus == 'guessing'">Attempts: {{Math.max(0, gameState.turnGuesses-gameState.usedGuesses)}}<span class="extraHint"> + 1</span></div> -->
      </div>
      <div id="winnerMsg" v-else-if="gameState.roundStatus == 'gameOver'"><div class="ui-raised ui-shiny" :style="`text-align: center; margin: 0 auto; background-color: ${gameState.winner? gameState.winner.color : gameState.teams.bystander.color}; color: #fff; padding: 0 .4em; border-radius: 5px;`">{{gameState.winner? gameState.winner.name+" Wins!" : "DRAW!"}}</div></div>
      <div v-else>Ready!</div>
    </div>

    <div v-if="gameState.cards.length > 0" class="cards-table" :style="{'pointer-events': (gameState.roundStatus == 'guessing' || gameState.roundStatus == 'gameOver') ? 'all' : 'none'}">
      <div v-for="card in gameState.cards" :key="card.word" :id="'card_'+card.id" class="card-cell" :style="{width: cardWidth+'%', 'padding-top': cardWidth*.60+'%'}">
        <Card :freeRotate="gameState.roundStatus == 'gameOver'" :card="card" @tryFlip="initCardFlip" />
      </div>
    </div>

    <br>

    <div id="bottomBar">
      <div style="display: flex; justify-content: flex-start;">
      </div>
      <div>
        <!-- FOR FULL REMOTE -->
        <!-- <button @click="giveHint" v-if="gameState.roundStatus == 'givingHint'" class="ui-raised ui-pressable ui-shiny" :style="{'background-color': gameState.teamOfTurn.color}">GIVE HINT</button> -->
        <button @click="initAdvanceTurn" v-if="gameState.roundStatus == 'guessing'" class="ui-raised ui-pressable ui-shiny" :style="{'background-color': gameState.teams.bystander.color}">END TURN</button>
        <button @click="initExitGame" v-if="gameState.roundStatus == 'gameOver'" class="ui-raised ui-pressable ui-shiny">PLAY AGAIN</button>
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

class GameplayHandler {
  constructor(vue) {
    this.vue = vue;
  }
  advanceTurn(teamOfTurn) { this.vue.onAdvanceTurn(teamOfTurn) }
  revealCard(res) { this.vue.onRevealCard(res) }
  endGame(game) { this.vue.onEndGame(game) }
  exitGame(game) { this.vue.onExitGame(game) }
}

export default {
  name: 'Board',
  components: {
    Card
  },

  data() { return {
    state: this.$store.state,
    gameState: this.$store.state.game,
    ninjasImgs: this.$store.state.ninjasImgs,
    gameplayHandler: new GameplayHandler(this),

    anims: [],
  }},

  mounted() {
    console.log(this.gameplayHandler)
    this.$store.commit("setGameplayHandler",this.gameplayHandler)

    this.gameState.teams.assassin.img = this.ninjasImgs.black;
    this.gameState.teams.teamOne.img = this.ninjasImgs.blue;
    this.gameState.teams.teamTwo.img = this.ninjasImgs.red;
    this.gameState.teams.bystander.img = this.ninjasImgs.yellow;

    this.printSecretKey();
    this.onAdvanceTurn(this.gameState.teamOfTurn);
  },

  beforeDestroy() {
    this.$store.commit("setGameplayHandler",null)
  },

  computed: {
    cardWidth() { return Math.floor(100/this.gameState.layoutSqrFactor) }
  },

  methods: {
    endGame() {
      // this.resetBoard();
      // this.$store.commit('goToView','room');  
      this.$store.dispatch('updateGameState',{roundStatus: 'gameOver'});
      this.emitBoard();
    },
    initExitGame(){
      this.$store.dispatch('invokeGameMethod',{method:"exitGame",args:[]})
    },
    onExitGame(game){
      this.$store.dispatch('updateGameState',game)
    },
    promptEndGame() {
      this.$store.dispatch('openModal', {
        msg: "Are you sure you want to end this game?",
        onOK: () => this.endGame(),
        onNO: () => {return},
        onEX: () => {return},
      })
    },

    emitBoard() {
      console.log("emitting board")
      let props = ["teams","usedGuesses","turnGuesses","turnHint","winner","cards","teamOfTurn","canPlay","roundStatus"]
      this.$store.dispatch('emitGamePieces', props);
    },

    printSecretKey() {
      console.group('Cards')
      let sqrt = this.gameState.config.numCardsSqrt;
      for (let row = 0; row < sqrt; row++){
        let words = "";
        let styles = [];
        for (let col = 0; col < sqrt; col++) {
          let card = this.gameState.cards[row*sqrt + col]
          words+=`%c ${card.word[0]} `
          styles.push(`background-color: ${card.color}; color: #fff; padding: .1em; margin-right:2px; font-weight: bold; text-shadow: 1px 1px 1px #0005; border-radius:.2em`)
        }
        console.log(words,...styles)
      }
      console.groupEnd();
    },

    pausePlay(){
      this.$store.dispatch('updateGameState', {
        roundStatus: "",
        canPlay: false,
      })
    },

    initCardFlip(e) {
      if(this.state.user.isCaptain && this.gameState.state.canRevealCard) {
        this.$store.dispatch('invokeGameMethod',{method:"revealCard",args:[e.card.id]})
      }
    },

    onRevealCard(res) {
      console.log("revealed card!",res)

      if (res.wasTeamCard) this.animateGoodFlip(res.card.id);
      else if (res.card.teamId == this.gameState.teams.assassin.id) this.animateAssassin(res.card.id);
      else this.animateBadFlip(res.card.id)


      if (res.winner) {
        
        let context = this;
        setTimeout( () => {
          this.$store.dispatch('updateGameState', {canPlay: true});
          this.$store.dispatch('openModal', {
            msg: res.winner.name + " wins!",
            img: {path: this.gameState.teams[res.winner.id].img, w:'15em', h:'15em'},
            onEX() { context.endGame(); },
            timeout: 3000,
          });
        }
        , 1000)
      }

      else if (!res.wasTeamCard) {
        setTimeout(this.initAdvanceTurn, 1000);
      }
      
      this.$store.dispatch('updateGameState', {
        winningCard: res.card,
        winner: res.winner,
        cards: res.cards,
        teamOfTurn: res.teamOfTurn,
        state: res.state
      });

    },

    getCardTeam(card) {
      let team = Array.from(Object.values(this.gameState.teams)).find(t => t.name = card.team.name);
      return team;
    },
    increaseCardTeamPoint(card){
      let team = this.getCardTeam(card)
      team.points++;
      console.log("Awarding point:",team.name,team.points);
    },

    initAdvanceTurn() {
      this.$store.dispatch('invokeGameMethod',{method:"advanceTurn",args:[]})
    },

    onAdvanceTurn(teamOfTurn) {
      this.$store.commit('resetRound')

      console.log("Switching turn!",teamOfTurn)
      this.$store.dispatch('updateGameState', {teamOfTurn});

      // FOR PARTY
      this.$store.dispatch('updateGameState', {
        canPlay: true,
        roundStatus: "guessing",
      });

      // FOR FULL REMOTE
      // this.$store.dispatch('updateGameState', {roundStatus: 'givingHint'});
      
      this.$store.dispatch('openModal', {
        msg: teamOfTurn.name + "'s turn!",
        img: {path: this.gameState.teams[teamOfTurn.id].img, w:'5em', h:'5em'},
        timeout: 3000,
      })

      // this.emitBoard();
    },

    // giveHint() {
    //   let context = this;
    //   this.$store.dispatch('openModal', {
    //     msg: "Write a hint for your team!",
    //     img: {path: this.gameState.teamOfTurn.img, w:'5em', h:'5em'},
    //     form: 'turnHint',
    //     onOK() {
    //       context.$store.dispatch('updateGameState', {
    //         canPlay: true,
    //         roundStatus: "guessing",
    //       });
    //     },
    //     onEX: () => {return},
    //     onNO: () => {return},
    //     isValid: () => { return context.gameState.turnHint },
    //     alert: "You must provide a hint!",
    //   })
    // },

    removeAnim(id){
      this.anims = this.anims.filter(a => a.id != id)
    },

    animateGoodFlip(cardId) {
      let pos = this.getCardCenter(cardId);

      let duration = 2000;
      let id = `anim_${Date.now()}`
      this.anims.push({id, class: 'fade-up', left: pos.x, top: pos.y, duration, spriteText: '👍', size: '3rem'})
      let app = this;
      setTimeout( function() { app.removeAnim(id) }, duration)
    },

    animateBadFlip(cardId) {
      let pos = this.getCardCenter(cardId);

      let duration = 2000;
      let id = `anim_${Date.now()}`
      this.anims.push({id, class: 'fade-down', left: pos.x, top: pos.y, duration, spriteText: '😥', size: '3rem'})
      let app = this;
      setTimeout( function() { app.removeAnim(id) }, duration)
    },
    animateAssassin(cardId) {
      let pos = this.getCardCenter(cardId);

      let duration = 1500;
      let id = `anim_${Date.now()}`
      this.anims.push({id, class: 'fade-grow', left: pos.x, top: pos.y, duration, spriteImg: this.ninjasImgs.black, size: '3rem'})
      let app = this;
      setTimeout( function() { app.removeAnim(id) }, duration)
    },

    getCardCenter(cardId) {
      let rect = document.getElementById('card_'+cardId).getBoundingClientRect();
      let x = rect.x + rect.width/2;
      let y = rect.y + rect.height/2;
      return {x,y}
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
  align-items: center;
  justify-content: center;
}
.card-cell {
  flex-grow: 1;
  position: relative;
  padding-top: 10%;
}




div#topBar {
  font-weight: bold;
  font-size: 1.25rem;
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


@media screen and (max-width: 600px) {
  .card-cell {
    width: auto !important;
    max-width: 9em !important;
    min-width: 8em !important;
    height: 5em !important;
    padding-top: 0 !important;
    display: inline-block;
  }
}
</style>
