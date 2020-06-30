<template>
  <div>
    <button @click="startGame" class="ui-raised ui-pressable ui-shiny">New Game</button>
    <button @click="joinGame" class="ui-raised ui-pressable ui-shiny">Join a Game</button>
  </div>
</template>

<script>

export default {
  name: 'Start',
  components: {
  },
  methods: {
    startGame() {
        this.$store.commit('newGame');
    },
    joinGame() {
        this.$store.commit('newGame');
    }
  }
}
</script>

<style>

</style>
