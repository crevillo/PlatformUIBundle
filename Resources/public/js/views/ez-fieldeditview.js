YUI.add('ez-fieldeditview', function (Y) {
    "use strict";
    /**
     * Provides the base class for the field edit views
     *
     * @module ez-fieldeditview
     */

    Y.namespace('eZ');

    var L = Y.Lang,
        ERROR_CLASS = 'is-error';

    /**
     * Field Edit View. This is an *abstract* class, so it's not supposed to be
     * used directly.
     *
     * @namespace eZ
     * @class FieldEditView
     * @extends eZ.TemplateBasedView
     */
    Y.eZ.FieldEditView = Y.Base.create('fieldEditView', Y.eZ.TemplateBasedView, [], {
        /**
         * Contains the default content of the error message placeholder. It
         * is used to restore the error placeholder when the view switches
         * from the error state to the normal state.
         *
         * @property _errorDefaultContent
         * @protected
         * @type string
         */
        _errorDefaultContent: '',

        /**
         * Default implementation of the field edit view render. By default, it
         * injects the field definition, the field, the content and the content
         * type
         *
         * @method render
         * @return {eZ.FieldEditView}
         */
        render: function () {
            var defaultVariables = {
                    fieldDefinition: this.get('fieldDefinition'),
                    field: this.get('field'),
                    content: this.get('content').toJSON(),
                    contentType: this.get('contentType').toJSON()
                };

            this.get('container').setHTML(
                this.template(Y.mix(this._variables(), defaultVariables, true))
            );
            return this;
        },

        /**
         * Returns an object containing the additional variables needed in the
         * field edit view template. The default implementation returns an empty
         * object
         *
         * @method _variables
         * @protected
         * @return Object
         */
        _variables: function () {
            return {};
        },

        /**
         * Reflects in the UI the errorStatus change
         *
         * @method _errorUI
         * @protected
         * @param {Object} e the event facade of the errorStatusChange event
         */
        _errorUI: function (e) {
            var container = this.get('container');

            if ( e.newVal ) {
                container.addClass(ERROR_CLASS);
                if ( L.isString(e.newVal) ) {
                    this._errorDefaultContent = container.one('.ez-editfield-error-message').getContent();
                    this._setErrorMessage(e.newVal);
                }
            } else {
                container.removeClass(ERROR_CLASS);
                if ( this._errorDefaultContent ) {
                    this._setErrorMessage(this._errorDefaultContent);
                }
            }
        },

        /**
         * Sets the error message in UI
         *
         * @method _setErrorMessage
         * @protected
         * @param {String} msg the error message
         */
        _setErrorMessage: function (msg) {
            this.get('container').one('.ez-editfield-error-message').setContent(msg);
        },

        /**
         * Custom initializer method, it sets the event handling on the
         * errorStatusChange event
         *
         * @method initializer
         */
        initializer: function () {
            this.after('errorStatusChange', this._errorUI);
        },

        /**
         * Returns whether the view is currently in a valid state
         *
         * @method isValid
         * @return boolean
         */
        isValid: function () {
            return this.get('errorStatus') === false;
        }

    }, {
        ATTRS: {
            /**
             * The validation error status. A truthy value means there's an
             * error. Setting this attribute to a non empty string will add this
             * string as an error message (under the field name by default)
             *
             * @attribute errorStatus
             * @type mixed
             * @default false
             */
            errorStatus: {
                value: false
            },

            /**
             * The field definition of the field to edit
             *
             * @attribute fieldDefinition
             * @type Object
             * @default null
             */
            fieldDefinition: {
                value: null
            },

            /**
             * The field to edit
             *
             * @attribute field
             * @type Object
             * @default null
             */
            field: {
                value: null
            },

            /**
             * The content the field to edit belongs to
             *
             * @attribute content
             * @type {eZ.Content}
             * @default null
             */
            content: {
                value: null
            },

            /**
             * The content type of the content
             *
             * @attribute contentType
             * @type {eZ.ContentType}
             * @default null
             */
            contentType: {
                value: null
            }
        },

        /**
         * Registry of all registered field edit views indexed by field type
         * identifier
         *
         * @property
         * @private
         * @type Object
         * @default {}
         */
        REGISTRY: {},

        /**
         * Registers a field edit view for the given field type identifier
         *
         * @method registerFieldEditView
         * @static
         * @param {String} fieldTypeIdentifier the field type identifier
         *                 (ezstring, eztext, ...)
         * @param {Function} editView the constructor function of the field edit
         *                   view
         */
        registerFieldEditView: function (fieldTypeIdentifier, editView) {
            Y.eZ.FieldEditView.REGISTRY[fieldTypeIdentifier] = editView;
        },

        /**
         * Returns the field edit view constructor for the given field type identifier.
         * Throw a TypeError if no field edit view is registered for it
         *
         * @method getFieldEditView
         * @static
         * @param {String} fieldTypeIdentifier the field type identifier
         *                 (ezstring, eztext, ...)
         * @return {Function}
         */
        getFieldEditView: function (fieldTypeIdentifier) {
            var view = Y.eZ.FieldEditView.REGISTRY[fieldTypeIdentifier];

            if ( typeof view === 'function' ) {
                return view;
            }
            throw new TypeError("No implementation of Y.eZ.FieldEditView for " + fieldTypeIdentifier);
        }
    });
});