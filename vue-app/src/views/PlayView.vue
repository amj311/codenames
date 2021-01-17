<template>
  <div class="ui-view-wrapper">
    <div v-if="roomIsReady">
      <Board v-if="gameState.state && gameState.state.isInPlay" style="width: 100%" />
      <WaitingView v-else />
    </div>
  </div>
</template>

<script>
import Board from './Board.vue'
import WaitingView from './WaitingView.vue'
import Notification from "../utils/Notification"

class RoomHandler {
  constructor(vue) {
    this.vue = vue;
  }
  roomClosed() {
    this.vue.onRoomClosed();
  }
  hostDisconnect() {
    this.vue.onHostDisconnect();
  }
  playerConnect(player) {
    this.vue.onPlayerConnect(player);
  }
  playerDisconnect(player) {
    console.log("Lost player: ",player)
    this.vue.onPlayerDisconnect(player);
  }
  playerReconnect(player) {
    console.log("Reconnected player ",player)
    this.vue.onPlayerReconnect(player);
  }
}

export default {
  name: 'Play',
  components: {
    Board,
    WaitingView
  },
  data() { return {
    state: this.$store.state,
    gameState: this.$store.state.game,
    roomHandler: new RoomHandler(this),
    roomIsReady: false
  }},

  created() {
    this.$store.commit("setRoomHandler",this.roomHandler)
    this.checkRoute();
  },

  methods: {
    checkRoute(){
      let routeRid = this.$route.params.rid;
      this.roomIsReady = routeRid == this.state.room.id
      console.log("ROUTE MATCHES? ",this.roomIsReady);

      if (!this.roomIsReady) {
        let oldConn = localStorage.getItem("unclosedConnection") ? JSON.parse(localStorage.getItem("unclosedConnection")) : null;
        if (oldConn && oldConn.roomId == routeRid) this.$store.dispatch("attemptReconnect",()=>{
          this.roomIsReady =  true;
        })
        else this.$store.dispatch("joinGameRoom",{
          rid:routeRid,
          cb:()=>this.roomIsReady = true
        })
      }
    },

    onRoomClosed(){
      // not yet implemented
    },
    onPlayerConnect(player){
      if (player.nickname === this.state.user.nickname) return;
      this.$store.dispatch("publishNotif", new Notification({
        msg: player.nickname+" joined!"
      }))
    },
    onHostDisconnect(){
      console.log("lost host!");
    },
    onPlayerDisconnect(player){
      this.$store.dispatch("publishNotif", new Notification({
        msg: player.nickname+" disconnected."
      }))
    },
    onPlayerReconnect(player){
      this.$store.dispatch("publishNotif", new Notification({
        msg: player.nickname+" reconnected!"
      }))
    }
  }
}
</script>

<style>

</style>
