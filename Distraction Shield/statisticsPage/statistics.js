import BlacklistStatsTable from './classes/BlacklistStatsTable'
import ExerciseTimeTable from './classes/ExerciseTimeTable'
import TotalTimeTable from './classes/TotalTimeTable'
import InterceptionCounterTable from './classes/InterceptionCounterTable'
import BlockedSiteList from '../classes/BlockedSiteList.js'
import * as storage from '../modules/storage/storage'
import * as interception from '../modules/statistics/interception'
import {tds_blacklist, tds_interceptDateList, tds_exerciseTime, tds_totalTime} from '../constants'
import StorageListener from "../modules/storage/StorageListener"

/**
 * This file contains the code and functions which control the statistics page.
 * Data is retrieved from the storage, and is passed to various tables.
 * @mixin statisticsPage
 */

let interceptionCounterTable = null;
let blacklistTable = null;
let exerciseTimeTable = null;
let totalTimeTable = null;

/**
 * initial function that is fired when the page is loaded.
 * @memberOf statisticsPage
 */
document.addEventListener("DOMContentLoaded", function () {
    connectHtmlFunctionality();
    initStatisticsPage();
});

/**
 * Initialize HTML elements and set the data in the tables. Retrieves the data from the storage using Promises.
 * Waits until all data is retrieved, and then populates the interceptionCounterTable, the blacklistTable and the
 * exerciseTimeTable.
 * @memberOf statisticsPage
 */
function initStatisticsPage() {
    Promise.all([storage.getInterceptDateList(), storage.getExerciseTimeList(), storage.getBlacklistPromise(), storage.getTotalTimeList()])
        .then(function (response) {
            let interceptDateList = response[0].tds_interceptDateList;
            let blockedSiteList = response[2];
            let exerciseTime = response[1];
            let totalTime = response[3];

            setInterceptionCounterTable(interceptDateList);
            blacklistTable.render(blockedSiteList);
            exerciseTimeTable.render(exerciseTime);
            totalTimeTable.render(totalTime);
        });
}
/**
 * @param interceptDateList
 * @memberOf statisticsPage
 */
function setInterceptionCounterTable(interceptDateList){
    let counters = interception.calcInterceptData(interceptDateList);
    interceptionCounterTable.render(counters);
}

/**
 * Connects HTML functionality to javascript classes
 * @memberOf statisticsPage
 */
function connectHtmlFunctionality() {
    interceptionCounterTable = new InterceptionCounterTable();
    blacklistTable = new BlacklistStatsTable($('#interceptTable'));
    exerciseTimeTable = new ExerciseTimeTable($('#exerciseTime'));
    totalTimeTable = new TotalTimeTable($('#totalTime'));
}

/**
 * Storage Listener
 * @type {StorageListener}
 * @method onStorageChange
 * @memberOf statisticsPage
 */
new StorageListener((changes) => {
    if (tds_blacklist in changes) {
        let newBlockedSiteList = BlockedSiteList.deserializeBlockedSiteList(changes[tds_blacklist].newValue);
        blacklistTable.render(newBlockedSiteList);
    }
    if (tds_exerciseTime in changes) {
        let newExerciseTime = changes[tds_exerciseTime].newValue;
        exerciseTimeTable.render(newExerciseTime);
    }
    if (tds_interceptDateList in changes) {
        let newInterceptDateList = changes[tds_interceptDateList].newValue;
        setInterceptionCounterTable(newInterceptDateList);
    }

    if (tds_totalTime in changes) {
        let newTotalTime = changes[tds_totalTime].newValue;
        totalTimeTable.render(newTotalTime);
    }
});
