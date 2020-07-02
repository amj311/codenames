<template>
  <div id="app">
    <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">

    <StartView v-if="state.view == 'start'" />
    <PlayView v-if="state.view == 'play'" />
    <RoomView v-if="state.view == 'room'" />
    <!-- <img alt="Vue logo" src="./assets/logo.png"> -->
    <!-- <Board msg="Codenames"/> -->
    <Modal />

  </div>
</template>

<script>
import PlayView from './components/PlayView.vue'
import StartView from './components/StartView.vue'
import RoomView from './components/RoomView.vue'
import Modal from './components/Modal.vue'
let wordSet = require('./assets/words/test_rel.json');

export default {
  name: 'App',
  components: {
    PlayView,
    StartView,
    RoomView,
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
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  min-height: 100vh;
  padding: 1rem;
  box-sizing: border-box;
  display: flex;
  align-content: center;
  align-items: center;
  justify-content: center;
}

.ui-view-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 65rem;
  display: flex;
  align-content: center;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}
.ui-block {
  padding: 1rem;
  background: #fff;
  width: 100%;
  max-width: 65rem;
  box-sizing: border-box;
  margin: .25em;
  border-radius: 10px;
}
.ui-block > h3:first-of-type {
  margin: 0 0 .5em;
}

.form-row {
  margin: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

input {
  font-size: .80em;
  padding: .25em;
  margin: 0 .25em;
  max-width: 100%;
  flex-grow: 1;
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
.form-row input[type="range"] {
  width: 100%;
}


button {
  border: none;
  padding: 1em 2em;
  font-weight: bold;
  color: white;
  background-color: #0bf;
  margin: .5em;
}
button.inline {
  display: inline-block;
  margin: 0;
  padding: .8em 1em;
  font-size: .75em;
}
[disabled="disabled"] {
  pointer-events: none;
  opacity: .5;
}
.ui-pressable {
  cursor: pointer;
  outline: none;
}
.ui-raised, .ui-block {
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

@keyframes pulse {
  from {transform: scale(1);}
  to {transform: scale(1.2);}
}

</style>
