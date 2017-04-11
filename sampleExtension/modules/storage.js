
//Check for a runtime error
handleRuntimeError = function() {
    if (chrome.runtime.error) {
        console.log("Runtime error.\n" + chrome.runtime.error);
        return false;
    }
    return true;
};

function SyncStorage() {
    var self = this;

    /* ---------------- TDS_Storage --------------- */
    this.getAll = function(callback) {
        self.getStorage(null).then(function(output) {
            output.tds_settings = deserializeSettings(output.tds_settings);
            output.tds_blacklist = deserializeBlockedSiteList(output.tds_blacklist);
            return callback(output);
        });
    };

    /* ---------------- Blacklist --------------- */

    this.getBlacklist = function(callback) {
        self.getStorage("tds_blacklist").then(function(output) {
            output.tds_blacklist = deserializeBlockedSiteList(output.tds_blacklist);
            return callback(output.tds_blacklist);
        });
    };

    this.setBlacklist = function(blockedSiteList) {
        var serializedList = serializeBlockedSiteList(blockedSiteList);
        self.setStorage("tds_blacklist", serializedList);
    };

    /* ---------------- Settings Object --------------- */

    this.getSettings = function(callback) {
        self.getStorage("tds_settings").then(function(output) {
            var deserializedSettings = deserializeSettings(output.tds_settings);
            return callback(deserializedSettings);
        });
    };

    this.setSettings = function(settingsObject) {
        self.setStorage("tds_settings", serializeSettings(settingsObject));
    };

    this.setSettingsWithCallback = function(settingsObject, callback) {
        var serializedSettings = serializeSettings(settingsObject);
        self.setStorage("tds_settings", serializedSettings).then(function(){
            return callback()
        });
    };

    this.getMode = function(callback) {
        this.getSettings(function(settings) {
            callback(settings.getMode());
        });
    };

    /* ---------------- Interception Counter --------------- */

    this.getInterceptCounter = function() {
        return self.getStorage("tds_interceptCounter");
    };

    this.setInterceptionCounter = function(number) {
        return self.setStorage("tds_interceptCounter", number);
    };

    /* ---------------- Statistics --------------- */

    this.getInterceptDateList = function(){
        return self.getStorage("tds_interceptDateList");
    };

    this.setInterceptDateList = function(dateList) {
        return self.setStorage("tds_interceptDateList", dateList);
    };

    // Set the list dict containing information about how much time is spent on exercises each previous day.
    this.setDayStatisticsList = function(statList){
        return self.setStorage("tds_dayStatistics", statList);
    };

    // Get the list containing information about how much time is spent on exercises each previous day.
    this.getDayStatisticsList = function(){
        return self.getStorage(["tds_dayStatistics"]);
    };

    // Set the data dict containing information about how much time is spent on exercises today.
    this.setCurrentDayStatistic = function(dayStats){
        return self.setStorage("tds_currentDayStatistic", dayStats);
    };

    // Get the data dict containing information about how much time is spent on exercises today.
    this.getCurrentDayStatistic = function(){
        return self.getStorage(["tds_currentDayStatistic"]);
    };


    /* ---------------- General methods --------------- */

    // General function which is used to set items stored in the storage of the chrome api.
    this.setStorage = function(ind, data) {
        return new Promise(function(resolve, reject){
            var newObj= {};
            newObj[ind] = data;
            chrome.storage.sync.set(newObj, function() {
                if(handleRuntimeError()){
                    resolve();
                } else {
                    reject(Error("Data cannot be set."));
                }
            })
        });
    };

    // General function which is used to retrieve items stored in the storage of the chrome api.
    // This function returns a Promise, to account for possible delays which might exist between the requesting of
    // the things in the storage and the actual retrieving of it.
    this.getStorage = function(index){
        return new Promise(function (resolve, reject) {
            chrome.storage.sync.get(index, function (output) {
                if (handleRuntimeError()) {
                    resolve(output);
                } else {
                    reject(Error("Data cannot be found."));
                }
            })
        });
    };
}

//Fancy string comparison with wildcards
wildcardStrComp = function(str, rule) {
    return new RegExp("^" + rule.split("*").join(".*") + "$").test(str);
};

var storage = new SyncStorage();