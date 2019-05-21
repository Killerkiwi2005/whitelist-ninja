var assert = require('chai').assert;
var sinon = require('sinon');

describe('storageWrapper test', function() {

    before(function () {
        chrome = require('sinon-chrome/extensions');
        browser = require('sinon-chrome/webextensions');

        chrome_module = require('../WebExtension/lib/chrome.js');
    });

    beforeEach(function() {
        localStorage = {};
    });

    after(function() {
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

    it('get returns data from local storage', function() {
        localStorage["test storage"] = '{ "test-key": "test-value" }';
    	var storage = chrome_module.storageWrapper("test storage");

		actual = storage.get("test-key");

    	assert.equal(actual, "test-value");
    });

    it('set writes to the local storage', function() {
    	var storage = chrome_module.storageWrapper("test storage");

    	storage.set("test-key", "test-value");

		var data = JSON.parse(localStorage["test storage"]);
    	assert.equal(data["test-key"], "test-value");
    });

    it('save writes data to the local storage', function() {
    	var storage = chrome_module.storageWrapper("test storage");
    	storage.data = { "test-key": "test-value" };

    	storage.save();

		var data = JSON.parse(localStorage["test storage"]);
    	assert.equal(data["test-key"], "test-value");
    });

});

