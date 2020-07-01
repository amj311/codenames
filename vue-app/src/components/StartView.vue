<template>
  <div>
    <button @click="startGame" class="ui-raised ui-pressable ui-shiny">New Game</button>
    <button @click="joinGame" class="ui-raised ui-pressable ui-shiny">Join a Game</button>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Start',
  components: {
  },
  methods: {
    startGame() {
      axios.get('http://localhost:3000/api/newroom').then( res=> {
        this.$store.commit('setupSocket', res.data.rid)
      })
    },
    joinGame() {
      this.$store.commit('newGame');
    }
  }
}
</script>

<style>

</style>
