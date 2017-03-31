
//Set that holds the urls to be intercepted
var blockedSites = [];
var interceptCounter = 0;
var interceptDateList = [];
var localSettings = null; /* Settings WIP */


/* --------------- ------ update list of BlockedSites ------ ---------------*/

setLocalSettings = function(newSettings) {
    localSettings = newSettings;
    retrieveBlockedSites(replaceListener);
};

setLocalBlacklist = function(newList) {
    blockedSites = newList;
    replaceListener();
};

// This function receives the settings from the sync storage.
retrieveSettings = function(callback, param) {
    getStorageSettings(function(settingsObject) {
        localSettings = settingsObject;
        return callback(param);
    });
};

// This function receives the blacklist from the sync storage.
retrieveBlockedSites = function(callback){
    getStorageBlacklist(function(blacklist) {
        blockedSites = blacklist;
        return callback();
    });
};

//Loads the intercept time+date list from storage
retrieveInterceptDateList = function() {
    getInterceptDateList(function(dateList) {
        interceptDateList = dateList;
    });
};

//Loads the intercept counter from storage
retrieveInterceptCounter = function(callback) {
    getInterceptCounter(function(counter) {
        interceptCounter = counter;
        return callback();
    });
};

addToBlockedSites = function (newUrl, newUrlTitle) {
    url_formatter.getUrlWithoutServer(newUrl, newUrlTitle, function (url, title) {
        newItem = new BlockedSite(url, title);
        blockedSites.push(newItem);
        setStorageBlacklist(blockedSites);
        replaceListener();
    });
};

// This function adds the current time+date to the saved time+date list
addToInterceptDateList = function() {
    var newDate = new Date().toDateString();
    if (interceptDateList == null) {
        interceptDateList = [newDate];
    } else {
        interceptDateList.push(newDate);
    }
    setInterceptDateList(interceptDateList);
};

/* --------------- ------ Listener functions ------ ---------------*/

replaceListener = function() {
    removeWebRequestListener();
    var urlList = filterBlockedSitesOnChecked();
    if (localSettings.getState() == "On" && urlList.length > 0) {
        addWebRequestListener(urlList);
    }
};

filterBlockedSitesOnChecked = function() {
    if(blockedSites.length > 0) {
        return blockedSites.filter(function (a) {return a.checkboxVal == true;});
    }
    return [];
};

addWebRequestListener = function(urlList) {
    chrome.webRequest.onBeforeRequest.addListener(
        handleInterception
        ,{
            urls: urlList.map(function (a) {return a.url;})
            ,types: ["main_frame"]
        }
        ,["blocking"]
    );
};

removeWebRequestListener = function() {
    chrome.webRequest.onBeforeRequest.removeListener(handleInterception);
};

intercept = function(details) {
    incrementInterceptionCounter(details.url);
    addToInterceptDateList();
    setStorageOriginalDestination(details.url);
    return {redirectUrl: redirectLink};
};

handleInterception = function(details) {
    if (localSettings.getState() == "On") {
        return intercept(details);
    }
};

/* --------------- ------ ------------------ ------ ---------------*/

addSkipMessageListener = function() {
    chrome.runtime.onMessage.addListener(function(request, sender) {
        if (request.message == revertToOriginMessage) {
            localSettings.turnOffFor(localSettings.interceptionInterval);
            chrome.tabs.update(sender.tab.id, {url: request.destination});
        }
    });
};
