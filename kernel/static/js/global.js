// This contains global variables
//
// As a convention add an empty line here, to that
// we know the variable exists, and we have a nice
// list of globals.

var global = {
    mainView: null,
    dateFormat: function (date) {
        if (isNaN(date.getTime())) {
            return '';
        }
        return date.getDate() + '.' + (date.getMonth()+1) + '.' + date.getFullYear();
    },
    dateParse: function (string) {
        var pieces = string.split('.');
        return new Date(pieces[2], pieces[1]-1, pieces[0]);
    }
};
