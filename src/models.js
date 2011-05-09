/*
 * Event Check-In for Constant Contact
 * Created by Aaron Severs on Apr 26 2011
 * Copyright 2011, Constant Contact <asevers at constantcontact dot com>
 * MIT licensed
 *
 * models.js: data stores used by the views and controllers. Basically just lists of stuff ;)
 *
 */

function setUpModels() {

    var eventsListStore = new Ext.data.Store({
        storeId: 'eventsListStore',
        sorters: [{
                property: 'startDate',
                direction: 'DESC'
            }],
        filters: [
        {
            filterFn: function(item) {
                var today = new Date();
                var eventDate = new Date(item.data.startDate);
                var eventEndDate = new Date(item.data.endDate);
                //only show events that are complete or active (published)
                if (item.data.status == 'COMPLETE' || item.data.status == 'ACTIVE') {
                    //only show events that are today or ended in the last 30 days or started before today and still going on
                    if (eventDate.toDateString() == today.toDateString() ||
                    (eventEndDate.getTime() < today.getTime() && eventEndDate.getTime() >= (today.getTime() - 2592000000)) ||
                    (eventDate.getTime() <= today.getTime() && eventEndDate.getTime() >= today.getTime())) {
                        return item;
                    }
                }
            }
        }],
        fields: []
    });

    var eventsRegistrantsStore = new Ext.data.Store({
        storeId: 'eventsRegistrantsStore',
        sorters: [{
                property: 'lastName',
                direction: 'ASC'
            }],
        getGroupString: function(record) {
            return record.get('lastName')[0].toUpperCase();
        },
        fields: []
    });
}