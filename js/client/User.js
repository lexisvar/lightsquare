define(function(require) {
	var Game = require("./Game");
	var Event = require("lib/Event");
	var Glicko = require("chess/Glicko");
	
	function User(server) {
		this._games = {};
		this._server = server;
		this._username = "Anonymous";
		this._isLoggedIn = false;
		this._gamesPlayedAsWhite = 0;
		this._gamesPlayedAsBlack = 0;
		this._rating = Glicko.INITIAL_RATING;
		
		this.Replaced = new Event(this);
		this.LoggedIn = new Event(this);
		this.LoginFailed = new Event(this);
		this.LoggedOut = new Event(this);
		this.GamesReceived = new Event(this);
		this.GameReady = new Event(this);
		
		this._server.subscribe("/user/login/success", (function(data) {
			this.LoggedIn.fire();
		}).bind(this));
		
		this._server.subscribe("/user/logout", (function(data) {
			this._logout();
		}).bind(this));
		
		this._server.subscribe("/user/replaced", (function(data) {
			this.Replaced.fire();
		}).bind(this));
		
		this._server.subscribe("/games", (function(games) {
			var newGames = [];
			
			games.forEach((function(gameDetails) {
				newGames.push(this._addGame(gameDetails));
			}).bind(this));
			
			this.GamesReceived.fire({
				games: newGames
			});
		}).bind(this));
		
		this._server.subscribe("/game", (function(gameDetails) {
			this.GameReady.fire({
				game: this._addGame(gameDetails)
			});
		}).bind(this));
		
		this._server.send("/request/games");
	}
	
	User.prototype.login = function(username, password) {
		this._server.send("/user/login", {
			username: username,
			password: password
		});
	}
	
	User.prototype.logout = function() {
		this._server.send("/user/logout");
	}
	
	User.prototype._logout = function() {
		this._username = "Anonymous";
		this._isLoggedIn = false;
		
		this.LoggedOut.fire();
	}
	
	User.prototype.createChallenge = function(options) {
		this._server.send("/challenge/create", options);
	}
	
	User.prototype.acceptChallenge = function(id) {
		this._server.send("/challenge/accept", id);
	}
	
	User.prototype._addGame = function(gameDetails) {
		var game = new Game(this._server, gameDetails);
	
		this._games[gameDetails.id] = game;
		
		return game;
	}
	
	User.prototype.getGames = function() {
		var games = [];
		
		for(var id in this._games) {
			games.push(this._games[id]);
		}
		
		return games;
	}
	
	User.prototype.getGame = function(id) {
		return this._games[id];
	}
	
	User.prototype.hasGame = function(id) {
		return (id in this._games);
	}
	
	User.prototype.spectateGame = function(id) {
		this._server.send("/game/spectate", id);
	}
	
	return User;
});