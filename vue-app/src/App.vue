<template>
  <div id="app">
    <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">

    <StartView v-if="state.view == 'start'" />
    <PlayView v-else-if="state.view == 'play'" />
    <!-- <img alt="Vue logo" src="./assets/logo.png"> -->
    <!-- <HostView msg="Codenames"/> -->
    <Modal />

  </div>
</template>

<script>
import PlayView from './components/PlayView.vue'
import StartView from './components/StartView.vue'
import Modal from './components/Modal.vue'
let wordSet = require('./assets/words/test_rel.json');

export default {
  name: 'App',
  components: {
    PlayView,
    StartView,
    Modal,
  },
  created() {
    this.$store.commit('setWords', wordSet.words);
  },

  data() { return ({
    state: this.$store.state,
  })}
}
</script>

<style>
body {
  background: #f5f5f5;
  margin: 0;
}
body::before {
  content: '';
  display: block;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url(./assets/full_bg.jpg);
  background-position: center;
  background-size: cover;
  background-attachment: fixed;
  opacity: 0.2;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #111;
}


#app {
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-content: center;
  align-items: center;
  justify-content: center;
}


.form-row {
  margin: 1rem;
  display: flex;
  align-items: center;
}

form input {
  font-size: 1.25em;
  padding: .25em;
}

input[type="number"] {
  text-align: right;
  width: 3em;
}

input[type="range"] {
  padding: 0;
  -webkit-appearance: none;
  appearance: none;
  height: .4em;
  outline: none;
  border-radius: 1em;
  background: #0bf;
  flex-grow: 1;
  margin: 0 1em;
}
::-webkit-slider-thumb {
  -webkit-appearance: none; 
  appearance: none;
  width: 1em;
  height: 1em;
  background: #fff;
  box-shadow: 0 0 2px #000;
  border-radius: 2em;
  cursor: pointer;
}
.slider::-moz-range-thumb {
  -webkit-appearance: none; 
  appearance: none;
  width: 1em;
  height: 1em;
  background: #fff;
  box-shadow: 0 0 2px #000;
  border-radius: 2em;
  cursor: pointer;
}


button {
  border: none;
  padding: 1em 2em;
  font-weight: bold;
  color: white;
  background-color: #0bf;
  margin: .5em;
}
button:disabled {
  pointer-events: none;
  opacity: .5;
}
.ui-pressable {
  cursor: pointer;
  outline: none;
}
.ui-raised {
  box-shadow: 1px 1px 3px #0005;
}
img.ui-raised {
  filter: drop-shadow(1px 1px 3px #0004);
  box-shadow: none;
}
.ui-raised.ui-pressable:hover, .ui-raised.ui-pressable:focus {
    box-shadow: 3px 3px 5px 0px #0004;
    transform: translateY(-1px);
}
.ui-raised.ui-pressable:active {
    box-shadow: 1px 2px 4px 0px #0005;
    transform: translateY(0px);
}
.ui-shiny {
  position: relative;
  outline: none;
  user-select: none;
}
.ui-shiny::after {
  display: block;
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  background: linear-gradient(35deg, transparent 30%, rgba(255, 255, 255, 0.267) 35%, transparent 45%, transparent 52%, rgba(255, 255, 255, 0.267) 57%, transparent 73%);
  background-position: 0% 50%;
  background-size: 300% 300%;
  transition: background-position 300ms;
}

.ui-shiny.ui-pressable:hover::after, .ui-shiny.ui-pressable:focus::after, .ui-shiny.ui-shift-shiny::after {
  background-position: 60% 50%;
}
</style>
