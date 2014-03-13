// server.js server-side code
Meteor.publish('tournamentdb', function () {
		return Tournaments.find();
	});
	Meteor.publish('usersdb', function () {
		return Meteor.users.find({role: 'admin'}).fetch();
	});