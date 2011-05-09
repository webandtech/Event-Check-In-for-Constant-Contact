/*
 * Event Check-In for Constant Contact
 * Created by Aaron Severs on Apr 26 2011
 * Copyright 2011, Constant Contact <asevers at constantcontact dot com>
 * MIT licensed
 *
 * controllers.js: Business logic - interfaces with Ext.CTCT SDK
 *
 */

//get a list of events and show it
function refreshEventsList() {
    var mainPanel = Ext.getCmp('mainPanel');
    var eventsListStore = Ext.StoreMgr.lookup('eventsListStore');
    mainPanel.setLoading(true,false);
    eventsListStore.removeAll(); //clear the current store of events
    var makeRequest = function(page) {
        Ext.CTCT.Events.list(function(response) { // MAGIC!!!
            if (response.success) {
                var length = response.events.length;
                //put the returned events in the store
                for (var a = 0; a < length; a++) {
                    eventsListStore.add(response.events[a]);
                }
                if (response.morePages == false || eventsListStore.getCount() >= 500) {
                    var eventsList = Ext.getCmp('eventsList');
                    eventsListStore.filter();
                    if (eventsList.store.getCount() != 0) {
                        mainPanel.setActiveItem(Ext.getCmp('eventsListPanel'));
                        eventsList.doComponentLayout();
                        eventsList.plugins[0].lastUpdated = new Date();
                        eventsList.plugins[0].updatedEl.setHTML(Ext.util.Format.date(eventsList.plugins[0].lastUpdated,"m/d/Y h:iA"));
                        if (eventsListStore.getCount() >= 500) {
                            Ext.Msg.alert('Woah!', 'You\'ve got a lot of events... we\'ll load the first 500.<br/><br/><br/>');
                        }
                    }
                    else {
                        Ext.Msg.alert('No Events', 'This account does not have any events ready for check-in. Check back on the day of your event!<br/><br/>');
                    }
                    mainPanel.setLoading(false);
                }
                else {
                    makeRequest(++page);
                }
            }
            else {genericfailuremessage(response.httpStatusCode);}
        },page);
    }
    makeRequest(1);
}

//gets a list of registrants for an event and shows them this list
function refreshRegistrantList(eventId) {
    var mainPanel = Ext.getCmp('mainPanel');
    var eventsRegistrantsStore = Ext.StoreMgr.lookup('eventsRegistrantsStore');
    mainPanel.setLoading(true,false);
    eventsRegistrantsStore.removeAll(); //clear the current store of items
    var makeRequest = function(page) {
        Ext.CTCT.Events.registrants(eventId,function(response) { // MAGIC!!!
            if (response.success) {
                var length = response.registrants.length;
                //put the returned items in the store
                for (var a = 0; a < length; a++) {
                    eventsRegistrantsStore.add(response.registrants[a]);
                }
                if (response.morePages == false || eventsRegistrantsStore.getCount() >= 1000) {
                    if (eventsRegistrantsStore.getCount() != 0) {
                        eventsRegistrantsStore.sort();
                        mainPanel.setActiveItem(Ext.getCmp('eventRegistrantsListPanel'));
                        Ext.getCmp('registrantSearchField').setValue('');
                        //force the listview to rebuild itself with the new data
                        var eventRegistrantList = Ext.getCmp('eventRegistrantList');
                        eventRegistrantList.doComponentLayout();
                        eventRegistrantList.plugins[0].lastUpdated = new Date();
                        eventRegistrantList.plugins[0].updatedEl.setHTML(Ext.util.Format.date(eventRegistrantList.plugins[0].lastUpdated,"m/d/Y h:iA"));
                        if (eventsRegistrantsStore.getCount() >= 1000) {
                            Ext.Msg.alert('Woah!', 'You\'ve got a lot of registrants... we\'ll load the first 1000.<br/><br/><br/>');
                        }
                    }
                    else {
                        Ext.Msg.alert('No Registrants', 'This event does not have any registrants.<br/><br/><br/>');
                        Ext.getCmp('eventsList').deselect(Ext.StoreMgr.lookup('eventsListStore').findRecord('id',eventId));
                    }
                    mainPanel.setLoading(false);
                }
                else {
                    makeRequest(++page);
                }
            }
            else {genericfailuremessage(response.httpStatusCode);}
        },page);
    }
    makeRequest(1);
}

//change the registrant status to ATTENDED or NOT ATTENDED
function updateRegistrantAttendanceStatus(registrantId,newStatus) {
    var mainPanel = Ext.getCmp('mainPanel');
    var eventsRegistrantsStore = Ext.StoreMgr.lookup('eventsRegistrantsStore');
    var registrantDetails = Ext.getCmp('registrantDetails');
    var eventRegistrantList = Ext.getCmp('eventRegistrantList');
    var registrant = eventsRegistrantsStore.findRecord('id',registrantId);
    var registrantIndex = eventsRegistrantsStore.findExact('id',registrantId);
    //hide the registrant details modal
    registrantDetails.hide();
    mainPanel.setLoading(true,false);
    var makeRequest = function(eventId,registrantId,newStatus) {
        Ext.CTCT.Events.setAttendanceStatus(eventId,registrantId,newStatus,function(response) { // MAGIC!!!
            if (response.success) {
                mainPanel.setLoading(false);
                eventRegistrantList.deselect(registrant);
                eventsRegistrantsStore.removeAt(registrantIndex);
                registrant.data.registrationStatus = newStatus;
                eventsRegistrantsStore.insert(registrantIndex,registrant);
                if (newStatus == 'ATTENDED') {
                    Ext.Msg.alert('Done!', 'You\'ve checked off ' + registrant.data.firstName + ' ' + registrant.data.lastName + ' as attended.<br/><br/><br/>', Ext.EmptyFn);
                }
                else {
                    Ext.Msg.alert('All Set!', 'You\'ve switched ' + registrant.data.firstName + ' ' + registrant.data.lastName + '\'s status to "Not Attended".<br/><br/><br/>', Ext.EmptyFn);
                }
            }
            else {genericfailuremessage(response.httpStatusCode);}
        });
    }
    makeRequest(registrant.data.eventId,registrantId,newStatus);
}

//display the event details overlay
function getEventDetails(index) {
    var eventDetails = Ext.getCmp('eventDetails');
    var record = Ext.StoreMgr.lookup('eventsListStore').getAt(index);
    if (record.data.status == 'ACTIVE') {
        record.data.status = 'Published';
    }
    else {
        record.data.status = record.data.status.toLowerCase().charAt(0).toUpperCase() + record.data.status.toLowerCase().slice(1);
    }

    var startTime = new Date(record.data.startDate);
    var hour   = startTime.getHours();
    var minute = startTime.getMinutes();
    var second = startTime.getSeconds();
    var ap = "AM";
    if (hour   > 11) {ap = "PM";}
    if (hour   > 12) {hour = hour - 12;}
    if (hour   == 0) {hour = 12;}
    if (hour   < 10) {hour   = "0" + hour;}
    if (minute < 10) {minute = "0" + minute;}
    if (second < 10) {second = "0" + second;}
    var timeString = hour +
                    ':' +
                    minute +
                    ':' +
                    second +
                    " " +
                    ap;
    record.data.startTime = timeString;
    record.data.startDate = getShortDisplayDate(record.data.startDate);
    record.data.location = record.data.eventLocation.location;
    eventDetails.load(record);
    eventDetails.show();
}

//display the registrant details overlay
function getRegistrantDetails(index) {
    var registrantDetails = Ext.getCmp('registrantDetails');
    var registrantActionButton = Ext.getCmp('registrantActionButton');
    var registrantRedActionButton = Ext.getCmp('registrantRedActionButton');
    var record = Ext.StoreMgr.lookup('eventsRegistrantsStore').getAt(index);
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    record.data.registrationStatus = capitalizeFirstLetter(record.data.registrationStatus.toLowerCase());
    record.data.paymentStatus = capitalizeFirstLetter(record.data.paymentStatus.toLowerCase());
    //a couple of changes to make things display better
    if (record.data.registrationStatus == 'Not_attended') {
        record.data.registrationStatus = 'Not Attended';
    }
    if (record.data.paymentStatus == 'Na') {
        record.data.paymentStatus = 'Not Applicable';
    }
    registrantDetails.load(record);
    if (record.data.registrationStatus == 'Attended') {
        registrantRedActionButton.show();
        registrantActionButton.hide();
    }
    else {
        registrantRedActionButton.hide();
        registrantActionButton.show();
    }
    registrantDetails.show();
    var emailField = Ext.getCmp('emailField');
    Ext.get('emailField').removeAllListeners();
    Ext.get('emailField').on('tap',function() {
        if (Ext.is.iOS) {
            window.plugins.emailComposer.showEmailComposer(undefined,undefined,emailField.getValue());
        }
        else {
            window.open("mailto:" + emailField.getValue());
        }
    });
}

//just return a substring of a possibly long string (useful for displaying event names)
function getNameSubString(name) {
    if (name.length <= 65) {
        return name;
    }
    else {
        return name.substring(0,65) + "...";
    }
}

//a function to get today's date, formatted for use in our web services
function getTodayDate() {
    var today = new Date();
    var month = today.getMonth() + 1;
    var dayofmonth = today.getDate();
    var year = today.getFullYear();
    return year + '-' + month + '-' + dayofmonth;
}

//A function to get nice human readable dates for event startDate
function getDisplayDate(milliseconds) {
    var months = ['January','February','March','April','May','June','July',
    'August','September','October','November','December'];
    var days = ['Sunday','Monday','Tuesday','Wednesday',
    'Thursday','Friday','Saturday'];
    var date = new Date(milliseconds);
    var month = months[date.getMonth()];
    var dayofmonth = date.getDate();
    var day = days[date.getDay()];
    var year = date.getFullYear();
    return day + ', ' + month + ' ' + dayofmonth + ' ' + year;
}

function getShortDisplayDate(milliseconds) {
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul',
    'Aug','Sep','Oct','Nov','Dec'];
    var days = ['Sun','Mon','Tue','Wed',
    'Thu','Fri','Sat'];
    var date = new Date(milliseconds);
    var month = months[date.getMonth()];
    var dayofmonth = date.getDate();
    var day = days[date.getDay()];
    var year = date.getFullYear();
    return day + ', ' + month + ' ' + dayofmonth + ' ' + year;
}

//the log out function called after the user confirms they want to log out
function finishLogOut(confirm) {
    if (confirm == 'yes') {
        var loginPanel = Ext.getCmp('loginPanel');
        var mainPanel = Ext.getCmp('mainPanel');
        // clear any stored credentials in the Ext.CTCT SDK
        Ext.CTCT.logout();
        mainPanel.setActiveItem(loginPanel);
    }
}

//when they click the logout button, show a confirmation dialog
function doLogout() {
    Ext.Msg.confirm("Logout", "Are you sure?<br/><br/><br/><br/>", finishLogOut);
}

//error handling. Determines an error message to show based on the status code passed back by the Ext.CTCT SDK callbacks
function genericfailuremessage(statusCode) {
    var mainPanel = Ext.getCmp('mainPanel');
    var loginPanel = Ext.getCmp('loginPanel');
    mainPanel.setLoading(false);
    loginPanel.setLoading(false);
    // if the server reported a status 401, we know the user's credentials are bad so we take them back to the login screen'
    if (statusCode == 401) {
        Ext.Msg.alert('Login Failed', 'Check your Constant Contact User Name and Password.<br/><br/><br/>');
        // clear any stored credentials in the Ext.CTCT SDK
        Ext.CTCT.logout();
        // show the login screen
        mainPanel.setActiveItem(loginPanel);
    } 
    else {
        // 400 is probably due to an event that hasn't started yet
        if (statusCode == 400) {
            Ext.Msg.alert('Event Not Started', 'We\'ll see you back soon!<br/><br/><br/><br/>');
        }
        else {
            // 0 is probably due to a lack of internet connection on the device
            if (statusCode == 0 || statusCode == 408) {
                if (mainPanel.getActiveItem() == loginPanel) {
                    Ext.Msg.alert('Login Failed', 'Check your Constant Contact User Name and Password.<br/><br/><br/>'); //Android has http status code issues
                }
                else {
                    Ext.Msg.alert('Unable to Connect', 'Either you\'re offline... or we are. Please try again.<br/><br/><br/>');
                }
            }
            // catch any others
            else {
                Ext.Msg.alert('Yikes!', 'An error occurred. Please refresh and try again.<br/><br/><br/>');
            }
        }
    }
}