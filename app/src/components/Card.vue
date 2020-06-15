<template>
  <div class="wrapper">
    <div class="card" v-on:click="this.flipCard" :class="{flipped: flipped}">
      <div class="card-face front" >
        <div>{{ word }}</div>
      </div>
      <div class="card-face back" :style="{backgroundColor: color}">
        <!-- <div>{{ word }}</div> -->
      </div>
    </div>
  </div>

</template>

<script>
export default {
  name: 'Card',
  props: {
    word: String,
    color: String
  },

  data() { return {
    flipped: false
  }},

  methods: {
    flipCard: function() {
      if (!this.flipped) {
        console.log('flipped')
        this.flipped = true;
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.wrapper {
  perspective: 1000px;
  height: 5em;
}

.card {
  position: relative;
  width: 100%;
  height: 100%;  
}
.flipped {
  transform: rotateX(180deg);
  transition: 500ms;
  transform-style: preserve-3d;
}

.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  border-radius: 10px;
  border: .25em solid;
  padding: 1em;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  cursor: pointer;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}

.back {
  transform: rotateX(180deg)
}

</style>
