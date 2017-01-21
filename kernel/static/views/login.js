var Kernel_View_LogIn = AbstractView.extend({
    initialize: function () {
        this.subviews = {
            username: new Kernel_View_Ui_Entry({
                label: 'username',
                onEnter: this.login.bind(this)
            }),
            password: new Kernel_View_Ui_Entry({
                label: 'password',
                onEnter: this.login.bind(this)
            })
        };
    },

	events: {
		'click #log-in-button': 'login'
	},

    render: function (options) {
        if (localStorage['username'] === undefined) {
            AbstractView.prototype.render.call(this, options);
        } else {
        }
    },
	
	login: function() {
        var _this = this;

		var username = this.subviews.username.getValue();
		var password = this.subviews.password.getValue();

        if (!username || !password) {
            return;
        }
		
        $.getJSON('/controller/login/' + username + '/' + password + '/',
            function (data)
        {
            if (data.success) {
                global.username = username;
                global.password = password;

                localStorage['username'] = username;
                localStorage['password'] = password;

			    _this.remove();
            } else {
                alert(data.reason);
            }
        });
	},
});
