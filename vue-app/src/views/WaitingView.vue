<template>
  <div id="setup" class="ui-view-wrapper">
    <div id="roomInfo">
      <div id="roomCode"><i class="material-icons">tap_and_play</i><span>Room Code:<span class="code-cap"> {{$store.getters.roomId}}</span></span></div>
    </div>
    


  <div id="teams">
    <div id="codeMasterDisplay" class="ui-block" v-if="state.user.isHost">
      <h3>Codemasters</h3>
      <div v-if="codeMasters.length>0">
        <div id="teamLists">
          <div class="teamList" v-for="teamData in codeMasters" :key="teamData.teamId">
            <div class="playerCard ui-shiny" v-if="teamData.captain">
              <img :src="state.game.teams[teamData.teamId].img">
              <div>{{teamData.captain.nickname}}</div>
            </div>
          </div>
        </div>
      </div>

      <div v-else>No codemasters have joined yet.</div>
      
    </div>


    <div id="teamSelection" class="ui-block" v-if="state.user.isPlayer">
      <div style="text-align:center">
        <h3>Waiting for the game to start...</h3>
        <div id="captainOptions" v-if="codeMasters.length<2 || state.user.isCaptain">
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

          <div v-if="state.user.isCaptain">
            <h3>Choose Your Team</h3>
            <div class="form-row" id="teamSelect">
              <div v-for="teamCode in teamCaptainOptions" :key="teamCode">
                <input type="radio" :id="teamCode" v-model="userTeamSelection" :value="teamCode" hidden>
                <label
                  :for="teamCode"
                  class="ui-pressable ui-shiny ui-raised"
                  :disabled="state.game.teams[teamCode].captain"
                  :style="{'background-image': `url(${state.game.teams[teamCode].img})`}" width="50" />
              </div>
            </div>
            <div style="font-weight:bold">
              <span v-if="userTeamSelection == null">Select a team...</span>
              <span v-else :style="{color: state.game.teams[userTeamSelection].color}">{{state.game.teams[userTeamSelection].name}} Team</span>
            </div>
          </div>        
        </div>

      </div>
    </div>
  </div>

    <div id="settings" v-if="state.user.isHost || state.mode == 'remote'">

      <div id="joinInstructions" class="ui-block">
        <h3>How To Join</h3>
        <div style="text-align:center">
          <p>
            Visit <b><a :href="appUrl" target="blank" style="color:#0bf">{{appUrl}}</a></b>
          </p>
          <div v-if="appUrlQr">
            <p>or scan this QR code:</p>
            <img :src='appUrlQr' id="joinQR" />
          </div>
          <p>Select <b>Join Room</b>, and enter this code:</p>
          <h3><b class="code-cap">{{$store.getters.roomId}}</b></h3>

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
              <input type="range" name="numCards" v-model="numCardsSqrt" min="3" max="6">
              <label style="width:1em;">{{numCardsSqrt**2}}</label>
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
      <button v-if="state.user.isHost" class="inline ui-pressable ui-shiny" style="background: transparent; color: inherit;" @click="closeRoom"><i class="material-icons">cancel</i>  Close Room</button>
      <button v-else class="inline ui-pressable ui-shiny" style="background: transparent; color: inherit;" @click="leaveRoom"><i class="material-icons">cancel</i>Leave Room</button>
      
      <button id="play" v-if="canStartGame" class="inline ui-pressable ui-shiny ui-raised" @click="startGame">PLAY!</button>
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
class GameHandler {
  constructor(vue) {
    this.vue = vue;
  }
  startGame(game) {
    this.vue.$store.dispatch("updateGameState",game)
  }
  setTeamCaptain(teams) {
    this.vue.$store.dispatch("updateGameState",{teams})
    this.vue.setTeamImages();
  }
}

export default {
  name: 'Room',

  data() {return({
    state: this.$store.state,
    gamePlayHandler: new GameHandler(this),
    appUrl: new URL(window.location.href).origin,
    numCardsSqrt: null,
    numTeams: 2,
    numAssassins: null,
    numTeamCards: null,
    numBystanders: null,
    appUrlQr: null,
    ninjasImgs: this.$store.state.ninjasImgs,
    captainIsSelected: false,
  })},

  async mounted() {
    this.captainIsSelected = this.state.user.isCaptain;
    this.setTeamImages();

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
        onNO: () => {context.$store.commit('goToStart')},
      })

    }

    this.numCardsSqrt = this.state.game.config.numCardsSqrt;
    this.numTeamCards = this.state.game.config.numTeamCards;
    this.numAssassins = this.state.game.config.numAssassins;
    this.calcNumBystanders();
  },

  watch: {
    userTeamSelection() {
      
    },
    numCardsSqrt() {
      this.calcNumBystanders()
      this.$store.dispatch('updateGameState', {config: this.config})
    },
    numTeamCards() {
      this.$store.commit('setTeamQty', {team: 'teamOne', qty: this.numTeamCards})
      this.$store.commit('setTeamQty', {team: 'teamTwo', qty: this.numTeamCards})
      this.calcNumBystanders()
    },
    numAssassins() {
      this.$store.commit('setTeamQty', {team: 'assassin', qty: this.numAssassins})
      this.calcNumBystanders()
    },
    maxCompTeamQty() {
      if (this.numTeamCards > this.maxCompTeamQty) this.numTeamCards = this.maxCompTeamQty;
    }
  },


  methods: {
    setTeamImages(){      
      this.state.game.teams.assassin.img = this.ninjasImgs.black;
      this.state.game.teams.teamOne.img = this.ninjasImgs.blue;
      this.state.game.teams.teamTwo.img = this.ninjasImgs.red;
      this.state.game.teams.bystander.img = this.ninjasImgs.yellow;
      this.$store.dispatch('emitGamePieces', ['teams']);
    },

    calcNumBystanders() {
      let numBystanders = this.numCardsSqrt**2 - this.numAssassins - this.numTeamCards*this.numTeams;
      this.$store.commit('setTeamQty', {team: 'bystander', qty: numBystanders})
      this.numBystanders = numBystanders;
      return numBystanders;
    },

    startGame() {
      if (this.canStartGame) this.$store.dispatch('invokeGameMethod',{method:"startGame",args:[this.config]})
    },

    leaveRoom() {
      this.$store.dispatch("resetToStart");
      this.$store.dispatch('emitUserData');
    },

    closeRoom() {
      this.$store.dispatch("closeRoom");
    }
  },

  computed: {
    teamCaptainOptions() {
      return Array.from(Object.values(this.state.game.teams)).reduce((teamIds,team)=>{
        if(team.isCompetitor) teamIds.push(team.id)
        return teamIds;
      }, []);
    },

    maxCompTeamQty() {
      let availableCards = ((this.numCardsSqrt**2) - this.numAssassins);
      return Math.floor(availableCards / this.numTeams);
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

    cardWidth() { return Math.floor(100/this.numCardsSqrt)+'%' },

    codeMasters() {
      console.log(this.state.game.teams)
      let teams = Array.from(Object.values(this.$store.state.game.teams)).reduce((teamsData,team)=>{
        if (team.isCompetitor && team.captain) teamsData.push({teamId:team.id,captain:team.captain});
        return teamsData;
      }, [])
      console.log(teams);
      return teams;
    },

    
    userCaptainStatus: {
      get() { return this.$store.state.user.isCaptain },
      set(value) {
        this.$store.dispatch('updateUserState',{ isCaptain:value })
        if (value == false) {
          this.$store.dispatch('invokeGameMethod',{ method:"setTeamCaptain",args:[this.state.user.teamCode,null] })
          this.$store.dispatch('updateUserState',{ teamCode:null })
          this.$store.dispatch('emitUserData')
        }
      }
    },

    userTeamSelection: {
      get() { return this.$store.state.user.teamCode },
      set(value) {
        if (this.state.user.isCaptain && this.state.user.teamCode) this.$store.dispatch('invokeGameMethod',{ method:"setTeamCaptain",args:[this.state.user.teamCode,null] })
        this.$store.dispatch('updateUserState',{ teamCode: value })
        this.$store.dispatch('emitUserData')
        this.$store.dispatch('invokeGameMethod',{ method:"setTeamCaptain",args:[this.state.user.teamCode,this.state.user] })
      }
    },

    canStartGame() {
      console.log("codemasters: ",this.codeMasters)
      return (
        this.codeMasters.length >= 2 &&
        (this.state.user.isHost || this.state.user.isCaptain)
      )
    },

    config() {
      return {
        numCardsSqrt: this.numCardsSqrt,
        numTeamCards: this.numTeamCards,
        numTeams: this.numTeams,
        numBystanders: this.numBystanders,
        numAssassins: this.numAssassins,
      }
    }
  }
}
</script>
















<style scoped>
#setup {
  padding: 1rem;
  max-width: 100vw;
  box-sizing: border-box;
}

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
  background: #e6e6e6;
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
  width: 4rem;
  height: 4rem;
  background-size: 110%;
  background-position: center;
  background-color: #bbb;
  margin: .5rem;
  transition: 200ms;
  opacity: .7;
}
#teamSelect.form-row:hover label {
}

#teamSelect.form-row input:checked + label,#teamSelect.form-row label:hover {
  opacity: 1;
  transform: scale(1.2)
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
