/*
 * format of every Url:
 * "scheme://prefix.domain:port/path/filename"
 *
 * scheme - defines the type of Internet service (most common is http or https)
 * prefix - defines a domain prefix (default for http is www)
 * domain - defines the Internet domain name (like w3schools.com)
 * port - defines the port number at the host (default for http is 80)
 * path - defines a path at the server (If omitted: the root directory of the site)
 * filename - defines the name of a document or resource
 *
 */
// use alert for warning popups
alert = chrome.extension.getBackgroundPage().alert;
var INVALID_URL_MESSAGE = "We unfortunately could not reach the site you are trying to block.\nAre you sure the url is correct? \n \n"

stripFinalSlash = function(url) {
    if (url[url.length - 1] == '/') {
        var ans = url.split("");
        ans.pop();
        url = ans.join("");
    }
    return url;
};

stripOfScheme = function(url) {
    var domain = url;
    if (url.indexOf("://") > -1) {
        domain = url.split('://')[1];
    }
    domain = stripFinalSlash(domain);
    return domain;
};

stripOfPort = function(url) {
    var result = [];
    if (url.indexOf(":") > -1) {
        var splitted = url.split(':');
        result.push(splitted[0]);
        splitted.shift();
        splitted = splitted[0].split('/');
        splitted.shift();
        splitted = splitted.join('/');
        result.push('/' + splitted + '/');
        url = result.join("");
    }
    url = stripFinalSlash(url);
    return url;
};

stripOfFileName = function(url) {
    if (url.indexOf("/") > -1) {
        var result = url.split("").reverse().join("");
        result = result.split(['/']);
        var stripped = [];
        for(var i = 1; i < result.length; i++) {
            stripped.push('/');
            stripped.push(result[i]);
        }
        stripped = stripped.join("").split("").reverse().join("");
        stripped = stripFinalSlash(stripped);
        return stripped;
    } else {
        url = stripFinalSlash(url);
        return url;
    }
};


getFullDomain = function(url) {
    if (url.indexOf("/") > -1) {
        return url.split("/")[0];
    } else {
        return url;
    }
};

stripOfAll = function(url) {
    url = stripOfScheme(url);
    url = stripFinalSlash(url);
    url = stripOfPort(url);
    url = stripOfFileName(url);
    url = stripFinalSlash(url);
    return [url, getFullDomain(url)];
};

formatForGetRequest = function(url) {
    var strippedUrl = stripOfAll(url);
    return "http://" + strippedUrl[0];
};

httpGetAsync = function(theUrl, callback, error) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", theUrl, true); // true for asynchronous
    xmlHttp.onreadystatechange = function () {
        // on succesful request, return responseURL
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            // simple regex to extract data from title tags, ignoring newlines, tabs and returns
            var titleTags = (/<title.*?>(?:[\t\n\r]*)(.*?)(?:[\t\n\r]*)<\/title>/m).exec(xmlHttp.responseText);
            if (titleTags != null) {
                var title = titleTags[1];
                callback(xmlHttp.responseURL, title);
            } else {
                callback(xmlHttp.responseURL, theUrl);
            }
        } else if (xmlHttp.status != 200) {
            error(xmlHttp.status);
        }

    };
    xmlHttp.onerror = function () {
        error(xmlHttp.status);
    };
    xmlHttp.send(null);
};

submitUrl = function(url, callback) {
    var getUrl = formatForGetRequest(url);
    httpGetAsync(
        getUrl, 
        function (url, title) {
            callback(url, title)
        },
        function (status) { // error callback
            switch (status) {
                case 404:
                    alert(INVALID_URL_MESSAGE +'File not found');
                    break;
                case 500:
                    alert(INVALID_URL_MESSAGE + 'Server error');
                    break;
                case 0:
                    alert(INVALID_URL_MESSAGE + 'Request aborted');
                    break;
                default:
                    alert(INVALID_URL_MESSAGE + 'Unknown error ' + status);
            }
        }
    );
};
