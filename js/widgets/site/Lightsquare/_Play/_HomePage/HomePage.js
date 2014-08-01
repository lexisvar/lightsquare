define(function(require) {
	require("css!./home_page.css");
	var html = require("file!./home_page.html");
	var Ractive = require("lib/dom/Ractive");
	var SeekForm = require("./_SeekForm/SeekForm");
	var SeekGraph = require("./_SeekGraph/SeekGraph");
	var SeekList = require("SeekList");
	
	function HomePage(user, server, router, parent) {
		this._user = user;
		this._server = server;
		this._router = router;
		this._seekList = new SeekList(this._server);
		this._setupTemplate(parent);
		this._setupRouter();
	}
	
	HomePage.prototype._setupTemplate = function(parent) {
		this._template = new Ractive({
			el: parent,
			template: html
		});
		
		new SeekForm(this._user, this._server, this._template.nodes.create_seek);
		new SeekGraph(this._seekList, this._user, this._template.nodes.seek_graph);
	}
	
	HomePage.prototype._setupRouter = function() {
		this._router.addRoute("/", (function() {
			this._seekList.startUpdating();
		}).bind(this), (function() {
			this._seekList.stopUpdating();
		}).bind(this));
		
		this._router.execute();
	}
	
	return HomePage;
});