var Kernel_View_LogIn = AbstractView.extend({
    initialize: function () {
        this.subviews = {
            username: new Kernel_View_Ui_Entry({
                label: 'Username',
                onEnter: this.login.bind(this),
                autoFocus: true,
            }),
            password: new Kernel_View_Ui_Entry({
                label: 'Password',
                password: true,
                onEnter: this.login.bind(this),
            })
        };
    },

	events: {
		'click #log-in-button': 'login'
	},

    render: function (options) {
        if (localStorage['username'] === undefined) {
            AbstractView.prototype.render.call(this, options);
        }
    },
	
	login: function () {

		var username = this.subviews.username.getValue();
		var password = this.subviews.password.getValue();

		userHelper.login(username, password, this.remove.bind(this) );
	},
});
