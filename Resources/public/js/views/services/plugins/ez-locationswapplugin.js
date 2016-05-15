/*
 * Copyright (C) eZ Systems AS. All rights reserved.
 * For full copyright and license information view LICENSE file distributed with this source code.
 */
YUI.add('ez-locationswapplugin', function (Y) {
    "use strict";
    /**
     * Provides the plugin for swap location
     *
     * @module ez-locationswapplugin
     */
    Y.namespace('eZ.Plugin');

    /**
     * Swap location plugin. It sets an event handler to swap location
     *
     * In order to use it you need to fire `swapLocation` event with parameter
     * `location` containing the eZ.Location object you want swap with other.
     *
     * @namespace eZ.Plugin
     * @class LocationSwap
     * @constructor
     * @extends eZ.Plugin.ViewServiceBase
     */
    Y.eZ.Plugin.LocationSwap = Y.Base.create('locationswapplugin', Y.eZ.Plugin.ViewServiceBase, [], {

        initializer: function () {
            this.onHostEvent('*:swapLocation', this._swapLocationSelect);
        },

        /**
         * swapLocation event handler, launch the universal discovery widget
         * to choose the location you want to swap with the given one
         *
         * @method _swapLocationSelect
         * @private
         * @param {EventFacade} e swapLocation event facade
         */
        _swapLocationSelect: function (e) {
            var service = this.get('host');

            service.fire('contentDiscover', {
                config: {
                    title: "Select the location you want to swap with the given one",
                    contentDiscoveredHandler: Y.bind(this._swapLocation, this),
                    multiple: false,
                    isSelectable: true,
                    data: {
                        afterSwapLocationCallback: e.afterSwapLocationCallback
                    }
                },
            });
        },

        /**
         * Swaps the given location with the selected one
         *
         * @method _swapLocation
         * @protected
         * @param {EventFacade} e
         */
        _swapLocation: function (e) {
            var service = this.get('host'),
                capi = service.get('capi'),
                location = service.get('location'),
                notificationIdentifier = 'swap-location-' + location.get('id'),
                data = e.target.get('data'),
                destinationLocation = e.selection.location,
                errNotificationIdentifier = 'swap-location-' + location.get('id'),
                locationSwaped = false,
                stack = new Y.Parallel(),
                that = this;

            this._notify(
                "Swaping location for '" + location.get('contentInfo').get('name') + "'",
                notificationIdentifier,
                'started',
                5
            );

            location.swap({api: capi}, destinationLocation, stack.add(function (error) {
                if (error) {
                    return;
                }

                locationSwaped = true;
            }));

            stack.done(function () {
                if (locationSwaped) {
                    that._notify(
                        "Location for '" + location.get('contentInfo').get('name') + "' " +
                        "has been swapped with '" + destinationLocation.get('contentInfo').get('name') + "'",
                        notificationIdentifier,
                        'done',
                        5
                    );
                    data.afterSwapLocationCallback();
                } else {
                    that._notify(
                        "Swaping location for '" + location.get('contentInfo').get('name') + "' failed",
                        errNotificationIdentifier,
                        'error',
                        0
                    );
                }
            });
        },

        /**
         * Fire 'notify' event
         *
         * @method _notify
         * @protected
         * @param {String} text the text shown during the notification
         * @param {String} identifier the identifier of the notification
         * @param {String} state the state of the notification
         * @param {Integer} timeout the number of second, the notification will be shown
         */
        _notify: function (text, identifier, state, timeout) {
            this.get('host').fire('notify', {
                notification: {
                    text: text,
                    identifier: identifier,
                    state: state,
                    timeout: timeout,
                }
            });
        },
    }, {
        NS: 'swapLocation'
    });

    Y.eZ.PluginRegistry.registerPlugin(
        Y.eZ.Plugin.LocationSwap, ['locationViewViewService']
    );
});
