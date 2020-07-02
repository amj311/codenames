<template>
  <div id="setup" class="ui-view-wrapper">
    
    <h1 id="roomCode"><i class="material-icons">phonelink_ring</i><span>Room Code:<span style="text-transform: uppercase"> {{state.room.id}}</span></span></h1>
    
    <div id="settings">
      <div id="teams" class="ui-block">
        <h3>Players</h3>
        <div class="teamList">
          <div class="playerCard" v-for="player in teamNeutral" :key="player.name">
            <img :src="state.ninjasImgs.yellow">
            <div>{{player.name}}</div>
          </div>
        </div>
        <div class="teamList">
          <div class="playerCard" v-for="player in teamOne" :key="player.name">
            <img :src="state.ninjasImgs.blue">
            <div>{{player.name}}</div>
          </div>
        </div>
        <div class="teamList">
          <div class="playerCard" v-for="player in teamTwo" :key="player.name">
            <img :src="state.ninjasImgs.red">
            <div>{{player.name}}</div>
          </div>
        </div>
      </div>

      <div id="boardSettings" class="ui-block">
        <h3>Options</h3>
          <div id="boardPreview">
            <div v-for="card in previewCards" :key="card.idx" class="card-wrapper" :style="{width: cardWidth}">
              <div class="card ui-shiny ui-raised" :style="{backgroundColor: card.color}"></div>
            </div>
          </div>
          <div id="totalCards" class="form-row">
            <label>Cards</label>
            <input type="range" name="numCards" v-model="newGameSqrFactor" min="3" max="6">
            <label style="width:1em;">{{newGameSqrFactor**2}}</label>
          </div>
          <div id="teamCards" class="form-row">
            <div>
              <label>Team Cards</label>
              <input type="number" v-model="numTeamCards" min="1" :max="maxCompTeamQty">
            </div>
            <div> 
              <label>Assassins</label>
              <input type="number" v-model="numAssassins" min="0" :max="3">
            </div>
          </div>
      </div>
    </div>
    <div id="bottomBar" class="ui-block">
      <button class="inline ui-pressable ui-shiny" style="background: transparent; color: inherit;" @click="$store.commit('goToView', 'start')">Close Room</button>
      <button id="play" class="inline ui-pressable ui-shiny ui-raised" @click="$store.commit('goToView', 'play')">PLAY!</button>
    </div>
  </div>
</template>

<script>

export default {
  name: 'Room',
  components: {

  },
  data() {return({
    state: this.$store.state,
    newGameSqrFactor: null,
    useTeam3: false,
    numAssassins: null,
    numTeamCards: null,
    numNeutralCards: null,

    testPlayers: [
      {name:"Jack", teamCode: "one", isCaptain: true},
      {name:"Jill", teamCode: 'two', isCaptain: true},
      {name:"Jon"},
      {name:"Jane"},
      {name:"Arthur", teamCode: "one"},
      {name:"Gennavie", teamCode: 'two'},
      {name:"Fernando"},
      {name:"Fernando"},
      {name:"Felipe"}
    ],
  })},

  created() {
    //just for testing
    this.$store.dispatch('updateRoomState', {players: this.testPlayers})
    this.newGameSqrFactor = this.state.game.layoutSqrFactor;
    this.numTeamCards = this.state.game.teams.teamOne.qty;
    this.numAssassins = this.state.game.teams.assassin.qty;
    this.calcNumNeutralCards();
  },


  watch: {
    newGameSqrFactor() {
      this.calcNumNeutralCards()
      this.$store.dispatch('updateGameState', {layoutSqrFactor: this.newGameSqrFactor})
    },
    numTeamCards() {
      this.$store.commit('setTeamQty', {team: 'teamOne', qty: this.numTeamCards})
      this.$store.commit('setTeamQty', {team: 'teamTwo', qty: this.numTeamCards})
      if (this.useTeam3) this.$store.commit('setTeamQty', {team: 'teamThree', qty: this.numTeamCards})
      this.calcNumNeutralCards()
    },
    numAssassins() {
      this.$store.commit('setTeamQty', {team: 'assassin', qty: this.numAssassins})
      this.calcNumNeutralCards()
    },
    maxCompTeamQty() {
      if (this.numTeamCards > this.maxCompTeamQty) this.numTeamCards = this.maxCompTeamQty;
    }
  },


  methods: {
    calcNumNeutralCards() {
      let numCompTeams = this.useTeam3 ? 3 : 2;
      let numNeutral = this.newGameSqrFactor**2 - this.numAssassins - this.numTeamCards*numCompTeams;
      this.$store.commit('setTeamQty', {team: 'bystander', qty: numNeutral})
      this.numNeutralCards = numNeutral;
      return numNeutral;
    }
  },

  computed: {
    teamOne() { return this.state.room.players.filter(p => p.teamCode == "one")},
    teamTwo() { return this.state.room.players.filter(p => p.teamCode == "two")},
    teamThree() { return this.state.room.players.filter(p => p.teamCode == "three")},
    teamNeutral() { return this.state.room.players.filter(p => !p.teamCode)},

    maxCompTeamQty() {
      let availableCards = ((this.newGameSqrFactor**2) - this.numAssassins);
      let maxCompTeamQty = 0;
      let numCompTeams = this.useTeam3 ? 3 : 2;
      while (maxCompTeamQty * numCompTeams <= availableCards-numCompTeams) {
        maxCompTeamQty++
      }
      return maxCompTeamQty;
    },

    previewCards() {
      let cards = [];
      let i = 0;
      for (let team of Object.values(this.state.game.teams)) {
        for (let j = 0; j < team.qty; j++) {
          cards.push({color: team.color, idx: i})
          i++;
        }
      }
      return cards;
    },

    cardWidth() { return Math.floor(100/this.newGameSqrFactor)+'%' }
  }
}
</script>

<style scoped>
#roomCode {
  display: flex;
  align-items: center;  
  font-weight: bold;
  flex-wrap: wrap;
  justify-content: space-around;
}
#roomCode i {
  font-size: inherit;

}
#settings {
  overflow-y: auto;
  display: flex;
  width: 100%;
  text-align: left;
  padding: 5px;
  flex-wrap: wrap;
}

#settings > div.ui-block {
    flex-grow: 1;
    width: calc(50% - .5em);
}

#teams {
  min-width: 16em;
}
.playerCard {
  display: inline-block;
  text-align: center;
  padding: .5em;
  /* outline: 1px solid; */
  width: min-content;
  /* min-width: 3em; */
}
.playerCard img {
  width: 3em;
}

#boardSettings {
  flex-grow: 3;
  width: 60%;
}

#boardPreview {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  max-width: 15rem;
  margin: 0 auto;
}

.card-wrapper {
  padding: .15em;
  box-sizing: border-box;
}
.card {
  padding-top: 66%;
}
.card::before {
  content: '';
  display: block;
}

#bottomBar {
  font-size: 1.25em;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

button#play {
  animation: pulse 500ms infinite alternate;
}

@media screen and (max-width: 600px) {
  
  /* #settings {
    flex-direction: column;
  }
  #settings > div.ui-block {
    width: 100%;
  } */

}
</style>
