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

    it('storage calls callback', function() {
    	var callback = sinon.spy();
    	var storage = chrome_module.storageWrapper("test storage");

    	storage.init(callback);

        assert.isOk(callback.called);
    });

    it('initialization callback has access to the storage', function() {
    	var storage = chrome_module.storageWrapper("test storage");
        localStorage["test storage"] = '{ "test-key": "test-value" }';
    	var callback = sinon.spy(function() {
    		assert.equal(storage.get("test-key"), "test-value");
    	});

    	storage.init(callback);
    });

});

