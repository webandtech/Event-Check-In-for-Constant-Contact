/* 
 * BEGINNINGS OF the Ext.CTCT SDK for Constant Contact
 * Tested with Sencha Touch for mobile development
 * Created by Aaron Severs on Apr 26 2011
 * Copyright 2011, Constant Contact <asevers at constantcontact dot com>
 * MIT licensed
 *
 * IMPORTANT: Be sure to load this file after you load Sencha Touch
 *
 */

Ext.CTCT = {

    /* Ext.CTCT.init:
     * Initialize the Ext.CTCT SDK. Do this before anything else.
     * @param apiServer {String} the Constant Contact api server location (optional - defaults to https://api.constantcontact.com
     * @param apiKey {String} your developer key for Constant Contact. Visit http://developer.constantcontact.com to get one.
     *
     * @returns {String} Constant Contact username if saved user credentials exist (so you can skip your login form, for instance)
     * or
     * {Boolean} false if no saved user credentials exist
     */

    init: function(apiServer, apiKey) {
        if (apiServer != undefined) {
            Ext.CTCT.apiServer = apiServer;
        }
        else {
            Ext.CTCT.apiServer = 'https://api.constantcontact.com';
        }
        Ext.CTCT.apiKey = apiKey;
        Ext.CTCT.auth = localStorage.getItem("CTCT.auth");
        Ext.CTCT.username = localStorage.getItem("CTCT.username");
        if (Ext.CTCT.auth != undefined) {
            return Ext.CTCT.username;
        }
        else {
            return false;
        }
    },

    /* Ext.CTCT.login:
     * Builds and stores the basic auth string needed to use Constant Contact web services.
     * @param username {String}
     * @param password {String}
     * @param callback {Function/callback} (optional)
     */

    login: function(username,password,callback) {
            function make_basic_auth(u,p) {
                var tok = u + ':' + p;
                var hash = Ext.CTCT.Base64.encode(tok);
                return "Basic " + hash;
            }
            Ext.CTCT.auth = make_basic_auth(Ext.CTCT.apiKey + '%' + username,password);
            Ext.CTCT.username = username;
            localStorage.setItem("CTCT.auth", Ext.CTCT.auth);
            localStorage.setItem("CTCT.username", Ext.CTCT.username);
        if (callback != undefined) {
            callback();
        }
    },
    
    /* Ext.CTCT.logout:
     * Removes any stored credentials from localStorage
     */

    logout: function() {
        localStorage.removeItem("CTCT.auth");
        localStorage.removeItem("CTCT.username");
        Ext.CTCT.auth = undefined;
        Ext.CTCT.username = undefined;
    },

    Events: { //Event Marketing APIs

    /* Ext.CTCT.Events.list:
     * Gets a list of events
     * @param callback {Function} - @param eventsList {Object} is returned to callback function
     * @param page {Integer} (optional) if passed in, will get this page of events from the web service
     *
     * eventsList {Object} passed to callback:
     * {
     *  success: true,
     *  httpStatusCode: 200,
     *  morePages: false
     *  events: {[
     *      {
     *          id: '',
     *          name: '',
     *          description: '',
     *          title: '',
     *          registered: 0,
     *          createdDate: 1303862128420,
     *          status: '',
     *          eventType: '',
     *          eventLocation: {
     *              location: '',
     *              address1: '',
     *              address2: '',
     *              address3: '',
     *              city: '',
     *              state: '',
     *              country: '',
     *              postalCode: ''
     *          },
     *          registrationUrl: '',
     *          startDate: 1303862128420,
     *          endDate: 1303862128420,
     *          publishDate: 1303862128420,
     *          attendedCount: 0,
     *          cancelledCount: 0,
     *      }
     *  ]}
     * }
     *
    */
        list: function(callback,page) {
            // make the AJAX request
            if (page != undefined) {
                var serviceUrl = Ext.CTCT.apiServer + '/ws/customers/' + Ext.CTCT.username + '/events?pageNumber=' + page;
            }
            else {
                var serviceUrl = Ext.CTCT.apiServer + '/ws/customers/' + Ext.CTCT.username + '/events';
            }
            var thisRequest = Ext.Ajax.request({
                callbackFn: callback,
                url: serviceUrl,
                method: 'GET',
                headers: {
                    Authorization: Ext.CTCT.auth
                },
                success: function(response) {
                    var nextEl = Ext.DomQuery.selectNode('link[rel=next]', response.responseXML);
                    //use temporary datastores to hold all the info
                    var aStore = new Ext.data.Store({
                        autoLoad: true,
                        fields: ['id'],
                        data: response,
                        proxy: {
                            type: 'memory',
                            reader: {
                                type: 'xml',
                                record: 'entry'
                            }
                        }
                    });
                    var bStore = new Ext.data.Store({
                        autoLoad: true,
                        fields: [
                            'Name','Description','Title','Registered','CreatedDate','Status',
                            'EventType','RegistrationURL','StartDate','EndDate','PublishDate','AttendedCount',
                            'CancelledCount'
                        ],
                        data: response,
                        proxy: {
                            type: 'memory',
                            reader: {
                                type: 'xml',
                                record: 'Event'
                            }
                        }
                    });
                    var cStore = new Ext.data.Store({
                        autoLoad: true,
                        fields: [
                            'Location','Address1','Address2','Address3','City','State',
                            'Country','PostalCode'
                        ],
                        data: response,
                        proxy: {
                            type: 'memory',
                            reader: {
                                type: 'xml',
                                record: 'EventLocation'
                            }
                        }
                    });

                    var eventsArray = []; //The array we're building of all events
                    var length = aStore.getCount();
                    for (var a = 0; a < length; a++) {
                        var event = {};
                        var eventDetails = bStore.getAt(a).data;
                        var eventLocation = cStore.getAt(a).data;
                        event.id = aStore.getAt(a).data.id.match(/[^/]+$/).toString();
                        event.name = eventDetails.Name;
                        event.description = eventDetails.Description;
                        event.title = eventDetails.Title;
                        event.registered = eventDetails.Registered;
                        event.createdDate = new Date().setISO8601(eventDetails.CreatedDate).getTime();
                        event.status = eventDetails.Status;
                        event.eventType = eventDetails.EventType;
                        event.eventLocation = {
                            location: eventLocation.Location,
                            address1: eventLocation.Address1,
                            address2: eventLocation.Address2,
                            address3: eventLocation.Address3,
                            city: eventLocation.City,
                            state: eventLocation.State,
                            country: eventLocation.Country,
                            postalCode: eventLocation.PostalCode
                        }
                        event.registrationUrl = eventDetails.RegistrationURL;
                        event.startDate = new Date().setISO8601(eventDetails.StartDate).getTime();
                        event.endDate = new Date().setISO8601(eventDetails.EndDate).getTime();
                        event.publishDate = new Date().setISO8601(eventDetails.PublishDate).getTime();
                        event.attendedCount = eventDetails.AttendedCount;
                        event.cancelledCount = eventDetails.CancelledCount;
                        eventsArray.push(event);
                    }
                    // to call when done. Returns response object.
                    var finish = function(callback) {
                        var eventsList = {
                            success: true,
                            httpStatusCode: 200,
                            events: eventsArray
                        }
                        if (nextEl != null) {
                            eventsList.morePages = true;
                        }
                        else {
                            eventsList.morePages = false;
                        }
                        callback(eventsList);
                    }
                    //cleanup
                    aStore.destroy();
                    bStore.destroy();
                    cStore.destroy();
                    //we're done!
                    finish(callback);
                },
                failure: function (failurestate) {
                    var eventsList = {
                        success: false,
                        httpStatusCode: failurestate.status,
                        events: [],
                        morePages: false
                    }
                    failurestate.request.options.callbackFn(eventsList);
                }
            });
            //timeout after 30 seconds (sort of hack to guard against http auth hanging)
            var failureOnTimeout = function(callback) {
                if (Ext.Ajax.isLoading(thisRequest) == true) {
                    var eventsList = {
                        success: false,
                        httpStatusCode: 401,
                        events: [],
                        morePages: false
                    }
                    callback(eventsList);
                    Ext.Ajax.abort(thisRequest);
                }
            }
            setTimeout(function() {failureOnTimeout(callback);},15000);
        },

     /* Ext.CTCT.Events.registrants:
     * Gets a list of registrants for an event
     * @param eventId {String} event id as identified in events list
     * @param callback {Function} - @param registrantList {Object} is returned to callback function
     * @param page {Integer} (optional) if passed in, will get this page of registrants from the web service
     *
     * registrantList {Object} passed to callback:
     * {
     *  success: true,
     *  httpStatusCode: 200,
     *  morePages: false
     *  registrants: {[
     *      {
     *          id: '',
     *          lastName: '',
     *          firstName: '',
     *          emailAddress: '',
     *          registrationStatus: '',
     *          registrationDate: 1303862128420,
     *          guestCount: 0,
     *          paymentStatus: '',
     *          eventId: ''
     *      }
     *  ]}
     * }
     *
    */
        registrants: function(eventId,callback,page) {
            // make the AJAX request
            if (page != undefined) {
                var serviceUrl = Ext.CTCT.apiServer + '/ws/customers/' + Ext.CTCT.username + '/events/' + eventId + '/registrants/?pageNumber=' + page;
            }
            else {
                var serviceUrl = Ext.CTCT.apiServer + '/ws/customers/' + Ext.CTCT.username + '/events/' + eventId + '/registrants';
            }
            var thisRequest = Ext.Ajax.request({
                callbackFn: callback,
                url: serviceUrl,
                method: 'GET',
                headers: {
                    Authorization: Ext.CTCT.auth
                },
                success: function(response) {
                    var nextEl = Ext.DomQuery.selectNode('link[rel=next]', response.responseXML);
                    //use temporary datastores to hold all the info
                    var aStore = new Ext.data.Store({
                        autoLoad: true,
                        fields: ['id'],
                        data: response,
                        proxy: {
                            type: 'memory',
                            reader: {
                                type: 'xml',
                                record: 'entry'
                            }
                        }
                    });
                    var bStore = new Ext.data.Store({
                        autoLoad: true,
                        fields: ['LastName','FirstName','EmailAddress','RegistrationStatus','RegistrationDate','GuestCount','PaymentStatus'],
                        data: response,
                        proxy: {
                            type: 'memory',
                            reader: {
                                type: 'xml',
                                record: 'Registrant'
                            }
                        }
                    });

                    var registrantsArray = []; //The array we're building of all items
                    var length = aStore.getCount();
                    for (var a = 0; a < length; a++) {
                        var registrant = {};
                        var registrantDetails = bStore.getAt(a).data;
                        registrant.id = aStore.getAt(a).data.id.match(/[^/]+$/).toString();
                        registrant.lastName = registrantDetails.LastName;
                        registrant.firstName = registrantDetails.FirstName;
                        registrant.emailAddress = registrantDetails.EmailAddress;
                        registrant.registrationStatus = registrantDetails.RegistrationStatus;
                        registrant.registrationDate = new Date().setISO8601(registrantDetails.RegistrationDate).getTime();
                        registrant.guestCount = registrantDetails.GuestCount;
                        registrant.paymentStatus = registrantDetails.PaymentStatus;
                        registrant.eventId = eventId;
                        registrantsArray.push(registrant);
                    }
                    // to call when done. Returns response object.
                    var finish = function(callback) {
                        var registrantList = {
                            success: true,
                            httpStatusCode: 200,
                            registrants: registrantsArray
                        }
                        if (nextEl != null) {
                            registrantList.morePages = true;
                        }
                        else {
                            registrantList.morePages = false;
                        }
                        callback(registrantList);
                    }
                    //cleanup
                    aStore.destroy();
                    bStore.destroy();
                    //we're done!
                    finish(callback);
                },
                failure: function (failurestate) {
                    var registrantList = {
                        success: false,
                        httpStatusCode: failurestate.status,
                        registrants: [],
                        morePages: false
                    }
                    failurestate.request.options.callbackFn(registrantList);
                }
            });
            //timeout after 30 seconds (sort of hack to guard against http auth hanging)
            var failureOnTimeout = function(callback) {
                if (Ext.Ajax.isLoading(thisRequest) == true) {
                    var registrantList = {
                        success: false,
                        httpStatusCode: 401,
                        registrants: [],
                        morePages: false
                    }
                    callback(registrantList);
                    Ext.Ajax.abort(thisRequest);
                }
            }
            setTimeout(function() {failureOnTimeout(callback);},15000);
        },

    /* Ext.CTCT.Events.setAttendanceStatus:
     * Sets the attendance status of an event registrant
     * @param eventId {String} event id as identified in the events list
     * @param registrantId {String} registrant id as identified in registrant list
     * @param status {String} either 'ATTENDED' or 'NOT_ATTENDED'
     * @param callback {Function} - @param responseStatus {Object} is returned to callback function
     *
     * responseStatus {Object} passed to callback:
     * {
     *  success: true,
     *  httpStatusCode: 200
     * }
     *
    */
        setAttendanceStatus: function(eventId,registrantId,status,callback) {
            // make the AJAX request
            var serviceUrl = Ext.CTCT.apiServer + '/ws/customers/' + Ext.CTCT.username + '/events/' + eventId + '/registrants/' + registrantId + '/attendancestatus';
            var xmlModel = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n\
                <atom:entry xmlns:atom="http://www.w3.org/2005/Atom">\n\
                    <atom:content>\n\
                        <AttendanceStatus>\n\
                            <Status>'+ status + '</Status>\n\
                            <Type>GROUP</Type>\n\
                        </AttendanceStatus>\n\
                    </atom:content>\n\
                </atom:entry>';
            var thisRequest = Ext.Ajax.request({
                callbackFn: callback,
                defaultHeaders: false,
                url: serviceUrl,
                xmlData: xmlModel,
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/atom+xml;type=entry',
                    Authorization: Ext.CTCT.auth
                },
                success: function(response) {
                    var finish = function(callback) {
                        var responseStatus = {
                            success: true,
                            httpStatusCode: 200
                        }
                        callback(responseStatus);
                    }
                    finish(callback);
                },
                failure: function (failurestate) {
                    var responseStatus = {
                        success: false,
                        httpStatusCode: failurestate.status
                    }
                    failurestate.request.options.callbackFn(responseStatus);
                }
            });
            //timeout after 30 seconds (sort of hack to guard against http auth hanging)
            var failureOnTimeout = function(callback) {
                if (Ext.Ajax.isLoading(thisRequest) == true) {
                    var responseStatus = {
                        success: false,
                        httpStatusCode: 401
                    }
                    callback(responseStatus);
                    Ext.Ajax.abort(thisRequest);
                }
            }
            setTimeout(function() {failureOnTimeout(callback);},15000);
        }
    }
};

/**
*
*  Base64 encode / decode
*  http://www.webtoolkit.info/
*
**/

Ext.CTCT.Base64 = {

    // private property
    _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

    // public method for encoding
    encode : function (input) {
            var output = "";
            var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
            var i = 0;

            input = Ext.CTCT.Base64._utf8_encode(input);

            while (i < input.length) {

                    chr1 = input.charCodeAt(i++);
                    chr2 = input.charCodeAt(i++);
                    chr3 = input.charCodeAt(i++);

                    enc1 = chr1 >> 2;
                    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                    enc4 = chr3 & 63;

                    if (isNaN(chr2)) {
                            enc3 = enc4 = 64;
                    } else if (isNaN(chr3)) {
                            enc4 = 64;
                    }

                    output = output +
                    this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                    this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

            }

            return output;
    },

    // private method for UTF-8 encoding
    _utf8_encode : function (string) {
            string = string.replace(/\r\n/g,"\n");
            var utftext = "";

            for (var n = 0; n < string.length; n++) {

                    var c = string.charCodeAt(n);

                    if (c < 128) {
                            utftext += String.fromCharCode(c);
                    }
                    else if((c > 127) && (c < 2048)) {
                            utftext += String.fromCharCode((c >> 6) | 192);
                            utftext += String.fromCharCode((c & 63) | 128);
                    }
                    else {
                            utftext += String.fromCharCode((c >> 12) | 224);
                            utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                            utftext += String.fromCharCode((c & 63) | 128);
                    }

            }

            return utftext;
    }

}

//add ISO8601 datetime handling to the javascript Date() method
Date.prototype.setISO8601 = function(dString){
    var regexp = /(\d\d\d\d)(-)?(\d\d)(-)?(\d\d)(T)?(\d\d)(:)?(\d\d)(:)?(\d\d)(\.\d+)?(Z|([+-])(\d\d)(:)?(\d\d))/;

    if (dString.toString().match(new RegExp(regexp))) {
        var d = dString.match(new RegExp(regexp));
        var offset = 0;

        this.setUTCDate(1);
        this.setUTCFullYear(parseInt(d[1],10));
        this.setUTCMonth(parseInt(d[3],10) - 1);
        this.setUTCDate(parseInt(d[5],10));
        this.setUTCHours(parseInt(d[7],10));
        this.setUTCMinutes(parseInt(d[9],10));
        this.setUTCSeconds(parseInt(d[11],10));
        if (d[12])
        this.setUTCMilliseconds(parseFloat(d[12]) * 1000);
        else
        this.setUTCMilliseconds(0);
        if (d[13] != 'Z') {
            offset = (d[15] * 60) + parseInt(d[17],10);
            offset *= ((d[14] == '-') ? -1 : 1);
            this.setTime(this.getTime() - offset * 60 * 1000);
        }
    }
    else {
        this.setTime(Date.parse(dString));
    }
    return this;
};