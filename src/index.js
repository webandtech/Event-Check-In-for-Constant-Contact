/*
 * Event Check-In for Constant Contact
 * Created by Aaron Severs on Apr 26 2011
 * Copyright 2011, Constant Contact <asevers at constantcontact dot com>
 * MIT licensed
 *
 * index.js: Sencha Touch PhoneGap Bootstrapper for Event Check-In App
 *
 */

/*
 * Detect if the user is using Google Chrome (I use it for development)
 * Try starting Chrome (Mac OS) without cross domain security:
 * /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --disable-web-security
 *
 */

var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome');

function onDeviceReady() {
    if (Ext.is.iOS) {
        window.plugins.splashScreen.show(); //show the splash screen while the Ext framework is loaded
    }
    var preloadedImages = new Array(); //preload images before showing anything for a better UX
    function preloadImages() {
        for (i = 0; i < preloadImages.arguments.length; i++) {
                preloadedImages[i] = new Image()
                preloadedImages[i].src = preloadImages.arguments[i]
        }
    }
    preloadImages(
        "images/logo.png",
        "images/ctct-logo.png",
        "images/check.png",
        "images/blank_nameTag.png",
        "images/calendar.png",
        "images/mail.png"
    );
    
    Ext.setup({ //initialize Sencha Touch and load the models and views
        onReady: function() {
            setUpModels();
            setUpViews();
            if (Ext.is.iOS) {
                window.plugins.splashScreen.hide(); //The view has been loaded - hide the splash screen
            }
            tryNetworkConnection(); //Test the internet connection and alert the user if they're offline (and thus can't use the app)
        }


    });
}

function autoLogin() {
    var username = Ext.CTCT.init('https://api.constantcontact.com', 'YOUR API KEY');
    if (username != false) {
        refreshEventsList();
    }
}

function tryNetworkConnection() {
    if (is_chrome > -1) {
        autoLogin();
    }
    else {
        navigator.network.isReachable("www.constantcontact.com", testNetworkConnection, {}); //use phonegap apis to check to see if we can reach www.constantcontact.com
    }
}

function testNetworkConnection(reachability) {
    var networkState = reachability.code || reachability;
        var states = {};
        states[NetworkStatus.NOT_REACHABLE]                      = 'No network connection';
        states[NetworkStatus.REACHABLE_VIA_CARRIER_DATA_NETWORK] = 'Carrier data connection';
        states[NetworkStatus.REACHABLE_VIA_WIFI_NETWORK]         = 'WiFi connection';
    if (states[networkState] == 'No network connection') {
        Ext.Msg.alert('You\'re offline!', 'We weren\'t able to connect to Constant Contact. Try again?<br/>', tryNetworkConnection);
        return;
    }
    else {
        autoLogin();
    }
}