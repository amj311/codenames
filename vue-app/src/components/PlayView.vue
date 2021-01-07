<template>
  <div class="ui-view-wrapper">
    <RoomView v-if="!gameState.state.isInPlay" />
    <Board v-else style="width: 100%" />
  </div>
</template>

<script>
import Board from './Board.vue'
import RoomView from './RoomView.vue'

export default {
  name: 'Play',
  components: {
    Board,
    RoomView
  },
  data() { return {
    state: this.$store.state,
    gameState: this.$store.state.game
  }},

  created() {
    console.log(this.gameState.state.isInPlay)
  }
}
</script>

<style>

</style>
