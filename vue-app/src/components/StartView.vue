<template>
<div id="slideWrapper">
  <div id="slideContainer" :class="{slid: showMenu}">
    <div id="main">
      <button @click="openMenu('new')" class="ui-raised ui-pressable ui-shiny">New Game</button>
      <button @click="openMenu('join')" class="ui-raised ui-pressable ui-shiny">Join a Game</button>
    </div>
    <div id="menus">
      <div id="menuWrpper" class="ui-block">
        <div id="topBar">
          <div id="closeMenu" @click="closeMenu"><i class="material-icons">arrow_back</i></div>
          <div style="width: 300%;">{{activeMenu == 'new' ? 'Start A New Game' : 'Join A Game'}}</div>
          <div></div>
        </div>
        <form v-if="activeMenu == 'new'" @submit.prevent="startGame" id="newMenu">
          <div class="form-row" id="mode">
            <input type="radio" id="party" v-model="newGameMode"  value="party" hidden>
            <label
              for="party"
              class="ui-shiny ui-raised"
              :class="{'ui-pressable': newGameMode != 'party'}"
            >
              <i class="material-icons">devices</i><br>
              Party Mode
            </label>
        
            <input type="radio" id="remote" v-model="newGameMode"  value="remote" hidden>
            <label disabled
              for="remote"
              class="ui-shiny ui-raised"
              :class="{'ui-pressable': newGameMode != 'remote'}"
            >
              <div style="white-space:nowrap"><i class="material-icons">phonelink_ring</i><i class="material-icons" style="transform: rotateY(180deg)">phonelink_ring</i></div>
              Coming Soon
            </label>
          </div>
          
          <button role="submit" class="ui-pressable ui-shiny ui-raised">GO!</button>
        </form>
        <form v-else-if="activeMenu == 'join'" @submit.prevent="joinGame" id="joinMenu">
          <div class="form-row">
            <input type="text" ref="roomToJoin" v-model="roomToJoin" placeholder="Enter room code" style="text-transform: uppercase; font-size: 1.4em" maxlength="5">
            <button role="submit" :disabled="roomToJoin.length < 5" class="ui-pressable ui-shiny ui-raised">GO!</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Start',
  components: {
  },
  data() {return ({
    showMenu: false,
    activeMenu: 'new',
    newGameMode: 'party',
    roomToJoin: '',
  })},
  methods: {
    openMenu(menu) {
      this.showMenu = true;
      this.activeMenu = menu;
      if (menu == "join") setTimeout( () => this.$refs.roomToJoin.focus(), 300 )
    },
    closeMenu() {
      this.showMenu = false;
    },
    startGame() {
      axios.get('/api/newroom/'+this.newGameMode).then( res=> {
        this.$store.dispatch('setupGameRoom', {id: res.data.rid, mode: this.newGameMode});
      })
    },
    joinGame() {
      axios.get('/api/rooms/'+this.roomToJoin.toLowerCase()).then( res=> {
        // this.$store.dispatch('setupGameRoom', {id: res.data.rid, mode: this.newGameMode});
        this.$store.dispatch('joinGameRoom', res.data.rid);
        console.log(res.data.rid)
      })
    }
  }
}
</script>

<style scoped>
#slideWrapper {
  width: calc(100vw - 2rem);;
  overflow: hidden;
}
#slideContainer {
  top: 0;
  left: 0%;
  position: relative;
  width: 250%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  transition: 200ms ease-out;
}
#slideContainer.slid {
  left: -150%;
}
#slideContainer > div {
  padding: 5px;
  width: calc(100vw - 2rem);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

div#menuWrpper {
  display: flex;
  flex-direction: column;
  max-width: 35rem;
}

div#topBar {
  display: flex;
  align-items: center;
  /* margin: 0 0 1rem; */
}

div#topBar > div {
  width: 100%;
  flex-grow: 1;
  font-size: 1.2em;
  font-weight: bold;
}
div#closeMenu {
  width: 100%;
  text-align: left;
  cursor: pointer;
  user-select: none;
}


.form-row {
  justify-content: center;
  flex-wrap: wrap;
}
#mode.form-row label {
  border-radius: 10px;
  background-color: #bbb;
  color: #fff;
  padding: 1em;
  margin: .5em;
  font-size: 1em;
  width: 7em;
}
#mode.form-row input:checked + label {
  background-color: #0bf;
}

#mode.form-row label i {
  font-size: 2.5em;
  margin: .35em 0;
}

</style>