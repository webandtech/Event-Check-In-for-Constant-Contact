/*
 * Event Check-In for Constant Contact
 * Created by Aaron Severs on Apr 26 2011
 * Copyright 2011, Constant Contact <asevers at constantcontact dot com>
 * MIT licensed
 *
 * views.js: display logic, templates, etc
 *
 */

// Instantiate the views. The login screen will show on the device when done.
function setUpViews() {
    // Load any models we need.
    var eventsListStore = Ext.StoreMgr.lookup('eventsListStore');
    var eventsRegistrantsStore = Ext.StoreMgr.lookup('eventsRegistrantsStore');

/*
 * Login form panel - a login form that shows info about the app and
 * calls the Ext.CTCT.login function when the loginButton is tapped
 */

    var userNameField = new Ext.form.Text({
       label: 'User Name',
       id: 'userNameField',
       labelWidth: '40%',
       autoComplete: false,
       autoCorrect: false,
       autoCapitalize: false,
       listeners: {
            //on keyup we'll check if they hit the enter key / done button, and if so, blur the field.
            keyup: function(fld, e){
                if (e.browserEvent.keyCode == 13) {
                e.stopEvent();
                fld.fieldEl.dom.blur();
                }
            }
        }
    });

    var passwordField = new Ext.form.Password({
       label: 'Password',
       id: 'passwordField',
       labelWidth: '40%',
       listeners: {
           //on keyup we'll check if they hit the enter key / done button, and if so
           //we'll blur the field and call the doLogin function, passing in the username / password
            keyup: function(fld, e){
                if (e.browserEvent.keyCode == 13) {
                e.stopEvent();
                fld.fieldEl.dom.blur();
                Ext.CTCT.login(userNameField.getValue(),passwordField.getValue(),function(){
                    refreshEventsList();
                });
                //also clear the fields so if they come back to the login screen they have a clean slate
                userNameField.reset();
                passwordField.reset();
                }
            }
        }
    });

    var loginButton = new Ext.Button({
        text: 'Log In',
        id: 'loginButton',
        cls: 'loginButton',
        handler: function() {
            passwordField.blur();
            userNameField.blur();
            if (Ext.is.Android) {
                window.KeyBoard.hideKeyBoard(); // stupid Android... needs me to tell it to close the keyboard!
            }
            //login with callback to get the events list
            Ext.CTCT.login(userNameField.getValue(),passwordField.getValue(),function() {
                refreshEventsList();
            });
            userNameField.reset();
            passwordField.reset();
        }
    });

    //I want to specify some different html on the login screen for iOS versus other devices because the screen size is well known

    if (Ext.is.iOS) {
        var loginInstructions = '\
                Login with your Constant Contact User Name and Password.\n\
                <br/>\n\
                <br/>\n\
                <br/>\n\
                <br/>\n\
                <a class="viralLink" href="http://www.constantcontact-event.com/?cc=iOSCheckIn"><img src="images/ctct-logo.png" style="width:220px;height:21px;"/>\n\
                <br/>\n\
                Try it FREE. No credit card required.</a>'
    }
    else {
        var loginInstructions = '\
                Login with your Constant Contact User Name and Password.\n\
                <br/>\n\
                <br/>\n\
                <a class="viralLink" href="http://www.constantcontact-event.com/?cc=droidCheckIn"><img src="images/ctct-logo.png" style="width:220px;height:21px;"/>\n\
                <br/>\n\
                Try it FREE. No credit card required.</a>'
    }

    // assemble the login pagel
    var loginPanel = new Ext.Panel({
        title: 'Login',
        scroll: false,
        id: 'loginPanel',
        cls: 'loginPanel',
        items: [{
            html: '\
                <div class="titleimgdiv"></div>\n\
                <div class="appTitle">\n\
                    Event Check-In\n\
                    <br/>\n\
                    <span style="font-size: .8em;font-style:italic;">for Constant Contact</span>\n\
                </div>\n\
                <div class="appInfo">\n\
                Super easy attendance tracking<br/> for your Constant Contact events.\n\
                </div>\n\
            '},
            {
            xtype: 'fieldset',
            cls: 'loginPanelFS',
            instructions: loginInstructions, //login instructions were adapted for both iOS and Android. Probably could do better with css but oh well...
            items: [userNameField,passwordField,loginButton]
        }]
    });

    /*
     * Events list panel - a list of events. Tapping an event loads registrants
     */

    // the scrolling list itself
    var eventsList = new Ext.List({
        store: eventsListStore,
        id: 'eventsList',
        indexBar: true,
        singleSelect: true,
        title: 'Events',
        cls: 'demo-list',
        itemTpl: new Ext.XTemplate(
           '<tpl for=".">',
                '<div class="contact event">',
                    '<div class="registrantCount">{registered}</div>',
                    '<span class="eventTitle">{[getNameSubString(values.name)]}</span>',
                    '<br/><span class="eventDate">{[getDisplayDate(values.startDate)]}</span>',
                '</div>',
          '</tpl>'
        ),
        plugins: [{
            ptype: 'pullrefresh',
            refreshFn: function(callback,obj) {
                obj.lastUpdated = new Date();
                refreshEventsList();
                if(obj.isLoading){obj.isLoading=false;obj.setViewState("pull");obj.updatedEl.setHTML(Ext.util.Format.date(obj.lastUpdated,"m/d/Y h:iA"));setTimeout(function(){obj.scroller.updateBoundary(obj.snappingAnimationDuration)},100)}
            }
        }]
    });

    //tapping an event in the list will show the registrants for that event
    eventsList.on('itemtap', function(dataview, index, el, e) {
        refreshRegistrantList(eventsListStore.getAt(index).data.id);
    });

    //a logout button for the toolbar
    var logOutButton = new Ext.Button ({
        text: 'Logout',
        id: 'logOutButton',
        handler: function() {
            doLogout();
        }
    });

    //toolbar at the top of the events list - includes the logout button and a refresh button
    var eventsListToolBar = new Ext.Toolbar ({
        dock: 'top',
        cls: 'topToolbar',
        id: 'eventsListToolBar',
        xtype: 'toolbar',
        title: 'Choose an Event',
        items: [
            logOutButton,
            {xtype: 'spacer'},
            {iconCls: 'info', iconMask: true, ui: 'plain', handler: function() {
                Ext.Msg.alert('Events List', 'Today\'s active events as well as those that ended in the past 30 days are shown in this list.<br/><br/>');
            }}
        ]
    });

    //the panel view that contains the events list plus the toolbar, making up that page
    var eventsListPanel = new Ext.Panel({
        id: 'eventsListPanel',
        layout: 'fit',
        items: [eventsList],
        dockedItems: [eventsListToolBar]
    });

    /*
     * Registrant list panel - a list of registrants for an event. Tapping a registrant
     * shows a details overlay
     */

    //the list view for registrants in an event
    var eventRegistrantList = new Ext.List({
        store: eventsRegistrantsStore,
        grouped: true,
        indexBar: true,
        id: 'eventRegistrantList',
        singleSelect: true,
        title: 'Event Registrants',
        cls: 'demo-list',
        itemTpl: new Ext.XTemplate(
           '<tpl for=".">',
                '<div class="contact {registrationStatus}">',
                    '<strong>{lastName}</strong>, {firstName}',
                '</div>',
          '</tpl>'
        ),
        plugins: [{
            ptype: 'pullrefresh',
            refreshFn: function(callback,obj) {
                obj.lastUpdated = new Date();
                refreshRegistrantList(Ext.getCmp("eventsList").getSelectedRecords()[0].data.id);
                if(obj.isLoading){obj.isLoading=false;obj.setViewState("pull");obj.updatedEl.setHTML(Ext.util.Format.date(obj.lastUpdated,"m/d/Y h:iA"));setTimeout(function(){obj.scroller.updateBoundary(obj.snappingAnimationDuration)},100)}
            }
        }]
    });

    // show a registrant details panel when tapping a registrant
    eventRegistrantList.on('itemtap', function(dataview, index, el, e) {
        if (Ext.is.Android && Ext.getCmp('registrantSearchField').getValue() != '') {
            Ext.getCmp('registrantSearchField').blur();
            window.KeyBoard.hideKeyBoard(); // stupid Android... needs me to tell it to close the keyboard!
            setTimeout(function() {getRegistrantDetails(index);},300); // if you do this too quickly after keyboard close, Android barfs all over itself.
        }
        else {
            Ext.getCmp('registrantSearchField').blur();
            getRegistrantDetails(index);
        }
    });

    //back button on the registrant list - that hides the registrant list and shows the events list
    var registrantListBackButton = new Ext.Button ({
        text: 'Back',
        ui: 'back',
        id: 'registrantListBackButton',
        handler: function() {
            mainPanel.setActiveItem(eventsListPanel);
            //deselect the currently selected item from the event list. Wait a fraction of a sec before doing it so the user sees it.
            setTimeout('Ext.getCmp("eventsList").deselect(Ext.getCmp("eventsList").getSelectedRecords()[0])', 250);
        }
    });

    //toolbar at the top of the registrant list, includes the back button
    var registrantListToolBar = new Ext.Toolbar ({
        dock: 'top',
        cls: 'topToolbar',
        id: 'registrantListToolBar',
        xtype: 'toolbar',
        title: 'Registrants',
        items: [registrantListBackButton,{xtype: 'spacer'}, {iconCls: 'info', iconMask: true, ui: 'plain', handler: function() {getEventDetails(eventsListStore.findExact("id",Ext.getCmp("eventsList").getSelectedRecords()[0].data.id));}}]
    });

    //toolbar with the search form
    var registrantListSearchToolBar = new Ext.Toolbar ({
        dock: 'top',
        cls: 'topToolbar',
        id: 'registrantListSearchToolBar',
        xtype: 'toolbar',
        items: [{
                autoComplete: false,
                autoCorrect: false,
                autoCapitalize: false,
                xtype: 'searchfield',
                placeHolder: 'Search',
                name: 'searchfield',
                id: 'registrantSearchField',
                listeners: {
                    //on keyup we'll filter the registrants list
                    keyup: function(fld, e){
                        var search = Ext.getCmp('registrantSearchField').getValue().toLowerCase();
                        eventsRegistrantsStore.filterBy(function(item) {
                            if (item.data.firstName.toLowerCase().indexOf(search) != -1 || item.data.lastName.toLowerCase().indexOf(search) != -1 || item.data.emailAddress.toLowerCase().indexOf(search) != -1) {
                                return item;
                            }
                        });
                    },
                    focus: function() {
                        Ext.getCmp('registrantSearchField').setValue('');
                    }
                }
        }]
    });

    //the panel view that contains the registrant list plus the toolbar, making up that page
    var eventRegistrantsListPanel = new Ext.Panel({
        id: 'eventRegistrantsListPanel',
        layout: 'fit',
        items: [eventRegistrantList],
        dockedItems: [registrantListToolBar,registrantListSearchToolBar]
    });

    /*
     * Event Details overlay - a modal overlay that shows event details
     */

    // a hidden field to hold the event Id for the one I'm working with
    var eventIdField = new Ext.form.Hidden({
       id: 'eventIdField',
       name: 'id'
    });

    var eventNameField = new Ext.form.TextArea({
       id: 'eventNameField',
       name: 'name',
       height: 45,
       style: 'font-size:.9em;font-weight:bold;'
    });

    var eventTitleField = new Ext.form.TextArea({
       label: 'Title',
       id: 'eventTitleField',
       name: 'title',
       height: 45,
       labelWidth: '78px',
       style: 'font-size:.9em;'
    });

    var eventLocationField = new Ext.form.TextArea({
       label: 'Location',
       id: 'eventLocationField',
       height: 45,
       name: 'location',
       labelWidth: '78px',
       style: 'font-size:.9em;'
    });

    var eventStatusField = new Ext.form.Text({
       label: 'Status',
       id: 'eventStatusField',
       name: 'status',
       labelWidth: '78px',
       style: 'font-size:.9em;'
    });

    var eventStartDateField = new Ext.form.Text({
       label: 'Start Date',
       id: 'eventStartDateField',
       name: 'startDate',
       labelWidth: '78px',
       style: 'font-size:.9em;'
    });

    var eventStartTimeField = new Ext.form.Text({
       label: 'Start Time',
       id: 'eventStartTimeField',
       name: 'startTime',
       labelWidth: '78px',
       style: 'font-size:.9em;'
    });

    var eventRegisteredField = new Ext.form.Text({
       label: 'Registrants',
       id: 'eventRegisteredField',
       name: 'registered',
       labelWidth: '78px',
       style: 'font-size:.9em;'
    });

    // a toolbar at the top of the overlay
    var eventDetailsToolbar = new Ext.Toolbar ({
        dock: 'top',
        cls: 'topToolbar',
        id: 'eventDetailsToolbar',
        title: 'Event Details',
        items: [{text: 'Close',handler: function() {eventDetails.hide('pop');}}]
    });

    //the overlay itself that contains the above items
    var eventDetails =  new Ext.form.FormPanel({
        floating: true,
        centered: true,
        hideOnMaskTap: false,
        showAnimation: 'pop',
        disabled: true,
        width: '95%',
        modal: true,
        id: 'eventDetails',
        submitOnAction: false,
        name: 'eventDetails',
        dockedItems: [eventDetailsToolbar],
        items: [{
            xtype: 'fieldset',
            id: 'registrantDetailsFS',
            style: 'font-size: .8em; margin: 0;',
            items: [eventIdField,eventNameField,eventTitleField,eventLocationField,eventStatusField,eventStartDateField,eventStartTimeField,eventRegisteredField]
        }]
    });

    /*
     * Registrant Details overlay - a modal overlay that shows registrant details
     * plus a button to check the registrant in or uncheck them in
     */

    // a hidden field to hold the registrant Id for the one I'm working with
    var registrantIdField = new Ext.form.Hidden({
       id: 'registrantIdField',
       name: 'id'
    });

    var emailField = new Ext.form.TextArea({
       id: 'emailField',
       name: 'emailAddress',
       height: 45,
       style: 'font-size:.9em;font-weight:bold;'
    });

    var firstNameField = new Ext.form.Text({
       label: 'First Name',
       id: 'firstNameField',
       name: 'firstName',
       labelWidth: '78px',
       style: 'font-size:.9em;'
    });

    var lastNameField = new Ext.form.Text({
       label: 'Last Name',
       id: 'lastNameField',
       name: 'lastName',
       labelWidth: '78px',
       style: 'font-size:.9em;'
    });

    var statusField = new Ext.form.Text({
       label: 'Status',
       id: 'statusField',
       name: 'registrationStatus',
       labelWidth: '78px',
       style: 'font-size:.9em;'
    });

    var guestCountField = new Ext.form.Text({
       label: 'Guests',
       id: 'guestCountField',
       name: 'guestCount',
       labelWidth: '78px',
       style: 'font-size:.9em;'
    });

    var paymentStatusField = new Ext.form.Text({
       label: 'Payment',
       id: 'paymentStatusField',
       name: 'paymentStatus',
       labelWidth: '78px',
       style: 'font-size:.9em;'
    });

    // the Check-In button
    var registrantActionButton = new Ext.Button({
        id: 'registrantActionButton',
        ui: 'confirm',
        cls: 'registrantActionButton',
        text: 'Check-In',
        handler: function() {updateRegistrantAttendanceStatus(registrantIdField.getValue(),'ATTENDED');}
    });

    //the Uncheck-In button that marks an already Attended registrant and Not Attended
    var registrantRedActionButton = new Ext.Button({
        id: 'registrantRedActionButton',
        ui: 'decline',
        hidden: true,
        cls: 'registrantActionButton',
        text: 'Undo Check-In',
        handler: function() {updateRegistrantAttendanceStatus(registrantIdField.getValue(),'NOT_ATTENDED');}
    });

    // a toolbar at the top of the overlay
    var registrantDetailsToolbar = new Ext.Toolbar ({
        dock: 'top',
        cls: 'topToolbar',
        id: 'registrantDetailsToolbar',
        title: 'Registrant Details',
        items: [{text: 'Close',handler: function() {registrantDetails.hide('pop');setTimeout('Ext.getCmp("eventRegistrantList").deselect(Ext.getCmp("eventRegistrantList").getSelectedRecords()[0])', 250);}}]
    });

    //the overlay itself that contains the above items
    var registrantDetails =  new Ext.form.FormPanel({
        floating: true,
        centered: true,
        hideOnMaskTap: false,
        showAnimation: 'pop',
        disabled: true,
        width: '95%',
        modal: true,
        id: 'registrantDetails',
        submitOnAction: false,
        name: 'registrantDetails',
        dockedItems: [registrantDetailsToolbar],
        items: [{
            xtype: 'fieldset',
            id: 'registrantDetailsFS',
            style: 'font-size: .8em; margin: 0;',
            items: [registrantIdField,emailField,firstNameField,lastNameField,statusField,guestCountField,paymentStatusField]
        },registrantActionButton,registrantRedActionButton]
    });

    //mainPanel holds all the other panels and just switches between them as needed.
    //It's a tabpanel because that makes switching between the child cards real easy
    var mainPanel = new Ext.TabPanel({
        fullscreen: true,
        tabBar: {
            hidden: true
        },
        id: 'mainPanel',
        layout: 'fit',
        cardSwitchAnimation: false,
        items: [loginPanel,eventsListPanel,eventRegistrantsListPanel]
    });

}