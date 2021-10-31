class GameState {
    constructor(props) {
        this.isInPlay = props.isInPlay || false;
        this.canStartGame = props.canStartGame || false;
        this.canAddCodeMaster = props.canAddCodeMaster || false;
        this.canRevealCard = props.canRevealCard || false;
        this.canAdvanceTurn = props.canAdvanceTurn || false;
        this.canEndGame = props.canEndGame || false;
        this.isGameOver = props.isGameOver || false;
    }
}

module.exports = {
    waitingToStart: new GameState({
        isInPlay: false,
        canStartGame: true,
        canAddCodeMaster: true,
        canEndGame: false,
    }),

    guessing: new GameState({
        isInPlay: true,
        canRevealCard: true,
        canAdvanceTurn: true,
        canEndGame: true,
    }),
    
    gameOver: new GameState({
        isGameOver: true,
        isInPlay: true,
        canEndGame: true,
    })

}