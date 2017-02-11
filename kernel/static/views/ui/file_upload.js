var Kernel_View_Ui_FileUpload = AbstractView.extend({
    initialize: function (options) {
        this.name = options.name;
        this.filetypes = options.filetypes;
        this.exts = options.exts;
        this.maxsize = options.maxsize;
        this.multiple = options.multiple;
        this.invalidCallback = options.invalidCallback;

        this.uid = 'file' + _.uniqueId();
        this.error = false;
    },

    humanReadableFileSize: function (size) {
        k1024 = 1024 * 1024;
        m1024 = k1024 * 1024;
        g1024 = m1024 * 1024;
        t1024 = g1024 * 1024;

        if (size < 1024) {
            return size + ' b';
        } else if (size < k1024) {
            return (size / 1024).toPrecision(3) + ' Kb';
        } else if (size < m1024) {
            return (size / k1024).toPrecision(3) + ' Mb';
        } else if (size < g1024) {
            return (size / m1024).toPrecision(3) + ' Gb';
        } else if (size < t1024) {
            return (size / g1024).toPrecision(3) + ' Tb';
        }
    },

    insertFile: function (name, size, type) {
        var $file = $('<div class="valid"></div>');
        $file.append($('<div class="file-name">' + name + '</div>'))
        $file.append($('<div class="file-size">' + this.humanReadableFileSize(size) + '</div>'))
        $file.append($('<div class="file-error"></div>'))

        this.$('.files').append($file);

        return $file;
    },

    initListenersAfterRender: function () {
        var _this = this;
        var $input = this.$('input[type="file"]')
        
        $input.change(function()
        {
            _this.$('.files').children().remove();

            _.each(this.files, function (file) {
                var name = file.name;
                var size = file.size;
                var type = file.type;

                var $file = _this.insertFile(name, size, type);
                
                // Validate fata
                if (size >= _this.maxsize) {
                    $file.removeClass('valid').addClass('invalid');
                    $file.find('.file-error').html('File is too big: maximum size is ' +
                        _this.humanReadableFileSize(_this.maxsize));
                    _this.error = true;
                    
                    if (this.invalidCallback !== undefined) {
                        _this.invalidCallback.call('size', size, this.maxsize);
                    }
                } else if (_this.filetypes.indexOf(type) == -1) {
                    // first check if mime is empty, in case resort to extensions
                    if (type === '') {
                        var ext = _.last(name.split('.'));
                        if (_this.exts.indexOf(ext) !== -1) {
                            // It's ok, the file extension match
                            return;
                        } 
                    }

                    $file.removeClass('valid').addClass('invalid');
                    $file.find('.file-error').html('Invalid file type: must be one of ' +
                        _this.filetypes.join(', '));
                    _this.error = true;

                    if (this.invalidCallback !== undefined) {
                        _this.invalidCallback.call('type', type, this.filetypes);
                    }
                }
            });
        });

        // simulate input click on button click
        this.$('button')
            .click(function(event)
        {
            event.preventDefault()
            $input.click();
        });

        // Ajax submit
        /*this.$el.parents('form').submit(function()
        {
            var formData = new FormData();

            $.ajax({
                url: $form.attr('action'),
                type: $form.attr('method'),
                // manually create xhr request
                xhr: function() {
                    var xhr = $.ajaxSettings.xhr();
                    if (xhr.upload) {
                        xhr.upload.addEventListener('progress',
                            progressHandlingFunction, false);
                    }
                    return xhr;
                },
                //Ajax events
                success: _this.success,
                error: _.error,
                // Form data
                data: formData,
                //Options to tell jQuery not to process data or worry about content-type.
                cache: false,
                contentType: false,
                processData: false
            });
        });*/
    },

    success: function () {
        
    },

    error: function () {
        
    },

    render: function (options) {
        AbstractView.prototype.render.call(this, _.extend({
            templateObj: {
                id: this.uid,
                name: this.name,
                multiple: this.multiple ? 'multiple' : '',
                accept: this.filetypes.join(',')
            }
        }, options));

        
        this.initListenersAfterRender();

        return this;
    }
});
