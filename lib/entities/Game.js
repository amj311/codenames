const { RevealCardResponse } = require("../server/dto/RevealCard");
const GenerateCardsService = require("../services/GenerateCardsService");
const GameStates = require("./GameStates");
const Team = require("./Team");

module.exports = class Game {
    constructor(config = null) {
        this.teams = null;
        this.cards = null;
        this.teamOfTurn = null;
        this.winner = null;
        this.winningCard = null;
        this.usedGuesses = 0;
    
        this.configure(config)
    
        this.state = GameStates.waitingToStart;
    }

    sanitizeConfig(config) {
        if (!config) return null;
        config.numCardsSqrt = parseInt(config.numCardsSqrt);
        config.numTeams = parseInt(config.numTeams);
        config.numTeamCards = parseInt(config.numTeamCards);
        config.numAssassins = parseInt(config.numAssassins);
        config.numBystanders = parseInt(config.numBystanders);
        return config;
    };

    configure(config) {
        this.config = config || {
            numCardsSqrt:5,
            numTeams:2,
            numTeamCards:9,
            numAssassins:1,
            numBystanders:6,
        };
        this.config = this.sanitizeConfig(this.config);
        this.configureTeams();
    }
    configureTeams() {
        if (!this.teams) this.teams = {
            teamOne: new Team("teamOne","Blue","#0bf",true),
            teamTwo: new Team("teamTwo","Red","#f22",true),
            bystander: new Team("bystander","Bystander","#edcb40",false),
            assassin: new Team("assassin","Assassin","#2c3e50",false),
        }
        this.teams.teamOne.qty = this.config.numTeamCards;
        this.teams.teamTwo.qty = this.config.numTeamCards;
        this.teams.bystander.qty = this.config.numBystanders;
        this.teams.assassin.qty = this.config.numAssassins;
    }

    startGame(config) {
        if (!this.state.canStartGame) {
            console.log("Cannot start game from this state!")
            return;
        }
        if (config) {
            this.configure(config)
        }
        this.configureTeams();
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
        this.resetGame();
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

        return this;
    };

    revealCard(cardId) {
        let card = this.getCardById(cardId)
        if (!this.state.canRevealCard) return;
        let cardTeam = this.getCardTeam(card);
        let cardBelongsToTeamOfTurn = cardTeam.id === this.teamOfTurn.id;
        
        card.revealTeam();
        cardTeam.pts++;
        this.usedGuesses++;

        console.log("\nFlipped card!");
        console.log("teamOfTurn:", this.teamOfTurn.id);
        console.log("cardTeam:", cardTeam.id);
        console.log("cardTeam pts:", cardTeam.pts);
        console.log("cardTeam qty:", cardTeam.qty);
        
        if (cardTeam.pts === cardTeam.qty)
        {
            this.winner = cardTeam;
            this.winningCard = card;
            this.state = GameStates.gameOver;
        }

        else if (!cardBelongsToTeamOfTurn) {
            this.advanceTurn();
        }

        return new RevealCardResponse(card,cardBelongsToTeamOfTurn,this)
    };

    setTeamCaptain(setAsCaptain,teamCode,user) {
        if (!setAsCaptain || !teamCode) {    
            if (this.teams.teamOne.captain?.id == user.id) this.teams.teamOne.captain = null;
            if (this.teams.teamTwo.captain?.id == user.id) this.teams.teamTwo.captain = null;
        }
        else {
            this.setTeamCaptain(false,null,user);
            if(this.teams[teamCode]);
            this.teams[teamCode].captain = user;
        }
        return this;
    }
    
    resetGame() {
        for (let team of Object.values(this.teams)) {
            team.pts = 0;
        }
        this.cards = null;
        this.teamOfTurn = null;
        this.winner = null;
        this.winningCard = null;
        this.usedGuesses = 0;
    }
    
    getCardTeam(card) {
        let team = Array.from(Object.values(this.teams)).find(t => t.id == card.teamId);
        return team;
    }

    getCardById(id) {
        return this.cards.find(c=>c.id == id);
    }
}