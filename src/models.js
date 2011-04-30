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
                if (item.data.status == 'COMPLETE' || item.data.status == 'ACTIVE') {
                    return item;
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