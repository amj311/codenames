module.exports = {
    waitingToStart: {
        isInPlay: false,
        canStartGame: true,
        canAddCodeMaster: true,
        canRevealCard: false,
        canAdvanceTurn: false,
        canEndGame: false,
    },

    guessing: {
        isInPlay: true,
        canStartGame: false,
        canAddCodeMaster: false,
        canRevealCard: true,
        canAdvanceTurn: true,
        canEndGame: true,
    },
    
    gameOver: {
        isInPlay: true,
        canStartGame: false,
        canAddCodeMaster: false,
        canRevealCard: false,
        canAdvanceTurn: false,
        canEndGame: true,
    }

}