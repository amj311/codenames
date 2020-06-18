<template>
  <div class="wrapper" v-show="show">
    <div class="modal" v-on:click="this.ok">
      <div class="card-face front ui-raised" :class="{'ui-pressable': !card.flipped && !freeRotate}" >
        <div>{{ card.word }}</div>
      </div>
      <div class="card-face back ui-raised ui-shiny" :class="{'ui-shift-shiny': card.flipped}" :style="{backgroundColor: card.color}">
        <!-- <div>{{ card.word }}</div> -->
      </div>
    </div>
  </div>

</template>

<script>
export default {
  name: 'Card',
  props: [],

  data() { return {
    show: true
  }},

  methods: {
    flipCard: function() {
      if (!this.card.flipped && !this.freeRotate) {
        this.card.flipped = true;
        this.$emit('flipped')
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.wrapper {
  perspective: 500px;
  height: 5em;
}

.card {
  position: relative;
  width: 100%;
  height: 100%;
  background: #fff;
  border-radius: 10px;
  transition: 500ms;
  transform-style: preserve-3d;
}
.flipped .card, .freeRotate .card {
  transform: rotateX(180deg);
}
.freeRotate:hover div.card {
  transform: rotateX(0deg);
}

.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  border-radius: 10px;
  padding: 1em;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}

.back {
  transform: rotateX(180deg)
}
.back.ui-shiny.ui-shift-shiny::after {
  transition-delay: 250ms;
}

</style>
