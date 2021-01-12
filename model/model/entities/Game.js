const { RevealCardResponse } = require("../../server/dto/RevealCard");
const GenerateCardsService = require("../services/GenerateCardsService");
const GameStates = require("./GameStates");
const Team = require("./Team");

module.exports = class Game {
    constructor(config = null) {
        this.teams = {};
        this.cards = null;
        this.teamOfTurn = null;
        this.winner = null;
        this.usedGuesses = 0;
    
        this.configure(config)
    
        this.state = GameStates.waitingToStart;
    }

    configure(config) {
        this.config = config || {
            numCardsSqrt:5,
            numTeams:2,
            numTeamCards:9,
            numAssassins:1,
            numBystanders:6,
        };
        this.teams = {
            teamOne: new Team("teamOne","Blue","#0bf",true,this.config.numTeamCards),
            teamTwo: new Team("teamTwo","Red","#f22",true,this.config.numTeamCards),
            bystander: new Team("bystander","Bystander","#edcb40",false,this.config.numBystanders),
            assassin: new Team("assassin","Assassin","#2c3e50",false,this.config.numAssassins),
        }
        this.winner = null;
        this.teamOfTurn = null;
        this.cards = null;
    }

    startGame(config) {
        if (!this.state.canStartGame) {
            console.log("Cannot start game from this state!")
            return;
        }
        this.configure(config);
        this.cards = new GenerateCardsService().generateCards(Object.values(this.teams));
        this.state = GameStates.guessing;
        this.teamOfTurn = this.teams.teamOne;
        return this;
    }

    endGame() {
        if (!this.state.canEndGame) return;
        this.state = GameStates.gameOver;
        return this;
    };
    
    exitGame() {
        if (!this.state.canEndGame) return;
        this.configure();
        this.state = GameStates.waitingToStart;
        return this;
    };
    
    advanceTurn() {
        if (!this.state.canRevealCard) return;
        if (!this.teamOfTurn) this.teamOfTurn = this.teams.teamOne;
        else {
          if (this.teamOfTurn == this.teams.teamOne) this.teamOfTurn = this.teams.teamTwo;
          else this.teamOfTurn = this.teams.teamOne;
        }
        this.usedGuesses = 0;

        return this.teamOfTurn;
    };

    revealCard(cardId) {
        let card = this.getCardById(cardId)
        if (!this.state.canRevealCard) return;
        let cardTeam = this.getCardTeam(card);
        let wasTeamCard = cardTeam.id == this.teamOfTurn.id;
        
        card.revealTeam();
        cardTeam.pts++;
        this.usedGuesses++;
        
        if (
            (cardTeam == this.teams.assassin || cardTeam.pts == cardTeam.qty) &&
            cardTeam != this.teams.bystander)
        {
            this.winner = cardTeam;
            this.state = GameStates.gameOver;
        }

        else if (!wasTeamCard) {
            this.advanceTurn();
        }

        return new RevealCardResponse(card,wasTeamCard,this.cards,this.teamOfTurn,this.winner,this.state,this.usedGuesses)
    };

    setTeamCaptain(teamCode,captain) {
        this.teams[teamCode].captain = captain;
        return this.teams;
    }
    
    getCardTeam(card) {
        let team = Array.from(Object.values(this.teams)).find(t => t.id == card.teamId);
        return team;
    }

    getCardById(id) {
        return this.cards.find(c=>c.id == id);
    }
}