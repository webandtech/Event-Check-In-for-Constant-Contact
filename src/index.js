/*
 * Event Check-In for Constant Contact
 * Created by Aaron Severs on Apr 26 2011
 * Copyright 2011, Constant Contact <asevers at constantcontact dot com>
 * MIT licensed
 *
 * index.js: Sencha Touch PhoneGap Bootstrapper for Event Check-In App
 *
 */

// Detect if the user is using Google Chrome (I use it for development) - see README
var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome');

function onDeviceReady() {
    if (Ext.is.iOS && is_chrome == -1) {
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
        "images/footer.png",
        "images/check.png",
        "images/blank_nameTag.png"
    );
    
    Ext.setup({ //initialize Sencha Touch and load the models and views
        onReady: function() {
            setUpModels();
            setUpViews();
            if (Ext.is.iOS && is_chrome == -1) {
                window.plugins.splashScreen.hide(); //The view has been loaded - hide the splash screen
            }
            tryNetworkConnection(); //Test the internet connection and alert the user if they're offline (and thus can't use the app)
        }


    });
}

function autoLogin() {
    //load Ext.CTCT SDK and return a username if it already has stored CTCT credentials (from last login)
    var username = Ext.CTCT.init('https://api.constantcontact.com', 'YOUR API KEY');
    if (username != false) {
        refreshEventsList();
    }
    //don't do anything if username == false. The login form will remain on the screen.
}


//we have to test the network connection and alert the user if they're offline or Apple will
//reject our app. It's easy with phonegap!
function tryNetworkConnection() {
    if (is_chrome > -1) {
        autoLogin(); // don't do any of this if user is on Chrome (development mode)
    }
    else {
        navigator.network.isReachable("www.constantcontact.com", testNetworkConnection, {}); //use phonegap apis to check to see if we can reach www.constantcontact.com
    }
}


//this is the callback from navigator.network.isReachable above. Alert the user if offline and
//try again if they hit OK.
function testNetworkConnection(reachability) {
    var networkState = reachability.code || reachability;
        var states = {};
        states[NetworkStatus.NOT_REACHABLE]                      = 'No network connection';
        states[NetworkStatus.REACHABLE_VIA_CARRIER_DATA_NETWORK] = 'Carrier data connection';
        states[NetworkStatus.REACHABLE_VIA_WIFI_NETWORK]         = 'WiFi connection';
    if (states[networkState] == 'No network connection') {
        Ext.Msg.alert('You\'re offline!', 'We weren\'t able to connect to Constant Contact. Try again?<br/><br/><br/>', tryNetworkConnection);
        return;
    }
    else {
        autoLogin();
    }
}