/*
 * Copyright (C) eZ Systems AS. All rights reserved.
 * For full copyright and license information view LICENSE file distributed with this source code.
 */
YUI.add('ez-locationswapplugin-tests', function (Y) {
    var tests, registerTest, swapLocationTest,
        Assert = Y.Assert, Mock = Y.Mock;

    tests = new Y.Test.Case({
        name: "eZ Location Swap Plugin event tests",

        setUp: function () {
            this.service = new Y.Base();
            this.view = new Y.View();

            this.plugin = new Y.eZ.Plugin.LocationSwap({
                host: this.service
            });
        },

        tearDown: function () {
            this.plugin.destroy();
            this.view.destroy();
            this.service.destroy();
            delete this.plugin;
            delete this.view;
            delete this.service;
        },

        "Should trigger content discovery widget on `swapLocation` event": function () {
            var contentDiscoverTriggered = false,
                containerContentType = new Y.Mock(),
                nonContainerContentType = new Y.Mock();

            Y.Mock.expect(containerContentType, {
                method: 'get',
                args: ['isContainer'],
                returns: true
            });
            Y.Mock.expect(nonContainerContentType, {
                method: 'get',
                args: ['isContainer'],
                returns: false
            });

            this.service.on('contentDiscover', function (e) {
                contentDiscoverTriggered = true;
                Assert.isString(e.config.title, 'The `title` param in config should be string');
                Assert.isFunction(
                    e.config.contentDiscoveredHandler,
                    'The `contentDiscoveredHandler` param should be function'
                );
                Assert.isFalse(e.config.multiple, 'The `multiple` param in config should be set to TRUE');
                Assert.isTrue(e.config.isSelectable, 'The `isSelectable` param in config should be set to TRUE');
            });

            this.service.fire('swapLocation', {});

            Assert.isTrue(
                contentDiscoverTriggered,
                "The `contentDiscover` event should have been fired"
            );
        },
    });

    swapLocationTest = new Y.Test.Case({
        name: "eZ Location Swap Plugin event tests",

        setUp: function () {
            this.service = new Y.Base();
            this.view = new Y.View();
            this.app = new Mock();
            this.view.addTarget(this.service);
            this.capi = new Mock();
            this.contentServiceMock = new Mock();
            this.contentJson = {
                'id': '/content/Sergio/Aguero',
                'name': 'Sergio Aguero',
                'languageCode': 'esl-ES'
            };
            this.contentInfoMock = this._getContentInfoMock(this.contentJson);
            this.locationJson = {
                'id': '/location/Sergio/Aguero',
                'contentInfo': this.contentInfoMock
            };
            this.location = this._getLocationMock(this.locationJson);

            this.service.set('capi', this.capi);
            this.service.set('location', this.location);

            Mock.expect(this.capi, {
                'method': 'getContentService',
                'returns': this.contentServiceMock
            });

            this.plugin = new Y.eZ.Plugin.LocationSwap({
                host: this.service
            });
        },

        tearDown: function () {
            this.plugin.destroy();
            this.view.destroy();
            this.service.destroy();
            delete this.plugin;
            delete this.view;
            delete this.service;
            delete this.app;
        },

        _getLocationMock: function (attrs) {
            var locationMock = new Mock();

            Mock.expect(locationMock, {
                'method': 'get',
                'args': [Mock.Value.String],
                'run': function (attr) {
                    switch (attr) {
                        case 'id':
                            return attrs.id;
                        case 'contentInfo':
                            return attrs.contentInfo;
                        default:
                            Assert.fail('Trying to `get` incorrect attribute');
                            break;
                    }
                }
            });

            return locationMock;
        },

        _getContentInfoMock: function (attrs) {
            var contentInfoMock = new Mock();

            Mock.expect(contentInfoMock, {
                'method': 'get',
                'args': [Mock.Value.String],
                'run': function (attr) {
                    switch (attr) {
                        case 'id':
                            return attrs.id;
                        case 'name':
                            return attrs.name;
                        case 'mainLanguageCode':
                            return attrs.languageCode;
                        default:
                            Assert.fail('Trying to `get` incorrect attribute');
                            break;
                    }
                }
            });

            return contentInfoMock;
        },

        _getSelection: function () {
            this.destinationContent = {'id': '/content/Fernando/Torres', 'name': 'Fernando Torres'};
            this.destinationContentInfo = this._getContentInfoMock(this.destinationContent);
            this.destinationLocation = {'id': '/location/Fernando/Torres', 'contentInfo': this.destinationContentInfo};

            return {location: this._getLocationMock(this.destinationLocation)};
        },

        "Should swap locations and fire notifications": function () {
            var startNotificationFired = false,
                successNotificationFired = false,
                errorNotificationFired = false,
                appNaviateCalled = false,
                that = this;

            this.service.set('app', {
                navigateTo: function (routeName, params) {
                    appNavigateCalled = true;

                    Assert.areEqual('viewLocation', routeName, 'The route name should be `viewLocation`');
                    Assert.areEqual(
                        params.id,
                        that.contentJson.resources.MainLocation,
                        'Id of main location of content should be passed as id param'
                    );
                    Assert.areEqual(
                        params.languageCode,
                        that.contentJson.mainLanguageCode,
                        'Main language code of content should be passed as language param'
                    );
                }
            });

            this.service.on('contentDiscover', function (e) {
                var config = {
                    selection: that._getSelection(),
                    target: {
                        get: function () {}
                    }
                };

                e.config.contentDiscoveredHandler(config);
            });

            Mock.expect(this.location, {
                'method': 'swap',
                'args': [Mock.Value.Object, Mock.Value.Object, Mock.Value.Function],
                'run': function (options, destinationLocation, callback) {
                    Assert.areSame(
                        options.api,
                        that.capi,
                        'CAPI should be passed as param'
                    );
                    callback(false);
                }
            });

            this.service.on('notify', function (e) {
                if (e.notification.state === 'started') {
                    startNotificationFired = true;
                    Assert.isTrue(
                        (e.notification.text.indexOf(that.contentJson.name) >= 0),
                        "The notification should contain name of content"
                    );
                    Assert.isTrue(
                        (e.notification.identifier.indexOf(that.locationJson.id) >= 0),
                        "The notification should contain id of location"
                    );
                    Assert.areEqual(
                        e.notification.timeout, 5,
                        "The timeout of notification should be set to 5"
                    );
                }
                if (e.notification.state === 'done') {
                    successNotificationFired = true;
                    Assert.isTrue(
                        (e.notification.text.indexOf(that.contentJson.name) >= 0),
                        "The notification should contain name of content"
                    );
                    Assert.isTrue(
                        (e.notification.identifier.indexOf(that.locationJson.id) >= 0),
                        "The notification should contain id of location"
                    );
                    Assert.isTrue(
                        (e.notification.text.indexOf(that.destinationContent.name) >= 0),
                        "The notification should contain name of destination content"
                    );
                    Assert.areEqual(
                        e.notification.timeout, 5,
                        "The timeout of notification should be set to 5"
                    );
                }
                if (e.notification.state === 'error') {
                    errorNotificationFired = true;
                }
            });

            this.service.fire('swapLocation', {});

            Mock.expect(this.app, {
                method: 'navigateTo',
                args: ['viewLocation', Mock.Value.Object],
            });

            Assert.isTrue(startNotificationFired, 'Should fire notification with `started` state');
            Assert.isTrue(successNotificationFired, 'Should fire notification with `done` state');
            Assert.isFalse(errorNotificationFired, 'Should not fire notification with `error` state');
        },

        "Should fire notifications if swap fails": function () {
            var startNotificationFired = false,
                successNotificationFired = false,
                errorNotificationFired = false,
                that = this;

            this.service.on('contentDiscover', function (e) {
                var config = {
                    selection: that._getSelection(),
                    target: {
                        get: function (attr) {
                            switch (attr) {
                                case 'data':
                                    return {afterSwapLocationCallback: afterSwapLocationCallback};
                            }
                        }
                    }
                };

                e.config.contentDiscoveredHandler(config);
            });

            Mock.expect(this.location, {
                'method': 'swap',
                'args': [Mock.Value.Object, Mock.Value.Object, Mock.Value.Function],
                'run': function (options, destinationLocation, callback) {
                    Assert.areSame(
                        options.api,
                        that.capi,
                        'CAPI should be passed as param'
                    );
                    callback(true);
                }
            });

            this.service.on('notify', function (e) {
                if (e.notification.state === 'started') {
                    startNotificationFired = true;
                    Assert.isTrue(
                        (e.notification.text.indexOf(that.contentJson.name) >= 0),
                        "The notification should contain name of content"
                    );
                    Assert.isTrue(
                        (e.notification.identifier.indexOf(that.locationJson.id) >= 0),
                        "The notification should contain id of location"
                    );
                    Assert.areEqual(
                        e.notification.timeout, 5,
                        "The timeout of notification should be set to 5"
                    );
                }
                if (e.notification.state === 'done') {
                    successNotificationFired = true;
                    Assert.isTrue(
                        (e.notification.text.indexOf(that.contentJson.name) >= 0),
                        "The notification should contain name of content"
                    );
                    Assert.isTrue(
                        (e.notification.identifier.indexOf(that.locationJson.id) >= 0),
                        "The notification should contain id of location"
                    );
                    Assert.isTrue(
                        (e.notification.text.indexOf(that.destinationContent.name) >= 0),
                        "The notification should contain name of destination content"
                    );
                    Assert.areEqual(
                        e.notification.timeout, 5,
                        "The timeout of notification should be set to 5"
                    );
                }
                if (e.notification.state === 'error') {
                    errorNotificationFired = true;
                }
            });

            this.service.fire('swapLocation', {});

            Assert.isTrue(startNotificationFired, 'Should fire notification with `started` state');
            Assert.isFalse(successNotificationFired, 'Should fire notification with `done` state');
            Assert.isTrue(errorNotificationFired, 'Should fire notification with `error` state');
        },

        "Should navigate to the location when swap doesn't fail": function () {

        }
    });

    registerTest = new Y.Test.Case(Y.eZ.Test.PluginRegisterTest);
    registerTest.Plugin = Y.eZ.Plugin.LocationSwap;
    registerTest.components = ['locationViewViewService'];

    Y.Test.Runner.setName("eZ Location Swap Plugin tests");
    Y.Test.Runner.add(tests);
    Y.Test.Runner.add(swapLocationTest);
    Y.Test.Runner.add(registerTest);
}, '', {requires: ['test', 'view', 'base', 'ez-locationswapplugin', 'ez-pluginregister-tests']});
