define(function(require) {
	var html = require("file!./create_challenge_form.html");
	var Ractive = require("lib/dom/Ractive");
	var jsonChessConstants = require("jsonchess/constants");
	
	function CreateChallengeForm(user, parent) {
		this._template = new Ractive({
			el: parent,
			template: html,
			data: {
				waiting: false,
				initialTime: "10m",
				timeIncrement: "5",
				ratingMin: "-100",
				ratingMax: "+100"
			}
		});
		
		this._user = user;
		this._waiting = false;
		
		this._template.on("create_or_cancel", (function(event) {
			event.original.preventDefault();
			
			if(this._waiting) {
				this._user.cancelChallenge();
			}
			
			else {
				this._user.createChallenge({
					initialTime: this._template.get("initialTime").toString(),
					timeIncrement: this._template.get("timeIncrement").toString(),
					acceptRatingMin: this._template.get("ratingMin").toString(),
					acceptRatingMax: this._template.get("ratingMax").toString()
				});
			}
		}).bind(this));
		
		this._fillInLastChallengeCreated();
		this._setWaiting(this._user.getCurrentChallenge() !== null);
		
		this._user.HasIdentity.addHandler(this, function() {
			this._setWaiting(this._user.getCurrentChallenge() !== null);
			this._fillInLastChallengeCreated();
		});
		
		this._user.ChallengeCreated.addHandler(this, function() {
			this._setWaiting(true);
		});
		
		this._user.ChallengeExpired.addHandler(this, function() {
			this._setWaiting(false);
		});
	}
	
	CreateChallengeForm.prototype._setWaiting = function(waiting) {
		this._waiting = waiting;
		this._template.set("waiting", waiting);
	}
	
	CreateChallengeForm.prototype._fillInLastChallengeCreated = function() {
		var options = this._user.getLastChallengeOptions();
		
		if(options !== null) {
			this._template.set("initialTime", options.initialTime);
			this._template.set("timeIncrement", options.timeIncrement);
			this._template.set("acceptRatingMin", options.acceptRatingMin);
			this._template.set("acceptRatingMax", options.acceptRatingMax);
		}
	}
	
	return CreateChallengeForm;
});