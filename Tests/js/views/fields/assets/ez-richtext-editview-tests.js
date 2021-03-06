/*
 * Copyright (C) eZ Systems AS. All rights reserved.
 * For full copyright and license information view LICENSE file distributed with this source code.
 */
/* global CKEDITOR */
YUI.add('ez-richtext-editview-tests', function (Y) {
    var renderTest, registerTest, validateTest, getFieldTest,
        editorTest, focusModeTest, editorFocusHandlingTest, appendToolbarConfigTest,
        eventForwardTest,
        VALID_XHTML, INVALID_XHTML, RESULT_XHTML, EMPTY_XHTML, FIELDVALUE_RESULT, VALID_XHTML_ID, RESULT_EMPTY_XHTML,
        IMG_CONTENT, IMG_XHTML,
        Assert = Y.Assert, Mock = Y.Mock;

    INVALID_XHTML = "I'm invalid";

    VALID_XHTML = '<?xml version="1.0" encoding="UTF-8"?>';
    VALID_XHTML += '<section xmlns="http://ez.no/namespaces/ezpublish5/xhtml5/edit">';
    VALID_XHTML += '<p>I\'m not empty</p></section>';

    EMPTY_XHTML = '<?xml version="1.0" encoding="UTF-8"?>';
    EMPTY_XHTML += '<section xmlns="http://ez.no/namespaces/ezpublish5/xhtml5/edit"/>';

    RESULT_EMPTY_XHTML = '<p></p>';

    VALID_XHTML_ID = '<?xml version="1.0" encoding="UTF-8"?>';
    VALID_XHTML_ID += '<section xmlns="http://ez.no/namespaces/ezpublish5/xhtml5/edit" id="yui_3_18_1_1_1445609502229_4087">';
    VALID_XHTML_ID += '<p id="stuff">I\'m not empty</p></section>';

    RESULT_XHTML = '<p>I\'m not empty</p>';

    IMG_CONTENT = '<img src="http://www.reactiongifs.com/r/dstfp.gif">';
    IMG_XHTML = '<section xmlns="http://ez.no/namespaces/ezpublish5/xhtml5/edit">';
    IMG_XHTML += '<p><img src="http://www.reactiongifs.com/r/dstfp.gif"/></p></section>';

    FIELDVALUE_RESULT = '<section xmlns="http://ez.no/namespaces/ezpublish5/xhtml5/edit">';
    FIELDVALUE_RESULT += '<p>I\'m not empty</p></section>';

    CKEDITOR.plugins.add('ezaddcontent', {});
    CKEDITOR.plugins.add('ezremoveblock', {});
    CKEDITOR.plugins.add('ezembed', {});
    CKEDITOR.plugins.add('ezfocusblock', {});

    renderTest = new Y.Test.Case({
        name: "eZ RichText View render test",

        _getFieldDefinition: function (required) {
            return {
                isRequired: required
            };
        },

        setUp: function () {
            this.field = {id: 42, fieldValue: {xhtml5edit: ""}};
            this.jsonContent = {};
            this.jsonContentType = {};
            this.jsonVersion = {};
            this.content = new Mock();
            this.version = new Mock();
            this.contentType = new Mock();
            Mock.expect(this.content, {
                method: 'toJSON',
                returns: this.jsonContent
            });
            Mock.expect(this.version, {
                method: 'toJSON',
                returns: this.jsonVersion
            });
            Mock.expect(this.contentType, {
                method: 'toJSON',
                returns: this.jsonContentType
            });

            this.view = new Y.eZ.RichTextEditView({
                container: '.container',
                field: this.field,
                content: this.content,
                version: this.version,
                contentType: this.contentType,
            });
        },

        tearDown: function () {
            this.view.destroy();
        },

        _testAvailableVariables: function (required, expectRequired, xhtml5edit, expectedXhtml) {
            var fieldDefinition = this._getFieldDefinition(required),
                origTpl = this.view.template,
                that = this;

            this.field.fieldValue.xhtml5edit = xhtml5edit;
            this.view.set('fieldDefinition', fieldDefinition);

            this.view.template = function (variables) {
                Assert.isObject(variables, "The template should receive some variables");
                Assert.areEqual(8, Y.Object.keys(variables).length, "The template should receive 8 variables");

                Assert.areSame(
                     that.jsonContent, variables.content,
                    "The content should be available in the field edit view template"
                );
                Assert.areSame(
                     that.jsonVersion, variables.version,
                    "The content should be available in the field edit view template"
                );
                Assert.areSame(
                    that.jsonContentType, variables.contentType,
                    "The contentType should be available in the field edit view template"
                );
                Assert.areSame(
                    fieldDefinition, variables.fieldDefinition,
                    "The fieldDefinition should be available in the field edit view template"
                );
                Assert.areSame(
                    that.field, variables.field,
                    "The field should be available in the field edit view template"
                );
                Assert.areEqual(
                    "ez-richtext-editable", variables.editableClass,
                    "The editable class should be available in the template"
                );
                Assert.areSame(expectRequired, variables.isRequired);
                Assert.areSame(expectedXhtml, variables.xhtml);

                return origTpl.call(this, variables);
            };
            this.view.render();
        },

        "Test variables for not required field": function () {
            this._testAvailableVariables(false, false, VALID_XHTML, RESULT_XHTML);
        },

        "Test variables for required field": function () {
            this._testAvailableVariables(true, true, VALID_XHTML, RESULT_XHTML);
        },

        "Should handle the parsing error": function () {
            this._testAvailableVariables(false, false, INVALID_XHTML, "");
        },

        "Should add a paragraph in empty document": function () {
            this._testAvailableVariables(false, false, EMPTY_XHTML, RESULT_EMPTY_XHTML);
        },
    });

    validateTest = new Y.Test.Case({
        name: "eZ RichText View validate test",

        _getFieldDefinition: function (required) {
            return {
                isRequired: required
            };
        },

        setUp: function () {
            this.field = {id: 42, fieldValue: {xhtml5edit: ""}};
            this.model = new Mock();
            Mock.expect(this.model, {
                method: 'toJSON',
                returns: {},
            });

            this.view = new Y.eZ.RichTextEditView({
                container: '.container',
                field: this.field,
                content: this.model,
                version: this.model,
                contentType: this.model,
                config: {
                    rootInfo: {
                        ckeditorPluginPath: '../../..',
                    }
                },
            });
        },

        tearDown: function () {
            this.view.set('active', false);
            this.view.destroy();
        },

        "Should not detect any validation issue on a non required field": function () {
            var fieldDefinition = this._getFieldDefinition(false);

            this.view.set('fieldDefinition', fieldDefinition);
            this.view.render();
            this.view.set('active', true);
            this.view.validate();

            Assert.isTrue(
                this.view.isValid(),
                "A non required and empty field should be valid"
            );
        },

        "Should not validate a buggy and required field": function () {
            var fieldDefinition = this._getFieldDefinition(true);

            this.view.set('fieldDefinition', fieldDefinition);
            this.view.render();
            this.view.set('active', true);
            this.view.validate();

            Assert.isFalse(
                this.view.isValid(),
                "A required and empty field should not be valid"
            );
        },

        "Should not validate an empty and required field": function () {
            var fieldDefinition = this._getFieldDefinition(true);

            this.field.fieldValue.xhtml5edit = EMPTY_XHTML;
            this.view.set('fieldDefinition', fieldDefinition);
            this.view.render();
            this.view.set('active', true);
            this.view.validate();

            Assert.isFalse(
                this.view.isValid(),
                "A required and empty field should not be valid"
            );
        },

        "Should validate a filled and required field": function () {
            var fieldDefinition = this._getFieldDefinition(true);

            this.field.fieldValue.xhtml5edit = VALID_XHTML;
            this.view.set('fieldDefinition', fieldDefinition);
            this.view.render();
            this.view.set('active', true);
            this.view.validate();

            Assert.isTrue(
                this.view.isValid(),
                "A required and filled field should not be valid"
            );
        },
    });

    getFieldTest = new Y.Test.Case({
        name: "eZ RichText View getField test",

        _getFieldDefinition: function (required) {
            return {
                isRequired: required
            };
        },

        setUp: function () {
            this.field = {id: 42, fieldValue: {xhtml5edit: ""}};
            this.model = new Mock();
            Mock.expect(this.model, {
                method: 'toJSON',
                returns: {},
            });
            Y.Mock.expect(this.model, {
                method: 'get',
                args: ['mainLanguageCode'],
                returns: 'eng-GB'
            });

            this.view = new Y.eZ.RichTextEditView({
                container: '.container',
                field: this.field,
                content: this.model,
                version: this.model,
                contentType: this.model,
                config: {
                    rootInfo: {
                        ckeditorPluginPath: '../../..',
                    }
                },
            });
        },

        tearDown: function () {
            this.view.set('active', false);
            this.view.destroy();
        },

        "Should return an object": function () {
            var fieldDefinition = this._getFieldDefinition(true),
                field,
                xml;

            this.field.fieldValue.xhtml5edit = VALID_XHTML;
            this.view.set('fieldDefinition', fieldDefinition);
            this.view.render();
            this.view.set('active', true);
            field = this.view.getField();

            Assert.isObject(field, "The field should be an object");
            Assert.areNotSame(
                this.field, field,
                "The getField method should be return a different object"
            );
            Assert.isObject(field.fieldValue, "The fieldValue should be an object");
            xml = field.fieldValue.xml.replace(/\n/g, '');
            Assert.areEqual(
                FIELDVALUE_RESULT, xml.replace(/>  *</g, '><'),
                "The xml property of the fieldValue should come from the editor"
            );
        },

        "Should remove id attributes": function () {
            var fieldDefinition = this._getFieldDefinition(true),
                field,
                fragment = Y.config.doc.createDocumentFragment(),
                root = Y.config.doc.createElement('div');

            fragment.appendChild(root);

            this.field.fieldValue.xhtml5edit = VALID_XHTML_ID;
            this.view.set('fieldDefinition', fieldDefinition);
            this.view.render();
            this.view.set('active', true);
            field = this.view.getField();

            Assert.isObject(field, "The field should be an object");
            Assert.areNotSame(
                this.field, field,
                "The getField method should be return a different object"
            );
            Assert.isObject(field.fieldValue, "The fieldValue should be an object");
            root.innerHTML = field.fieldValue.xml;
            Assert.isNull(
                fragment.querySelector('[id]'),
                "Ids should have been removed"
            );
        },

        "Should return an XHTML document": function () {
            var fieldDefinition = this._getFieldDefinition(true);

            this.field.fieldValue.xhtml5edit = EMPTY_XHTML;
            this.view.set('fieldDefinition', fieldDefinition);
            this.view.render();
            this.view.set('active', true);
            this.view.get('editor').get('nativeEditor').setData(IMG_CONTENT, Y.bind(function () {
                Assert.areEqual(
                    IMG_XHTML,
                    this.view.getField().fieldValue.xml,
                    "The auto-closing tag should be closed"
                );
            }, this));
        },
    });

    editorTest = new Y.Test.Case({
        name: "eZ RichText View editor test",

        setUp: function () {
            this.config = {
                rootInfo: {
                    ckeditorPluginPath: '../../..',
                }
            };
            this.field = {id: 42, fieldValue: {xhtml5edit: ""}};
            this.model = new Mock();
            Mock.expect(this.model, {
                method: 'toJSON',
                returns: {},
            });

            this.view = new Y.eZ.RichTextEditView({
                container: '.container',
                field: this.field,
                fieldDefinition: {isRequired: true},
                content: this.model,
                version: this.model,
                contentType: this.model,
                config: this.config,
            });
            this.view.render();
        },

        tearDown: function () {
            this.view.set('active', false);
            this.view.destroy();
        },

        _testRegisterPlugin: function (plugin) {
            Assert.isObject(
                CKEDITOR.plugins.externals[plugin],
                "The '" + plugin + "' plugin should be registered"
            );
            Assert.areEqual(
                CKEDITOR.plugins.externals[plugin].dir,
                this.view.get('ckeditorPluginPath') + '/' + plugin + '/'
            );
        },

        "Should register the 'widget' CKEditor plugin": function () {
            this._testRegisterPlugin('widget');
        },

        "Should register the 'lineutils' CKEditor plugin": function () {
            this._testRegisterPlugin('lineutils');
        },

        "Should create an instance of AlloyEditor": function () {
            this.view.set('active', true);

            Assert.isInstanceOf(
                Y.eZ.AlloyEditor.Core, this.view.get('editor'),
                "An instance of AlloyEditor should have been created"
            );
        },

        "Should set the toolbar configuration": function () {
            this.view.set('active', true);
            Assert.areSame(
                this.view.get('toolbarsConfig'),
                this.view.get('editor').get('toolbars'),
                "The toolbarsConfig attribute should be used as the toolbars config"
            );
        },

        "Should validate the input on blur": function () {
            var validated = false;

            this.view.after('errorStatusChange', function () {
                validated = true;
            });
            this.view.set('active', true);
            this.view.get('editor').get('nativeEditor').fire('blur');

            Assert.isTrue(validated, "The input should have been validated");
        },

        "Should validate the input on focus": function () {
            var validated = false;

            this.view.after('errorStatusChange', function () {
                validated = true;
            });
            this.view.set('active', true);
            this.view.get('editor').get('nativeEditor').fire('focus');

            Assert.isTrue(validated, "The input should have been validated");
        },

        "Should validate the input on change": function () {
            var validated = false;

            this.view.after('errorStatusChange', function () {
                validated = true;
            });
            this.view.set('active', true);
            this.view.get('editor').get('nativeEditor').fire('change');

            Assert.isTrue(validated, "The input should have been validated");
        },

        _testExtraPlugins: function (plugin) {
            this.view.set('active', true);

            Assert.isTrue(
                this.view.get('editor').get('extraPlugins').indexOf(plugin) !== -1,
                "The '" + plugin + "' plugin should be loaded"
            );
        },

        "Should add the ezaddcontent plugin": function () {
            this._testExtraPlugins('ezaddcontent');
        },

        "Should add the ezremoveblock plugin": function () {
            this._testExtraPlugins('ezremoveblock');
        },

        "Should add the widget plugin": function () {
            this._testExtraPlugins('widget');
        },

        "Should add the ezembed plugin": function () {
            this._testExtraPlugins('ezembed');
        },

        "Should add the ezfocusblock plugin": function () {
            this._testExtraPlugins('ezfocusblock');
        },

        "Should pass the `eZ` configuration": function () {
            var eZConfig;

            this.view.set('active', true);

            eZConfig = this.view.get('editor').get('nativeEditor').config.eZ;
            Assert.isObject(
                 eZConfig,
                "The editor should have received the eZ configuration"
            );
            Assert.areEqual(
                eZConfig.editableRegion,
                '.ez-richtext-editable',
                "The eZ configuration should contain the selector for the editable region"
            );
        },
    });

    focusModeTest = new Y.Test.Case({
        name: "eZ RichText View focus mode test",

        setUp: function () {
            this.field = {id: 42, fieldValue: {xhtml5edit: ""}};
            this.content = new Mock();
            this.version = new Mock();
            this.contentType = new Mock();
            Mock.expect(this.content, {
                method: 'toJSON',
            });
            Mock.expect(this.version, {
                method: 'toJSON',
            });
            Mock.expect(this.contentType, {
                method: 'toJSON',
            });

            this.view = new Y.eZ.RichTextEditView({
                container: '.container',
                field: this.field,
                fieldDefinition: {isRequired: false},
                content: this.content,
                version: this.version,
                contentType: this.contentType,
            });
            this.view.render();
        },

        tearDown: function () {
            this.view.destroy();
        },

        "Should be false by default": function () {
            Assert.isFalse(
                this.view.get('focusMode'),
                "The focus mode should be disabled"
            );
        },

        "Should enable the focus mode on tap on the focus button": function () {
            var that = this,
                button = this.view.get('container').one('.ez-richtext-switch-focus');

            this.view.get('container').once('tap', function (e) {
                that.resume(function () {
                    Assert.isTrue(
                        !!e.prevented,
                        "The tap event should be prevented"
                    );
                    Assert.isTrue(
                        this.view.get('focusMode'),
                        "The focus mode should be enabled"
                    );
                });
            });

            button.simulateGesture('tap');
            this.wait();
        },

        "Should disable the focus mode on tap on the save and return button": function () {
            var that = this,
                button = this.view.get('container').one('.ez-richtext-save-and-return');

            this.view._set('focusMode', true);
            this.view.get('container').once('tap', function (e) {
                that.resume(function () {
                    Assert.isTrue(
                        !!e.prevented,
                        "The tap event should be prevented"
                    );
                    Assert.isFalse(
                        this.view.get('focusMode'),
                        "The focus mode should be disabled"
                    );
                });
            });

            button.simulateGesture('tap');
            this.wait();
        },

        "Should add the focused class": function () {
            this.view._set('focusMode', true);
            Assert.isTrue(
                this.view.get('container').hasClass('is-focused'),
                "The view container should get the focused class"
            );
        },

        "Should remove the focused class": function () {
            this["Should add the focused class"]();
            this.view._set('focusMode', false);
            Assert.isFalse(
                this.view.get('container').hasClass('is-focused'),
                "The view container should not get the focused class"
            );
        },

    });

    editorFocusHandlingTest = new Y.Test.Case({
        name: "eZ RichText View editor focus handling test",

        setUp: function () {
            this.field = {id: 42, fieldValue: {xhtml5edit: ""}};
            this.content = new Mock();
            this.version = new Mock();
            this.contentType = new Mock();
            Mock.expect(this.content, {
                method: 'toJSON',
            });
            Mock.expect(this.version, {
                method: 'toJSON',
            });
            Mock.expect(this.contentType, {
                method: 'toJSON',
            });

            this.view = new Y.eZ.RichTextEditView({
                container: '.container',
                field: this.field,
                fieldDefinition: {isRequired: false},
                content: this.content,
                version: this.version,
                contentType: this.contentType,
                config: {
                    rootInfo: {
                        ckeditorPluginPath: '../../..',
                    }
                },
            });
            this.view.render();
        },

        tearDown: function () {
            this.view.destroy();
        },

        "Should add the editor focused class": function () {
            this.view.render();
            this.view.set('active', true);
            this.view.get('editor').get('nativeEditor').fire('focus');
            Assert.isTrue(
                this.view.get('container').hasClass('is-editor-focused'),
                "The editor focused class should be added to the container"
            );
        },

        "Should remove the editor focused class": function () {
            this["Should add the editor focused class"]();
            this.view.get('editor').get('nativeEditor').fire('blur');
            Assert.isFalse(
                this.view.get('container').hasClass('is-editor-focused'),
                "The editor focused class should be removed from the container"
            );
        },
    });

    eventForwardTest = new Y.Test.Case({
        name: "eZ RichText View eventForward test",

        setUp: function () {
            this.field = {id: 42, fieldValue: {xhtml5edit: ""}};
            this.content = new Mock();
            this.version = new Mock();
            this.contentType = new Mock();
            Mock.expect(this.content, {
                method: 'toJSON',
            });
            Mock.expect(this.version, {
                method: 'toJSON',
            });
            Mock.expect(this.contentType, {
                method: 'toJSON',
            });

            this.view = new Y.eZ.RichTextEditView({
                container: '.container',
                field: this.field,
                fieldDefinition: {isRequired: false},
                content: this.content,
                version: this.version,
                contentType: this.contentType,
                config: {
                    rootInfo: {
                        ckeditorPluginPath: '../../..',
                    }
                },
            });
            this.view.render();
        },

        tearDown: function () {
            this.view.destroy();
        },

        _testForwardEvent: function (evtName) {
            var eventInfo = {title: "I Am the Highway"},
                eventFired = false;

            this.view.once(evtName, function (e) {
                eventFired = true;
                Assert.areEqual(
                    eventInfo.title,
                    e.title,
                    "The event should provide the eventInfo"
                );
            });
            this.view.set('active', true);
            this.view.get('editor').get('nativeEditor').fire(evtName, eventInfo);
            Assert.isTrue(
                eventFired,
                "The " + evtName + " event should have been fired"
            );
        },

        "Should forward the contentDiscover event": function () {
            this._testForwardEvent('contentDiscover');
        },

        "Should forward the loadImageVariation event": function () {
            this._testForwardEvent('loadImageVariation');
        },
    });

    appendToolbarConfigTest = new Y.Test.Case({
        name: "eZ RichText View ezaddcontent toolbar config test",

        setUp: function () {
            this.view = new Y.eZ.RichTextEditView();
        },

        tearDown: function () {
            this.view.destroy();
        },

        _testButton: function (identifier) {
            var config = this.view.get('toolbarsConfig').add;

            Assert.isTrue(
                config.buttons.indexOf(identifier) !== -1,
                "The '" + identifier + "' should be configured"
            );
        },

        "Should configure the ezheading button": function () {
            this._testButton('ezheading');
        },

        "Should configure the ezembed button": function () {
            this._testButton('ezembed');
        },

        "Should configure the ezparagraph button": function () {
            this._testButton('ezparagraph');
        },

        "Should configure the ezimage button": function () {
            this._testButton('ezimage');
        },
    });

    registerTest = new Y.Test.Case(Y.eZ.EditViewRegisterTest);
    registerTest.name = "RichText Edit View registration test";
    registerTest.viewType = Y.eZ.RichTextEditView;
    registerTest.viewKey = "ezrichtext";

    Y.Test.Runner.setName("eZ RichText Edit View tests");
    Y.Test.Runner.add(renderTest);
    Y.Test.Runner.add(validateTest);
    Y.Test.Runner.add(getFieldTest);
    Y.Test.Runner.add(editorTest);
    Y.Test.Runner.add(focusModeTest);
    Y.Test.Runner.add(appendToolbarConfigTest);
    Y.Test.Runner.add(registerTest);
    Y.Test.Runner.add(editorFocusHandlingTest);
    Y.Test.Runner.add(eventForwardTest);
}, '', {
    requires: [
        'test',
        'base',
        'view',
        'event-tap',
        'node-event-simulate',
        'fake-toolbarconfig',
        'editviewregister-tests',
        'ez-richtext-editview'
    ]
});
