<template>
  <div id="setup" class="ui-view-wrapper">
    <div id="roomInfo">
      <div id="roomCode"><i class="material-icons">tap_and_play</i><span>Room Code:<span class="code-cap"> {{state.room.id}}</span></span></div>
      <span style="text-transform: capitalize">Mode: {{state.room.mode}}</span>
    </div>
    


  <div id="teams">
    <!-- <div id="teamsDisplay" class="ui-block" v-if="state.user.isHost">
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

    <div id="codeMasterDisplay" class="ui-block" v-if="state.user.isHost">
      <h3>Codemasters</h3>
      <div v-if="codeMasters.length>0">
        <div class="masterCard ui-shiny ui-raised" v-for="master in codeMasters" :key="master.nickname">
          <!-- <img :src="gameState.teams.bystander.img"> -->
          <div>{{master.nickname}}</div>
        </div>
      </div>

      <div v-else>No codemasters have joined yet.</div>
      
    </div>


    <div id="teamSelection" class="ui-block" v-if="state.user.isPlayer">
      <div style="text-align:center">
        <h3>Waiting for the game to start...</h3>
        <div>
          <label for="captainStatus" style="display:flex; justify-content:center; align-items:center; cursor:pointer;">
            <span>Play as Codemaster?</span>
            <input type="range"
              :style="`max-width:1.7em; transform:scale(1.5); filter: grayscale(${state.user.isCaptain? 0:1}); pointer-events:none;`"
              :value="state.user.isCaptain? 1:0" min="0" max="1" step="1"
            >
          </label>
          <input type="checkbox" id="captainStatus" v-model="userCaptainStatus" hidden>
        </div>
      </div>

      <!-- FOR FULL REMOTE -->
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


  </div>


    <div id="settings" v-if="state.user.isHost || state.mode == 'remote'">

      <div id="joinInstructions" class="ui-block">
        <h3>How To Join</h3>
        <div style="text-align:center">
          <p>
            Visit <b><a :href="appUrl" style="color:#0bf">{{appUrl}}</a></b>
          </p>
          <div v-if="appUrlQr">
            <p>or scan this QR code:</p>
            <img :src='appUrlQr' id="joinQR" />
          </div>
          <p>Select <b>Join Room</b>, and enter this code:</p>
          <h3><b class="code-cap">{{state.room.id}}</b></h3>

        </div>
      </div>

      <div id="boardSettings" class="ui-block">
        <h3>Game Settings</h3>
          <div id="boardPreview">
            <div v-for="card in previewCards" :key="card.idx" class="card-wrapper" :style="{width: cardWidth}">
              <div class="card ui-shiny ui-raised" :style="{backgroundColor: card.color}"></div>
            </div>
          </div>
          <form v-if="state.user.isHost">
            <div id="totalCards" class="form-row">
              <label>Cards</label>
              <input type="range" name="numCards" v-model="newGameSqrt" min="3" max="6">
              <label style="width:1em;">{{newGameSqrt**2}}</label>
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

    
    <div id="bottomBar" class="ui-block">
      <button v-if="state.user.isHost" class="inline ui-pressable ui-shiny" style="background: transparent; color: inherit;" @click="$store.commit('goToView', 'start')"><i class="material-icons">cancel</i>  Close Room</button>
      <button v-else class="inline ui-pressable ui-shiny" style="background: transparent; color: inherit;" @click="leaveRoom"><i class="material-icons">cancel</i>Leave Room</button>
      
      <button id="play" v-if="codeMasters.length>0 && (this.state.user.isHost || this.state.user.isCaptain)" class="inline ui-pressable ui-shiny ui-raised" @click="startGame">PLAY!</button>
      <div v-else style="text-align:right; font-size:.8em; font-weight:bold">Waiting for codemasters...</div>
    </div>

    <!-- Just for preloading the ninja images -->
    <div style="visibility:hidden; height: 0px; overflow:hidden">
      <img :src="state.game.teams.teamOne.img">
      <img :src="state.game.teams.teamTwo.img">
      <img :src="state.game.teams.bystander.img">
      <img :src="state.game.teams.assassin.img">
    </div>
  </div>
</template>

<script>
class RoomHandler {
  constructor(vue) {
    this.vue = vue;
  }
  startGame(game) {
    this.vue.$store.dispatch("updateGameState",game)
  }
}

export default {
  name: 'Room',

  data() {return({
    state: this.$store.state,
    gamePlayHandler: new RoomHandler(this),
    appUrl: new URL(window.location.href).origin,
    newGameSqrt: null,
    useTeam3: false,
    numAssassins: null,
    numTeamCards: null,
    numNeutralCards: null,
    appUrlQr: null,
    ninjasImgs: this.$store.state.ninjasImgs,
  })},

  async mounted() {
    
    this.state.game.teams.assassin.img = this.ninjasImgs.black;
    this.state.game.teams.teamOne.img = this.ninjasImgs.blue;
    this.state.game.teams.teamTwo.img = this.ninjasImgs.red;
    this.state.game.teams.bystander.img = this.ninjasImgs.yellow;


    fetch("https://api.qrapi.org/create?api_key=2bf6ed95d468a78cb2aef77a32036bcb&content="+encodeURIComponent(this.appUrl)).then(data=>{
      return data.json()
    })
    .then(data=>{
      this.appUrlQr = data.content.qr_code;
    })

    this.$store.commit("setGameplayHandler",this.gamePlayHandler)
    this.$store.dispatch('emitUserData');

    // FOR FULL REMOTE
    if (!this.state.user.isHost && !this.state.user.nickname) {
      let context = this;
      this.$store.dispatch('openModal', {
        msg: "Enter a nickname:",
        form: 'nickname',
        isValid: () => {return context.state.user.nickname},
        onOK: () => {context.$store.dispatch('emitUserData')},
        onNO: () => {context.$store.commit('goToView','start')},
      })

    }
    if (this.state.user.isHost) {
      this.$store.dispatch('emitRoom');
      this.$store.dispatch('emitGamePieces', ['roundStatus']);
    }

    //just for testing
    this.$store.dispatch('updateRoomState', {players: this.testPlayers})

    this.newGameSqrt = this.state.game.layoutSqrFactor;
    this.numTeamCards = this.state.game.teams.teamOne.qty;
    this.numAssassins = this.state.game.teams.assassin.qty;
    this.calcNumNeutralCards();
    console.log(this.newGameSqrt, this.numTeamCards, this.numNeutralCards)
  },

  watch: {
    userTeamSelection() {
      
    },
    newGameSqrt() {
      this.calcNumNeutralCards()
      this.$store.dispatch('updateGameState', {layoutSqrFactor: this.newGameSqrt})
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
      let numNeutral = this.newGameSqrt**2 - this.numAssassins - this.numTeamCards*numCompTeams;
      this.$store.commit('setTeamQty', {team: 'bystander', qty: numNeutral})
      this.numNeutralCards = numNeutral;
      return numNeutral;
    },

    startGame() {
      let config = {
        numCardsSqrt: this.newGameSqrt,
        numTeams: this.useTeam3 ? 3 : 2,
        numTeamCards: this.numTeamCards,
        numAssassins: this.numAssassins,
        numBystanders: this.numNeutralCards,
      }
      this.$store.dispatch('invokeGameMethod',{method:"startGame",args:[config]})
    },

    leaveRoom() {
      this.$store.dispatch("resetToStart");
      this.$store.dispatch('emitUserData');
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
      let availableCards = ((this.newGameSqrt**2) - this.numAssassins);
      // let maxCompTeamQty = 0;
      let numCompTeams = this.useTeam3 ? 3 : 2;
      // while (maxCompTeamQty * numCompTeams <= availableCards-numCompTeams) {
      //   maxCompTeamQty++
      // }
      // return maxCompTeamQty;
      return Math.floor(availableCards / numCompTeams);
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

    cardWidth() { return Math.floor(100/this.newGameSqrt)+'%' },

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
    },

    userCaptainStatus: {
      get() { return this.$store.state.user.isCaptain },
      set(value) {
        this.$store.dispatch('updateUserState',{isCaptain: value })
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
.code-cap{
  text-transform: uppercase;
}
.ui-block {
  text-align: left;
}

#settings {
  display: flex;
  width: 100%;
  flex-wrap: wrap;
}

#settings > div.ui-block {
  flex-grow: 1;
  width: calc(50% - .5em);
}

img#joinQR {
  width: 8em;
}

#teams {
  width: 100%;
}

.masterCard {
  background: #f1f1f1;
  display: inline-block;
  font-weight: bold;
  padding: .5em;
  border-radius: .5em;
  margin-right: 0.5em;
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

#boardPreview {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  width: 90%;
  max-width: 20rem;
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
  
  #settings {
    flex-direction: column;
  }
  #settings > div.ui-block {
    width: 100%;
  }

}
</style>
