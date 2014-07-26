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
		before: function() {
			if ( !Meteor.userId()) {
				Log('Redirecting');
                this.redirect('/');
			} else {
				Log('Redirecting');
				this.redirect('profile', { _id: Meteor.userId()});
			}
		}
	});
	
	this.route('profile redirect', {
		path: '/account/profile',
		before: function() {
			if ( !Meteor.userId()) {
				Log('Redirecting');
                this.redirect('/');
			} else {
				Log('Redirecting');
				this.redirect('profile');
			}
		}
	});
	
	this.route('profile', {
		path: '/account/profile/:_id',
		template: 'profile'
	});
	
	this.route('admin', {
		path:'/account/admin',
        template: 'accountsAdmin',
        before: function() {
			if ( !Roles.userIsInRole(Meteor.user(), ['admin']) ) {
				Log('Redirecting');
                this.redirect('/');
            }
        }
    });
	
});

// set collection object
Tournaments = new Meteor.Collection("tournaments");