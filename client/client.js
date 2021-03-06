//client.js client code
Meteor.startup(function () {
	Session.set('data_loaded', false);
});
// subscriptions
Meteor.subscribe('tournamentdb', function() {
	Session.set('data_loaded', true);
});

index = {}; // index for use in select_* functions

Template.tournlist.tournaments = function () {
	return Tournaments.find({}, {fields: {name: 1, game: 1}});
};	
// grab cursor with _id only to determine match with selected_tournament.
Template.container.tournaments = function () {
	return Tournaments.find({}, {fields: {_id: 1, game: 1, name: 1}});
};	
// selected_player in tournament template
// Projection operator $elemMatch is not supported, so instead of grabbing one players subdocument, we grab them all and 
// sort through with JS.
Template.leaderboard.selected_name = function () {
	var json = Tournaments.findOne(Session.get("selected_tournament"), {fields: { "players.playerid": 1, "players.name": 1}});
	if (json) {
		// maps the playerid values from each players subdocument into an array.
		// index value is used for increment and decrement functionality to replace $ in players.$.score
		index = json.players.map(function(e) { return e.playerid; }).indexOf(Session.get("selected_player"));
		player = json.players[index];
		return player && player.name;
	}
	return false;
};
// return sorted array of players from selected_tournament
Template.leaderboard.players = function () {
	var unsorted = Tournaments.findOne(Session.get("selected_tournament"), {fields: {players: 1}});
	return unsorted.players.sort(function (a, b) { return b.score - a.score});
};
// selected_tournament in container template.  TODO: kill redundancy
Template.container.selected_tournament = function () {
	if (Session.get('data_loaded')) {
		var tourns = Tournaments.findOne(Session.get("selected_tournament"));		
		// check against session's _id to determine leaderboard load
		if (this._id === Session.get("selected_tournament")) 
			return true;			
	}
	return false;
};
// determines if anything is selected by checking session variable selected_tournament
// prevents unnecessary db call
Template.container.selected_any = function() {
	if (Session.get("selected_tournament"))
		return true;
	else
		return false;
};

Template.navbar.uid = function() {
	if ( Meteor.user() ) {
		var jsonid = { _id: Meteor.userId() };
		return jsonid;
	}
	else
		return false;
}

Template.navbar.events({
	// toggle open/close of menus
	'click .dropdown-toggle': function (e) {
		e.preventDefault();
		$(e.target).find('.dropdown-menu').toggle();
	},
	// clear selections to show default page
	'click a.navbar-brand': function () {
		Session.set("selected_tournament", '');
		Session.set("selected_player",'');
	}
});

// determine whether or not to add the selected class to player div in handlebars loop
Template.player.selected = function () {
	return Session.equals("selected_player", this.playerid) ? "text-warning" : '';
};
// determine whether or not to add the selected class to tournament div in handlebars loop
Template.info.selected = function () {
	return Session.equals("selected_tournament", this._id) ? "text-success" : '';
};
// events to capture in tournament template
Template.tournlist.events({
	'click li': function () {
		Session.set("selected_tournament", this._id);
		Session.set("selected_player",'');
		Router.go('/');
	}
});
		
// leaderboard events capture
Template.leaderboard.events({

	// updates the score of the selected player for the selected tournament by +1 or -1
	// minimongo.js does not support projection operators very well, including $ wildcard.  In mongo shell code, 
	// this could be accomplished with:
	// db.tournaments.update({_id: MongoId(IDNUM), "players.playerid": PLAYERID},{$inc: {"players.$.score": 1}});
	// instead, index is determined on selected_name and used here to update.
	
	// increments score by 1
	'click input.inc': function() {
		var inc = {$inc: {}};
		inc.$inc['players.' + index + '.score'] = 1;  // same as "players.NUM.score": 1
		Tournaments.update(Session.get("selected_tournament"), inc);
	},
	// Decrements score by 1
	'click input.dec': function() {
		var dec = {$inc: {}};
		dec.$inc['players.' + index + '.score'] = -1;  // same as "players.NUM.score": -1
		Tournaments.update(Session.get("selected_tournament"), dec);
	}
});//end leader events

// playerid is stored in tournament subdocument "players" for now
// will be in players or users collection later
Template.player.events({
	'click': function () {
		Session.set("selected_player", this.playerid);
	}
});//end player events

//check if user is an admin
/*
Template.account.helpers({
	isAdminUser: function() {
		return Roles.userIsInRole(Meteor.user(), ['admin']);
	}
});
*/
// Testing d3 visualizations in meteor from example: 
// https://github.com/adrianveres/Reactive-Bar-Chart-Demo
Template.d3vis.created = function () {
// Defer to make sure we manipulate DOM
_.defer(function () {
 // Use this as a global variable
window.d3vis = {};
Deps.autorun(function () {
	
	// On first run, set up the visualiation.  Use {{#constant}} in templates to preserve.
	if (Deps.currentComputation.firstRun) {
	  //console.log("firstRun");
	  
	  window.d3vis.margin = {top: 15, right: 5, bottom: 5, left: 5},
	  window.d3vis.width = 600 - window.d3vis.margin.left - window.d3vis.margin.right,
	  window.d3vis.height = 120 - window.d3vis.margin.top - window.d3vis.margin.bottom;

	  window.d3vis.x = d3.scale.ordinal()
		  .rangeRoundBands([0, window.d3vis.width], .1);

	  window.d3vis.y = d3.scale.linear()
		  .range([window.d3vis.height-2, 0]);

	  window.d3vis.color = d3.scale.category10();

	  window.d3vis.svg = d3.select('#d3vis')
		  .attr("width", window.d3vis.width + window.d3vis.margin.left + window.d3vis.margin.right)
		  .attr("height", window.d3vis.height + window.d3vis.margin.top + window.d3vis.margin.bottom)
		.append("g")
		  .attr("class", "wrapper")
		  .attr("transform", "translate(" + window.d3vis.margin.left + "," + window.d3vis.margin.top + ")");
	}

// Get the colors based on the sorted names
if (Session.get('data_loaded') && Session.get('selected_tournament')) {
	//console.log("data loaded & selected_tournament");
	//console.log("selected_tournament = ", Session.get('selected_tournament'));
	//console.log("selected_player = ", Session.get('selected_player'));
	
	names = Tournaments.findOne(Session.get('selected_tournament'), {fields: { players: 1}});
	names = names.players.sort(function (a,b){return b.score - a.score});
	window.d3vis.color.domain(names.map(function(d) { return d.name}));

	// Get the players
	window.d3vis.x.domain(names.map(function(d) { return d.name}));
	window.d3vis.y.domain([0, d3.max(names, function(d) { return d.score; })]);

	// Two selectors (this could be streamlined...)
	// Determines if selected_tournament changed by lack of valid selected_player.
	// Redraw only if reset or tournament change.				
	if (Session.get('selected_player').toString.length < 1){ 
		//console.log("no selected player, wipe old data");
		window.d3vis.svg.selectAll(".bar").remove();
		window.d3vis.svg.selectAll(".bar_text").remove();
		}
	
	bar_selector = window.d3vis.svg.selectAll(".bar")
	  .data(names, function (d) {return d.name})
	text_selector = window.d3vis.svg.selectAll(".bar_text")
	  .data(names, function (d) {return d.name})
	
	// fancy transition for initial draw.  Slow to update, so only use once.
	// Duration longer, but also uses chained transitions to spread full width then grow up
	 if (Deps.currentComputation.firstRun) {
		bar_selector
		  .enter().append("rect")
		  .attr("class", "bar")
		  .attr("y", function(d) { return window.d3vis.height - .5; })
		bar_selector
		  .transition()
		  .duration(500)
		  .style("fill", function(d) { return window.d3vis.color(d.name);})
		  .attr("x", function(d) { return window.d3vis.x(d.name);})
		  .attr("width", window.d3vis.x.rangeBand())
		  .each("end", function() {
			d3.select(this)
				.transition()
				.attr("y", function(d) { return window.d3vis.y(d.score); })
				.attr("height", function(d) { return window.d3vis.height - window.d3vis.y(d.score); })
		})
	// Text falls down and bounces on initial draw.  Delayed from graph draw by 100ms
		text_selector
		  .enter().append("text")
		  .attr("class", "bar_text")
		text_selector
		  .transition()
		  .duration(600)
		  .delay(100)
		  .attr()
		  .attr("x", function(d) { return window.d3vis.x(d.name) + 10;})
		  .each("end", function() {
			d3.select(this)
				.transition()
				.ease("bounce")
				.attr("y", function(d) { return window.d3vis.y(d.score) - 2; })
				.text(function(d) {return d.score;})
				.attr("height", function(d) { return window.d3vis.height - window.d3vis.y(d.score); })
		})
	} else {  // more reactive transition for visualization updates.  duration shortened.
		bar_selector
		  .enter().append("rect")
		  .attr("class", "bar")
		bar_selector
		  .transition()
		  .duration(50)
		  .style("fill", function(d) { return window.d3vis.color(d.name);})
		  .attr("x", function(d) { return window.d3vis.x(d.name);})
		  .attr("width", window.d3vis.x.rangeBand())
		  .attr("y", function(d) { return window.d3vis.y(d.score); })
		  .attr("height", function(d) { return window.d3vis.height - window.d3vis.y(d.score); })
					
		text_selector
		  .enter().append("text")
		  .attr("class", "bar_text")
		text_selector
		  .transition()
		  .duration(50)
		  .attr()
		  .attr("x", function(d) { return window.d3vis.x(d.name) + 10;})
		  .attr("y", function(d) { return window.d3vis.y(d.score) - 2; })
		  .text(function(d) {return d.score;})
		  .attr("height", function(d) { return window.d3vis.height - window.d3vis.y(d.score); })
	}
}
else if (Session.get('data_loaded') && !Session.get('selected_tournament')) {
		//console.log("removing");
		bar_selector.remove();
		text_selector.remove();			
	}
else { 
	//console.log("data not loaded"); 
} 
  });
});
}