module.exports.RevealCardRequest = class {
    constructor(cardId) {
        this.cardId = cardId;
    }
}

module.exports.RevealCardResponse = class {
    constructor(card,wasTeamCard,gameData) {
        this.card = card;
        this.wasTeamCard = wasTeamCard;
        this.gameData = gameData;
    }
}