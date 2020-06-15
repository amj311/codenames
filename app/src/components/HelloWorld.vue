<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <div class="cards-table">
      <div v-for="word in words" :key="word" class="card-cell">
        <Card :word="word" />
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
    words: [],
  }},

  created() {
    console.log(wordSet.words.length);
    for (let i = 0; i < 25; i ++) {
      let idx = Math.floor(Math.random()*wordSet.words.length);
      this.words.push(wordSet.words[idx])
    }
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
