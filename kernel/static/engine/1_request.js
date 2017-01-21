function httpReq (options) {
    if (options.method === undefined) {
        options.method = 'GET';
    }

    this.xhr = new XMLHttpRequest();

    if (options.success)
        this.xhr.addEventListener("load", options.success);

    if (options.progress)
        this.xhr.addEventListener("load", options.progress);

    this.xhr.open(options.method, options.url);
    this.xhr.send();
}
