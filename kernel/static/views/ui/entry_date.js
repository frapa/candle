var Kernel_View_Ui_Date = Kernel_View_Ui_Entry.extend({
    initialize: function (options) {
        this.selectedDate = new Date();

        Kernel_View_Ui_Entry.prototype.initialize.call(this, options);

        if (!global.dayNames) {
            var lang = window.navigator.language;
            global.dayNames = [];
            _.times(7, function (i) {
                var name = new Date(2017, 0, i+1)
                    .toLocaleString(lang, {weekday: 'short'});
                global.dayNames.push(name);
            });

            global.monthNames = [];
            _.times(12, function (i) {
                var name = new Date(2017, i, 1)
                    .toLocaleString(lang, {month: 'long'});
                global.monthNames.push(name);
            });
        }
    },

    render: function(options) {
        Kernel_View_Ui_Entry.prototype.render.call(this, options);

        // Here we bind an event that opens a dialog
        var _this = this;
        var $input = this.$('input');
        $input
            .on('keypress', function (event) {
                var date = _this.selectedDate.getDate();
                
                if (event.key == 'ArrowUp') {
                    _this.selectedDate.setDate(date - 7);
                } else if (event.key == 'ArrowDown') {
                    _this.selectedDate.setDate(date + 7);
                } else if (event.key == 'ArrowLeft') {
                    _this.selectedDate.setDate(date - 1);
                } else if (event.key == 'ArrowRight') {
                    _this.selectedDate.setDate(date + 1);
                } else if (event.key == 'Tab') {
                    _this.dialog.close();
                    return;
                } else {
                    return;
                }

                _this.setValue(_this.selectedDate);
                _this.rebuild();
            })
            .on('change', function () {
                var date = global.dateParse($input[0].value);
                _this.setValue(date);
                _this.dialog.close();
            })
            .focus(this.focus.bind(this));

        return this;
    },

    focus: function () {
        if (this.noFocus) {
            this.noFocus = false;
            return;
        }

        var _this = this;
        var dialog = Kernel_View_Ui_Dialog.extend({
            className: 'datepicker',
            template: function () { return _this.computeDialogHtml(); },
            buttons: {}
        });

        this.dialog = new dialog();
        this.dialog.show(this.$('input'), 'nc');
        this.bindEvents(this.dialog);
    },

    rebuild: function () {
        var datepicker = this.dialog.$('.datepicker');

        datepicker.replaceWith($(this.computeDialogHtml()));
        this.bindEvents(this.dialog);
    },

    bindEvents: function (dialog) {
        var _this = this;

        dialog.$('.prev').click(function () {
            var prevMonth = _this.selectedDate.getMonth() - 1;
            _this.selectedDate.setMonth(prevMonth);
            _this.rebuild();

            _this.noFocus = true;
            _this.$('input').focus();
        });

        dialog.$('.next').click(function () {
            var nextMonth = _this.selectedDate.getMonth() + 1;
            _this.selectedDate.setMonth(nextMonth);
            _this.rebuild();

            _this.noFocus = true;
            _this.$('input').focus();
        });

        dialog.$('td').click(function (event) {
            var pieces = event.target.getAttribute('date').split('-');
            var date = new (Date.bind.apply(Date, [null].concat(pieces)));

            _this.setValue(date);
            dialog.close();
        });
    },

    setValue: function (date) {
        if (typeof date === 'string') {
            // Set today if date is invalid
            if (date === '0001-01-01T00:00:00Z') {
                date = new Date();
            } else {
                date = new Date(date);
            }
        }

        var formattedDate = global.dateFormat(date);
        Kernel_View_Ui_Entry.prototype.setValue.call(this, formattedDate);
        this.selectedDate = date;
    },

    computeNumberOfWeeks: function (first, last) {
        var fdomWeekday = first.getDay();
        var ldomWeekday = last.getDay();

        var weeks = 2;

        return weeks;
    },

    computeDialogHtml: function () {
        var selectedDate = this.selectedDate;

        var month = selectedDate.getMonth();
        var year = selectedDate.getFullYear();

        var lastDayOfPreviousMonth = new Date(year, month, 0);
        var firstDayOfMonth = new Date(year, month, 1);
        var lastDayOfMonth = new Date(year, month+1, 0);

        // Some useful values
        var sd = selectedDate.getDate();
        var ldopm = lastDayOfPreviousMonth.getDate();
        var ldom = lastDayOfMonth.getDate();
        var fdomWeekday = firstDayOfMonth.getDay();
        var ldomWeekday = lastDayOfMonth.getDay();

        var html = '<div class="datepicker">' +
            '<header><span class="icon-left-open-big prev"></span>' +
            '<span class="month">' + global.monthNames[month] + ' ' + year + '</span>' +
            '<span class="icon-right-open-big next"></span></header><table><tr>';
        _.each(global.dayNames, function (name) {
            html += '<th>' + name + '</th>';
        });
        html += '</tr>';

        var day = ldopm - fdomWeekday + 1;
        var prevMonthDone = false;
        var monthDone = false;
        if (fdomWeekday == 0) {
            day = ldopm - 6;
        }

        _.times(6, function (weekNum) {
            html += '<tr>';
            
            _.times(7, function (dayNum) {
                var isCurrentMonth = prevMonthDone && !monthDone;
                var currentMonth = (isCurrentMonth ? month :
                    (prevMonthDone ? month+1 : month-1));

                var uniqueDayStr = year + '-' + currentMonth + '-' + day;

                html += '<td date="' + uniqueDayStr + '" class="' +
                    (isCurrentMonth ? 'current-month' : 'other-month')
                    + ((isCurrentMonth && sd === day) ? ' selected' : '')
                    + '">' + day + '</td>';

                day++;

                if (
                      (!prevMonthDone && day > ldopm) ||
                      (prevMonthDone && day > ldom)
                   )
                {
                    day = 1;
                    monthDone = prevMonthDone ? true : false; 
                    prevMonthDone = true;
                }
            });

            html += '</tr>';
        });

        html += '</table></div>';
        return html;
    } 
});
