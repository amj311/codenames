<template>
  <div class="ui-view-wrapper">
    <Board msg="Codenames" style="width: 100%" />
  </div>
</template>

<script>
import Board from './Board.vue'

export default {
  name: 'Play',
  components: {
    Board,
  }
}
</script>

<style>

</style>
