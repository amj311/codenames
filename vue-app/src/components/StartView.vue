<template>
<div id="slideWrapper">
  <div id="slideContainer" :class="{slid: showMenu}">
    <div id="main">
      <button @click="openMenu('new')" class="ui-raised ui-pressable ui-shiny">New Game</button>
      <button @click="openMenu('join')" class="ui-raised ui-pressable ui-shiny">Join a Game</button>
    </div>
    <div id="menus">
      <div id="menuWrpper">
        <div id="topBar">
          <div id="closeMenu" @click="closeMenu"><i class="material-icons">arrow_back</i></div>
          <div style="width: 300%;">{{activeMenu == 'new' ? 'Start A New Game' : 'Join A Game'}}</div>
          <div></div>
        </div>
        <form v-if="activeMenu == 'new'" @submit.prevent="startGame" id="newMenu">
          <div class="form-row" id="mode">
            <input type="radio" id="remote" v-model="newGameMode"  value="remote" hidden>
            <label
              for="remote"
              class="ui-shiny ui-raised"
              :class="{'ui-pressable': newGameMode != 'remote'}"
            >
              <i class="material-icons">phonelink_ring</i><i class="material-icons">phonelink_ring</i><br>
              Remote Mode
            </label>
            <input type="radio" id="party" v-model="newGameMode"  value="party" hidden>
            <label
              for="party"
              class="ui-shiny ui-raised"
              :class="{'ui-pressable': newGameMode != 'party'}"
            >
              <i class="material-icons">devices</i><br>
              Party Mode
            </label>
          </div>
          <!-- <div id="numCards" class="form-row">
            <label>Number of Cards</label>
            <input type="range" name="numCards" v-model="newGameSqrFactor" min="3" max="6">
            <label style="width:1em;">{{newGameSqrFactor**2}}</label>
          </div> -->
          <button role="submit" class="ui-pressable ui-shiny ui-raised">GO!</button>
        </form>
        <form v-else-if="activeMenu == 'join'" @submit.prevent="joinGame" id="joinMenu">
          <div class="form-row">
            <input type="text" v-model="roomToJoin" placeholder="Enter room code" style="text-transform: uppercase" maxlength="6">
            <button role="submit" :disabled="roomToJoin.length < 6" class="ui-pressable ui-shiny ui-raised">GO!</button>
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
    newGameMode: 'remote',
    newGameSqrFactor: 5,
    roomToJoin: '',
  })},
  methods: {
    openMenu(menu) {
      this.showMenu = true;
      this.activeMenu = menu;
    },
    closeMenu() {
      this.showMenu = false;
    },
    startGame() {
      axios.get('http://localhost:3000/api/newroom').then( res=> {
        this.$store.commit('setupSocket', res.data.rid);
        this.$store.commit('setupHost');
      })
    },
    joinGame() {
      this.$store.commit('newGame');
    }
  }
}
</script>

<style scoped>
#slideWrapper {
  width: 100%;
  overflow: hidden;
}
#slideContainer {
  top: 0;
  left: 0%;
  position: relative;
  width: 250vw;
  height: 100%;
  display: flex;
  justify-content: space-between;
  transition: 200ms ease-out;
}
#slideContainer.slid {
  left: -150vw;
}
#slideContainer > div {
  width: 100vw;
  padding: 1rem;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

div#menuWrpper {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background: #fff;
  width: 100%;
  max-width: 30rem;
  margin: 0 auto;
  border-radius: 10px;
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


#mode.form-row {
  justify-content: center;
}
#mode.form-row label {
  border-radius: 10px;
  background-color: #bbb;
  color: #fff;
  padding: 1em;
  margin: 0 .5em;
  font-size: 1em;
}
#mode.form-row input:checked + label {
  background-color: #0bf;
}

#mode.form-row label i {
  font-size: 2em;
  margin: .35em 0;
}

</style>
