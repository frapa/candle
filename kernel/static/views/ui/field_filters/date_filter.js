var Kernel_View_Ui_FieldFilter_DateFilter = AbstractView.extend({
    filterOptions: new QueryCollection([
        {
            key: 'all_time',
            label: 'All time',
            from: function () {
                // Earliest date representable: Tuesday, April 20th, 271821 BCE
                return new Date(-8640000000000000);
            },
            to: function () {
                // Latest date representable: Saturday, September 13th, 275760 CE
                return new Date(8640000000000000);
            },
        },
        {
            key: 'this_year',
            label: 'This year',
            from: function () {
                var now = new Date();
                return new Date(now.getFullYear(), 0, 1);
            },
            to: function () {
                var now = new Date();
                return new Date(now.getFullYear()+1, 0, 1, 0, 0, 0, -1);
            },
        },
        {
            key: 'this_month',
            label: 'This month',
            from: function () {
                var now = new Date();
                return new Date(now.getFullYear(), now.getMonth(), 1);
            },
            to: function () {
                var now = new Date();
                var next = new Date(now.getFullYear(), now.getMonth()+1, 1);
                return new Date(next - 1);
            },
        },
        {
            key: 'this_week',
            label: 'This week',
            from: function () {
                var now = new Date();
                var day = now.getDay() || 7;
                if (day !== 1) now.setHours(-24 * (day - 1));
                return new Date(now.getFullYear(), now.getMonth(), now.getDate());
            },
            to: function () {
                var now = new Date();
                var day = now.getDay() || 7;
                if (day !== 1) now.setHours(-24 * (day - 1));
                return new Date(now.getFullYear(), now.getMonth(), now.getDate()+7);
            },
        },
        {
            key: 'today',
            label: 'Today',
            from: function () {
                var now = new Date();
                return new Date(now.getFullYear(), now.getMonth(), now.getDate());
            },
            to: function () {
                var now = new Date();
                var next = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1);
                return new Date(next - 1);
            },
        },
        {
            key: 'last_year',
            label: 'Last year',
            from: function () {
                var now = new Date();
                return new Date(now.getFullYear()-1, 0, 1);
            },
            to: function () {
                var now = new Date();
                return new Date(now.getFullYear(), 0, 1, 0, 0, 0, -1);
            },
        },
        {
            key: 'last_month',
            label: 'Last month',
            from: function () {
                var now = new Date();
                return new Date(now.getFullYear(), now.getMonth()-1, 1);
            },
            to: function () {
                var now = new Date();
                var next = new Date(now.getFullYear(), now.getMonth(), 1);
                return new Date(next - 1);
            },
        },
        {
            key: 'last_week',
            label: 'Last week',
            from: function () {
                var now = new Date();
                var day = now.getDay() || 7;
                if (day !== 1) now.setHours(-24 * (day - 1));
                return new Date(now.getFullYear(), now.getMonth(), now.getDate()-7);
            },
            to: function () {
                var now = new Date();
                var day = now.getDay() || 7;
                if (day !== 1) now.setHours(-24 * (day - 1));
                return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, -1);
            },
        },
        {
            key: 'yesterday',
            label: 'Yesterday',
            from: function () {
                var now = new Date();
                return new Date(now.getFullYear(), now.getMonth(), now.getDate()-1);
            },
            to: function () {
                var now = new Date();
                var next = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                return new Date(next - 1);
            },
        },
        {
            key: 'year',
            label: 'Year...',
            from: function (year) {
                return new Date(parseInt(year.get('year')), 0, 1);
            },
            to: function (year) {
                return new Date(parseInt(year.get('year'))+1, 0, 1, 0, 0, 0, -1);
            },
        },
        {
            key: 'month',
            label: 'Month...',
        },
        {
            key: 'week',
            label: 'Week...'
        },
        {
            key: 'day',
            label: 'Day...',
            from: function (day) {
                return day;
            },
            to: function (day) {
                var date = new Date(day);
                date.setHours(24);
                date.setMilliseconds(-1);
                return date;
            },
        },
        {
            key: 'before',
            label: 'Before...',
            from: function (day) {
                return new Date(-8640000000000000);
            },
            to: function (day) {
                return new Date(day - 1);
            },
        },
        {
            key: 'since',
            label: 'Since...',
            from: function (day) {
                return day;
            },
            to: function (day) {
                return new Date();
            },
        },
        {
            key: 'custom',
            label: 'Custom...',
            from: function (day1, day2) {
                return day1;
            },
            to: function (day1, day2) {
                var date = new Date(day2);
                date.setHours(23, 59, 59, 999)
            },
        },
    ]),
    
    initialize: function (options) {
        this.onChange = options.onChangeOptions;

        this.addView('input', new Kernel_View_Ui_Selectbox({
            label: options.label,
            collection: this.filterOptions,
            attr: 'label',
            onChange: this.setSelectedItem.bind(this),
        }));
    },

    setSelectedItem: function (item) {
        self.selectedItem = item;
        
        var key = item.get('key');
        if (key == 'year') {
            this.open(new Kernel_View_Ui_Selectbox({
                label: 'Year',
                collection: _.map(_.range(2000, new Date().getFullYear()+1), function (year) {
                    return {
                        year: year,
                    }
                }).reverse(),
                attr: 'year',
                onChange: this.notifyChange.bind(this),
            }), 'option1');
            this.close('option2');
        } else if (key == 'day' || key == 'before' || key == 'since') {
            this.open(new Kernel_View_Ui_Date({
                label: 'Day',
                onChange: this.notifyChange.bind(this),
            }), 'option1');
            this.close('option2');
        } else if (key == 'custom') {
            this.open(new Kernel_View_Ui_Date({
                label: 'From',
                onChange: this.notifyChange.bind(this),
            }), 'option1');
            this.open(new Kernel_View_Ui_Date({
                label: 'To',
                onChange: this.notifyChange.bind(this),
            }), 'option2');
        } else {
            this.close('option1');
            this.close('option2');
        }

        this.notifyChange();
    },

    notifyChange: function () {
        if (this.onChange) {
            this.onChange();
        }
    },

    getValue: function () {
        var opt1 = this.getView('option1');
        var opt2 = this.getView('option2');

        return [
            self.selectedItem.get('from')(
                opt1 && opt1.getValue(),
                opt2 && opt2.getValue()
            ),
            self.selectedItem.get('to')(
                opt1 && opt1.getValue(),
                opt2 && opt2.getValue()
            ),
        ];
    },

    getType: function () {
        return 'between';
    },

    getMatchCase: function () {
        return true;
    },

    getNegate: function () {
        return false;
    },
});
