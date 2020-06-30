<template>
  <div id="app">
    <Start />
    <!-- <img alt="Vue logo" src="./assets/logo.png"> -->
    <Board msg="Codenames"/>
  </div>
</template>

<script>
import Board from './components/Board.vue'

export default {
  name: 'App',
  components: {
    Board,
    // Start,
  }
}
</script>

<style>
body {
  background: #f5f5f5;
}
body::before {
  content: '';
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url(./assets/full_bg.jpg);
  background-position: center;
  background-size: cover;
  opacity: 0.2;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}


#app {
  position: relative;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-content: center;
  align-items: center;
  justify-content: center;
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
