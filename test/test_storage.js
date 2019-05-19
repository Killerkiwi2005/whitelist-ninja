var assert = require('chai').assert;
var sinon = require('sinon');

describe('storageWrapper test', function() {

    before(function () {
        chrome = require('sinon-chrome/extensions');
        browser = require('sinon-chrome/webextensions');

        localStorage = {};

        chrome_module = require('../WebExtension/lib/chrome.js');
    });

    beforeEach(function() {
    });

    after(function() {
        localStorage = {};
    });

    it('storage should call callback', function() {
    	var callback = sinon.spy();
    	var storage = chrome_module.storageWrapper("test storage");

    	storage.init(callback);

        assert.isOk(callback.called);
    });

});

