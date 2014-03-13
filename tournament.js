// iron-router config
Router.configure({
	layoutTemplate: 'layout'	
	});
// prevent partial loading of  protected templates before loggedIn state is determined
// tmeasday @ https://github.com/EventedMind/iron-router/issues/286 
Router.before(function() {
  if (Meteor.loggingIn()) {
    this.render(this.loadingTemplate);
    this.stop();
  } 
});
	
// route mappings
Router.map(function(){
	this.route('home', {
		path: '/',
		template: 'main'
	});
	
	this.route('account', {
		path: '/account',
		template: 'account'
	});
	
	this.route('admin', {
		path:'admin',
        template: 'accountsAdmin',
        before: function() {
			if( !Roles.userIsInRole(Meteor.user(), ['admin']) ) {
				Log('Redirecting');
                this.redirect('/');
            }
        }
    });
	
});

// set collection object
Tournaments = new Meteor.Collection("tournaments");