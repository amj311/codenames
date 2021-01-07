const { assert } = require("console");
const Card = require("../entities/Card");
const WordListService = require("./WordListService");

module.exports = class GenerateCardsService {
    constructor() { }

    /**
     * 
     * @param numCards
     * @param teams an array of teams
     * @returns An array of cards 
     */
    generateCards(teams,wordList=null) {
        let openCardIdxs = [];
        let usedWordIdxs = [];
        let cards = [];

        let numCards = teams.reduce((total,team)=>total+team.qty, 0);
        let wordSet = wordList || this.getWordListService().getWordList();
        if (wordSet.length < numCards) throw new Error("Not enough words for cards!");

        for (let i = 0; i < numCards; i++) openCardIdxs.push(i);

        do {
            let randIdx = openCardIdxs[Math.floor(Math.random() * openCardIdxs.length)];
            if (openCardIdxs.lastIndexOf(randIdx) < 0) continue;
            openCardIdxs = openCardIdxs.filter(idx => idx != randIdx);

            let wordIdx;
            do {
                wordIdx = Math.floor(Math.random() * wordSet.length);
            } while (usedWordIdxs.lastIndexOf(wordIdx) != -1);
            usedWordIdxs.push(wordIdx);

            // this process determines which team the randIdx belongs to.
            // teamCap serves as a delimiter for a team's range of cards
            let team;
            let teamCap = 0;
            let teamIdx = 0;
            do {
                team = teams[teamIdx];
                teamCap = Number(teamCap) + Number(team.qty);
                teamIdx++;
            } while (teamCap <= randIdx)

            let card = new Card(randIdx,wordSet[wordIdx],team);
            cards.push(card)

        } while (openCardIdxs.length > 0);

        return cards;
    }

    getWordListService() {
        return new WordListService();
    }
     
}