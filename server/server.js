// server.js server-side code
Meteor.publish('tournamentdb', function () {
	return Tournaments.find();
});
/*
Meteor.publish("userData", function () {
  return Meteor.users.find({_id: this.userId},
                           {fields: {'other': 1, 'things': 1}});
});
*/