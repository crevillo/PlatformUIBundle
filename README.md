# Platform UI Bundle

[![Build Status](https://travis-ci.org/ezsystems/PlatformUIBundle.svg?branch=master)](https://travis-ci.org/ezsystems/PlatformUIBundle)

PlatformUIBundle is a bundle for eZ Platform providing a web application
to manage your content and administrate your eZ Platform install.

If you find a bug, please create an issue [in JIRA](https://jira.ez.no/) and
don't forget to add as much details as you can (steps to reproduce, OS and
browser(s) versions, ...) and to put *PlatformUI* in the *Component/s* field.
If you discover a security issue, please see how to responsibly report such
issues on https://doc.ez.no/Security

## Installation

**eZ Platform 1.0 (2015.11) or higher are required to run the PlatformUI.**

If you are using a recent clone of the ezplatform repository,
PlatformUIBundle is automatically setup. So you can directly open
http://[uri\_of\_ez]/ez in your favorite browser.

On an existing installation, here's what you need to do:

* From your eZ Publish installation, run composer:

  ```
  $ composer require ezsystems/platform-ui-bundle:dev-master
  ```

* In `app/AppKernel.php` add an instance of the following classes to
  the list of registered bundles:

  ```php
  public function registerBundles()
  {
      $bundles = array(
          // enabled bundles
          // ...

          new EzSystems\PlatformUIBundle\EzSystemsPlatformUIBundle(),
          new EzSystems\PlatformUIAssetsBundle\EzSystemsPlatformUIAssetsBundle(),
          new  EzSystems\RepositoryFormsBundle\EzSystemsRepositoryFormsBundle(),
      );
  }
  ```

* In `app/config/routing.yml` include the eZPlatformUIBundle routing
  configuration:

  ```yml
  _ezpublishPlatformUIRoutes:
      resource: "@eZPlatformUIBundle/Resources/config/routing.yml"
  ```
* [Configure the REST API to use the session based authentication](https://doc.ez.no/display/EZP/REST+API+Authentication).
* Run the following command:

  ```
  $ php app/console assets:install --symlink
  ```
If you are running eZ Publish in the `prod` environment, you also need to dump
the assets for Assetic with:

```
php app/console assetic:dump --env=prod
```

Once this is done, you can go to http://[uri\_of\_ez]/ez to run the eZ Platform
UI application.

## Developers tasks

Most developer related tasks can be run with [Grunt](http://gruntjs.com/) and
have several additional dependencies:

* Install grunt, yuidoc, bower and grover globally (usually you need to be root):

  ```
  # npm install -g grunt-cli yuidocjs grover bower gulp
  ```
* Install [phantomjs](http://phantomjs.org) version 1.9.x
* Install local npm and bower dependencies, from the bundle root, run:

  ```
  $ npm install
  $ bower install
  ```

Once this is done, you can use any tasks registered in Grunt, the most
interesting are:

* Running the JavaScript unit tests

  ```
  $ grunt test
  ```
* Running a single JavaScript unit test

  ```
  $ grover --server --console Tests/js/foo/bar/somefile.html
  ```
* Generate a code coverage from those tests:

  ```
  $ grunt coverage
  ```
  The HTML coverage report is then available in `Tests/report/lcov-report/index.html`.
* Generate the JavaScript API doc:

  ```
  $ grunt doc
  ```
* Alternatively, you can run [a live documentation
  server](http://yui.github.io/yuidoc/args/index.html#server) that will be
  available at http://127.0.0.1:3000 :

  ```
  $ grunt livedoc
  ```
* Update the custom AlloyEditor skin:

  ```bash
  $ composer install # or composer update
  $ cd vendor/ezsystems/platform-ui-assets-bundle/Resources/public/vendors/alloy-editor/
  $ npm install
  $ cd -
  $ grunt alloy-css
  ```

To run the PHP unit tests, you first need to install the dev dependencies of the
bundle. To do that, from the bundle root, run:

```
$ composer install --prefer-dist
```

Then, you can run the unit tests with:

```
$ php vendor/bin/phpunit
```
