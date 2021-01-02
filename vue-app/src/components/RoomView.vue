<template>
  <div id="setup" class="ui-view-wrapper">
    <div id="roomInfo">
      <div id="roomCode"><i class="material-icons">tap_and_play</i><span>Room Code:<span style="text-transform: uppercase"> {{state.room.id}}</span></span></div>
      <span style="text-transform: capitalize">Mode: {{state.room.mode}}</span>
    </div>
    
    <div id="settings" v-if="state.user.isHost || state.mode == 'remote'">
      <!-- <div id="teams" class="ui-block" v-if="state.user.isHost">
        <h3>Players</h3>
        <div id="teamLists">
          <div class="teamList" v-for="team in state.game.teams" :key="team.name">
            <div v-if="team.selectable">
              <div class="playerCard ui-shiny" v-for="player in team.members" :key="player.nickname">
                <img :src="team.img">
                <div>{{player.nickname}}</div>
              </div>
            </div>
          </div>
        </div>
      </div> -->

      <div id="boardSettings" class="ui-block">
        <h3>Board Preview</h3>
          <div id="boardPreview">
            <div v-for="card in previewCards" :key="card.idx" class="card-wrapper" :style="{width: cardWidth}">
              <div class="card ui-shiny ui-raised" :style="{backgroundColor: card.color}"></div>
            </div>
          </div>
          <form v-if="state.user.isHost">
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
          </form>
      </div>
    </div>

    
    <div id="teamSelection" class="ui-block" v-if="state.user.isPlayer">
      <h3>Wait for the game to start...</h3>

      <!-- <h3>Choose Your Team</h3>
      <div class="form-row" id="teamSelect">
        <div v-for="teamCode in playableTeamCodes" :key="teamCode">
          <input type="radio" :id="teamCode" v-model="userTeamSelection" :value="teamCode" hidden>
          <label
            :for="teamCode"
            class="ui-shiny ui-raised"
            :class="{'ui-pressable': userTeamSelection != teamCode}"
            :style="{'background-image': `url(${state.game.teams[teamCode].img})`}" width="50" />
        </div>
      </div>
      <h3>
        <span v-if="userTeamSelection == 'bystander'">Sitting this one out...</span>
        <span v-else :style="{color: state.game.teams[userTeamSelection].color}">{{state.game.teams[userTeamSelection].name}} Team</span>
      </h3>
      <div class="teamList">
        <div class="playerCard ui-shiny" style="font-weight:bold;">
          <img :src="state.game.teams[userTeamSelection].img" class="ui-raised">
          <div>{{state.user.nickname}}</div>
        </div>
        <div class="playerCard ui-shiny"
          v-for="member in state.game.teams[userTeamSelection].members"
          :key="member.nickname"
          :style="{display: member.nickname == state.user.nickname ? 'none':''}"
        >
          <img :src="state.game.teams[userTeamSelection].img">
          <div>{{member.nickname}}</div>
        </div>
      </div> -->

    </div>

    <div id="bottomBar" class="ui-block" v-if="state.user.isHost">
      <button class="inline ui-pressable ui-shiny" style="background: transparent; color: inherit;" @click="$store.commit('goToView', 'start')"><i class="material-icons">cancel</i>  Close Room</button>
      <button id="play" v-if="codeMasters.length>0" class="inline ui-pressable ui-shiny ui-raised" @click="startGame">PLAY!</button>
      <div v-else>Waiting for codemasters...</div>
    </div>
    <div id="bottomBar" class="ui-block" v-else>
      <button class="inline ui-pressable ui-shiny" style="background: transparent; color: inherit;" @click="$store.commit('goToView', 'start')"><i class="material-icons">cancel</i>Leave Room</button>
    </div>
  </div>
</template>

<script>

export default {
  name: 'Room',

  data() {return({
    state: this.$store.state,
    newGameSqrFactor: null,
    useTeam3: false,
    numAssassins: null,
    numTeamCards: null,
    numNeutralCards: null,
  })},

  created() {
    console.log(this.state.room.players)
    this.$store.dispatch('emitUserData');

    // FOR FULL REMOTE
    // if (!this.state.user.isHost || this.state.room.mode != 'party') {
    //   let context = this;
    //   this.$store.dispatch('openModal', {
    //     msg: "Enter a nickname:",
    //     form: 'nickname',
    //     isValid: () => {return context.state.user.nickname},
    //     onOK: () => {context.$store.dispatch('emitUserData')},
    //     onNO: () => {context.$store.commit('goToView','start')},
    //   })
    // }
    if (this.state.user.isHost) {
      this.$store.dispatch('emitRoom');
      this.$store.dispatch('emitGamePieces', ['roundStatus']);
    }

    //just for testing
    this.$store.dispatch('updateRoomState', {players: this.testPlayers})

    this.newGameSqrFactor = this.state.game.layoutSqrFactor;
    this.numTeamCards = this.state.game.teams.teamOne.qty;
    this.numAssassins = this.state.game.teams.assassin.qty;
    this.calcNumNeutralCards();
    console.log(this.newGameSqrFactor, this.numTeamCards, this.numNeutralCards)
  },


  watch: {
    userTeamSelection() {
      
    },
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
    },

    startGame() {
      this.$store.dispatch('updateGameState',{roundStatus: ''})
    }
  },

  computed: {
    playableTeamCodes() {
      let teams = [];
      for (let [teamCode, team] of Object.entries(this.state.game.teams)) {
        if (team.selectable) teams.push(teamCode)
      }
      return teams;
    },

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

    cardWidth() { return Math.floor(100/this.newGameSqrFactor)+'%' },

    codeMasters() {
      if (!this.$store.state.room.players) return [];
      return this.$store.state.room.players.filter(p=>p.isCaptain);
    },
    
    userTeamSelection: {
      get() { return this.$store.state.user.teamCode },
      set(value) {
        this.$store.dispatch('updateUserState',{teamCode: value })
        this.$store.dispatch('emitUserData')
      }
    }
  }
}
</script>
















<style scoped>
#roomInfo {
  margin: .5em 0;
}

#roomCode {
  font-size: 1.7em;
  display: flex;
  align-items: center;  
  font-weight: bold;
  flex-wrap: wrap;
  justify-content: space-around;
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

div#teamLists {
    display: flex;
    flex-wrap: wrap;
}

.playerCard {
  font-size: .8em;
  display: inline-block;
  text-align: center;
  padding: .5em;
  width: min-content;
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
  justify-content: space-between;
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




#teamSelect.form-row {
  justify-content: center;
  flex-wrap: wrap;
}
#teamSelect.form-row label {
  display: block;
  border-radius: 50%;
  width: 5rem;
  height: 5rem;
  background-size: 110%;
  background-position: center;
  background-color: #bbb;
  margin: .5rem;
  transition: 200ms;
}
#teamSelect.form-row:hover label {
  opacity: .8;
}

#teamSelect.form-row input:checked + label,#teamSelect.form-row label:hover {
  opacity: 1;
  transform: scale(1.1)
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
