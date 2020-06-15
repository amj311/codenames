<template>
  <div v-on:click="this.flipCard" class="wrapper" :class="{flipped: flipped}">
    <div>{{ word }}</div>
  </div>
</template>

<script>
export default {
  name: 'Card',
  props: {
    word: String
  },

  data() { return {
    flipped: false
  }},

  methods: {
    flipCard: function() {
      console.log('flipped')
      this.flipped = true;
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.wrapper {
  border-radius: 10px;
  border: .25em solid;
  padding: 1em;
  height: 5em;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  cursor: pointer;
  perspective: 1000px;
}

.wrapper.flipped {
  transform: rotateX(180deg);
  transition: 500ms;
  transform-style: preserve-3d;
}
</style>
