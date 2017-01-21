/* Here I override the default Backbone ajax to pass
 * username and password to the server for authentication.
 */
Backbone.ajax = function() {
    if (global.username !== undefined) {
        arguments[0].url += '?user=' + global.username + '&psw=' + global.password;
    }

    return Backbone.$.ajax.apply(Backbone.$, arguments);
};
