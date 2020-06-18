<template>
  <div class="wrapper" :class="{flipped: card.flipped, freeRotate: freeRotate}">
    <div class="card" v-on:click="this.flipCard">
      <div class="card-face front ui-raised" :class="{'ui-pressable': !card.flipped && !freeRotate}" >
        <div>{{ card.word }}</div>
      </div>
      <div class="card-face back ui-raised" :style="{backgroundColor: card.color}" style="background-image: linear-gradient(35deg, transparent 30%, #fff4 35%, transparent 50%, transparent 60%, #fff4 65%, transparent 80%)">
        <!-- <div>{{ card.word }}</div> -->
      </div>
    </div>
  </div>

</template>

<script>
export default {
  name: 'Card',
  props: ["card", "freeRotate"],

  data() { return {
    flipped: false
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
  transform: rotateX(180deg);
  position: relative;
  outline: none;
  user-select: none;  background-position: 0% 50%;
  background-size: 300% 300%;
}
/* .back::after {
  content: '';
  display: block;
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  background: linear-gradient(35deg, transparent 30%, #fff4 35%, transparent 50%, transparent 60%, #fff4 65%, transparent 80%);
  background-position: 0% 50%;
  background-size: 300% 300%;
} */

</style>
