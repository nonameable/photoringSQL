/*jslint browser: true, indent: 4 */
/* global d3: false, $: false */

var utils = {};

utils.setGetParameter = function (paramName, paramValue)
{
    var url = window.location.href;
    if (url.indexOf(paramName + "=") >= 0)
    {
        var prefix = url.substring(0, url.indexOf(paramName));
        var suffix = url.substring(url.indexOf(paramName));
        suffix = suffix.substring(suffix.indexOf("=") + 1);
        suffix = (suffix.indexOf("&") >= 0) ? suffix.substring(suffix.indexOf("&")) : "";
        url = prefix + paramName + "=" + paramValue + suffix;
    }
    else
    {
    if (url.indexOf("?") < 0)
        url += "?" + paramName + "=" + paramValue;
    else
        url += "&" + paramName + "=" + paramValue;
    }
    window.history.pushState('treemap', 'FlickrTreeMap', url);
};


utils.getParameterByName = function (name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};

utils.joinData = function () {
    var set = d3.map([], function (d) { return d.id; });
    var adder = function (d) {
        set.set(d.id, d);
    };
    var argumentsArray = Array.prototype.slice.apply(arguments);
    argumentsArray.forEach(function (arg) {
        arg.forEach(adder);
    });
    return set.values();
};



//Taken from http://stackoverflow.com/questions/133925/javascript-post-request-like-a-form-submit
utils.post = function (path, params, method) {
    method = method || "post"; // Set method to post by default if not specified.

    // The rest of this code assumes you are not using a library.
    // It can be made less wordy if you use one.
    var form = document.createElement("form");
    form.setAttribute("method", method);
    form.setAttribute("action", path);

    for(var key in params) {
        if(params.hasOwnProperty(key)) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", params[key]);

            form.appendChild(hiddenField);
         }
    }

    document.body.appendChild(form);
    form.submit();
};