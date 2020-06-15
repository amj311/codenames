<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <div class="cards-table">
      <div v-for="card in cards" :key="card.word" class="card-cell">
        <Card :word="card.word" :color="card.color" />
      </div>
    </div>
    
  </div>
</template>

<script>
import Card from './Card.vue'
import wordSet from '../assets/words/test.json'

export default {
  name: 'HelloWorld',
  props: {
    msg: String
  },
  components: {
    Card
  },

  data() { return {
    cards: [],
    colors: ["yellow", "red", "#0bf"]
  }},

  created() {
    for (let i = 0; i < 25; i ++) {
      let wordIdx = Math.floor(Math.random()*wordSet.words.length);
      let colorIdx = Math.floor(Math.random()*this.colors.length);
      this.cards.push( {word: wordSet.words[wordIdx], color: this.colors[colorIdx]} )
    }
    console.group('cards')
    let cards = this.cards;
    for (let i = 0; i < cards.length; i+=5) {
      console.log(`%c ${cards[i].word[0]} %c ${cards[i+1].word[0]} %c ${cards[i+2].word[0]} %c ${cards[i+3].word[0]} %c ${cards[i+4].word[0]} `, `color: #000; background-color: ${cards[i].color}`, `color: #000; background-color: ${cards[i+1].color}`, `color: #000; background-color: ${cards[i+2].color}`, `color: #000; background-color: ${cards[i+3].color}`, `color: #000; background-color: ${cards[i+4].color}`);
    }
    console.groupEnd();

  },

}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}

.cards-table {
  display: flex;
  flex-wrap: wrap;
}
.card-cell {
  box-sizing: border-box;
  min-width: 20%;
  max-width: 20%;
  padding: .5em;
}
</style>
