var userHelper = {
	login: function (username, password, successCallback) {
		// check if variables are empty
        if (!username || !password) {
            return;
        }
		
		// server request to check usr + psw
        $.getJSON('/controller/login/' + username + '/' + password + '/',
            function (data)
        {
            if (data.success) {
                global.username = username;
                global.password = password;

				// saves credentials temp
                localStorage['username'] = username;
                localStorage['password'] = password;

                global.accountData = data.accountData;
                localStorage['accountData'] = JSON.stringify(data.accountData);

			    successCallback();
            } else {
                alert(data.reason);
            }
        });
	},

	logout: function () {
		localStorage.clear();
		location.reload();
	},
};
