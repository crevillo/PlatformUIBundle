/*
 * Copyright (C) eZ Systems AS. All rights reserved.
 * For full copyright and license information view LICENSE file distributed with this source code.
 */
YUI.add('ez-roleserversideview', function (Y) {
    "use strict";
    /**
     * Provides the role server side view
     *
     * @module ez-roleserversideview
     */
    Y.namespace('eZ');

    var events = {
            '.ez-role-assign-button': {
                'tap': '_pickSubtree'
            },
            '.ez-pick-location-limitation-button': {
                'tap': '_pickLocationLimitation'
            },
        };

    /**
     * The role server side view. It adds the handling of the role assign
     * button.
     *
     * @namespace eZ
     * @class RoleServerSideView
     * @constructor
     * @extends eZ.ServerSideView
     */
    Y.eZ.RoleServerSideView = Y.Base.create('roleServerSideView', Y.eZ.ServerSideView, [], {
        initializer: function () {
            this.events = Y.merge(this.events, events);
        },

        /**
         * tap event handler on the role assign buttons. It launches the
         * universal discovery widget so that the user can pick some contents.
         *
         * @method _pickSubtree
         * @protected
         * @param {EventFacade} e
         */
        _pickSubtree: function (e) {
            var button = e.target,
                unsetLoading = Y.bind(this._uiUnsetUDWButtonLoading, this, button);

            e.preventDefault();
            this._uiSetUDWButtonLoading(button);
            this.fire('contentDiscover', {
                config: {
                    title: button.getAttribute('data-universaldiscovery-title'),
                    cancelDiscoverHandler: unsetLoading,
                    multiple: true,
                    data: {
                        roleId: button.getAttribute('data-role-rest-id'),
                        roleName: button.getAttribute('data-role-name'),
                        afterUpdateCallback: unsetLoading,
                    },
                },
            });
        },

        /**
         * tap event handler for policy limitation on location ("Node"). It launches the
         * universal discovery widget so that the user can pick a location.
         *
         * @method _pickLocationLimitation
         * @protected
         * @param {EventFacade} e
         */
        _pickLocationLimitation: function (e) {
            var button = e.target,
                unsetLoading = Y.bind(this._uiUnsetUDWButtonLoading, this, button);

            e.preventDefault();
            this._uiSetUDWButtonLoading(button);
            this.fire('contentDiscover', {
                config: {
                    title: button.getAttribute('data-universaldiscovery-title'),
                    cancelDiscoverHandler: unsetLoading,
                    multiple: false,
                    contentDiscoveredHandler: Y.bind(this._setLocationLimitation, this, button),
                },
            });
        },

        /**
         * Puts picked location id into location limitation input. Input is selected by the selector
         * provided in the `data-location-input-selector` attribute of the button, for example
         * <button data-location-input-selector="#id_of_input"></button>
         *
         * @method _setLocationLimitation
         * @protected
         * @param {Y.Node} button
         * @param {EventFacade} e
         */
        _setLocationLimitation: function (button, e) {
            var locationInput = this.get('container').one(button.getAttribute('data-location-input-selector')),
                selectedLocation = this.get('container').one(button.getAttribute('data-selected-location-selector'));

            locationInput.setAttribute('value', e.selection.location.get('locationId'));
            selectedLocation.setHTML(e.selection.contentInfo.get('name'));
            this._uiUnsetUDWButtonLoading(button);
        },

        /**
         * Changes the state of the provided UDW button to be *loading* and
         * to be disabled
         *
         * @method _uiSetUDWButtonLoading
         * @protected
         * @param {Y.Node} button
         */
        _uiSetUDWButtonLoading: function (button) {
            button.addClass('is-loading').set('disabled', true);
        },

        /**
         * Changes the state of the provided UDW button to not be *loading*
         * and to be enabled.
         *
         * @method _uiUnsetUDWButtonLoading
         * @protected
         * @param {Y.Node} button
         */
        _uiUnsetUDWButtonLoading: function (button) {
            button.removeClass('is-loading').set('disabled', false);
        },
    });
});
