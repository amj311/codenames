<template>
  <div>
    Hello! {{state.room.id || "You are not in a room!"}}
    <button @click="$store.commit('goToView', 'play')">PlayGme</button>
  </div>
</template>

<script>

export default {
  name: 'Room',
  components: {

  },
  data() {return({
    state: this.$store.state,
  })}
}
</script>

<style>

</style>
