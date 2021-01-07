module.exports.RevealCardRequest = class {
    constructor(cardId) {
        this.cardId = cardId;
    }
}

module.exports.RevealCardResponse = class {
    constructor(card,wasTeamCard,cards,teamOfTurn,winner,state) {
        this.card = card;
        this.wasTeamCard = wasTeamCard;
        this.cards = cards;
        this.teamOfTurn = teamOfTurn;
        this.winner = winner;
        this.state = state;
    }
}