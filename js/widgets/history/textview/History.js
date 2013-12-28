define(function(require) {
	var Base=require("../_History");
	var Variation=require("./_Variation/Variation");
	var Move=require("./_Move/Move");
	var Template=require("lib/dom/Template");
	require("css@./resources/history.css");
	var html=require("file@./resources/history.html");

	function History(parent) {
		Base.call(this);

		this._template=new Template(html, parent);
		this._template.root.appendChild(this.mainLine.node);
	}

	History.implement(Base);

	History.prototype.createMove=function(move) {
		var move=new Move(move);

		this._setupMove(move);

		return move;
	}

	History.prototype.createVariation=function() {
		return new Variation();
	}

	return History;
});