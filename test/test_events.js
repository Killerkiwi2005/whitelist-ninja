var assert = require('chai').assert;
var sinon = require('sinon');

var chrome = require('sinon-chrome/extensions');
var browser = require('sinon-chrome/webextensions');

describe('WebExtension/lib/events.js', function() {

    before(function () {
        global.chrome = chrome;
        global.browser = browser;

        global.whitelist = {
            init: sinon.spy(),
            isAllowed: sinon.stub(),
            blocked: sinon.spy()
        };
        global.expandUrl = sinon.stub();
        expandUrl.returnsArg(0);

        events = require('../WebExtension/lib/events.js');
    });

    beforeEach(function() {
        isActive = true;
        whitelist.init.reset();
        whitelist.isAllowed.reset();
        whitelist.blocked.reset();
    });

    after(function() {
        chrome.webRequest.onBeforeRequest.removeListeners();
    });

    it('should add onBeforeRequest listener on load', function() {
        assert.ok(chrome.webRequest.onBeforeRequest.addListener.calledOnce);
    });

    it('should redirect on blocked page when not in whitelist', function() {
        var result = events.beforerequest({url: 'some-url', tabId: 'some-tab'});
        assert.deepEqual(result, { redirectUrl: 'data/block-ui.html?some-url' });
        assert.ok(whitelist.blocked.calledWith('some-url'));
    });
    
    it('should not redirect on blocked page when isNotActive', function() {
        isActive = false;
        var result = events.beforerequest({url: 'some-url', tabId: 'some-tab'});
        assert.deepEqual(result, { });
        assert.isNotOk(whitelist.blocked.called);
    });

    it('should not redirect on blocked page when url is in whitelist', function() {
        whitelist.isAllowed.withArgs('some-url').returns(true);
        var result = events.beforerequest({url: 'some-url', tabId: 'some-tab'});
        assert.deepEqual(result, { });
        assert.isNotOk(whitelist.blocked.called);
    });

    it('should not redirect panel ui page', function() {
        var result = events.beforerequest({url: 'data/panel-ui.html', tabId: 'some-tab'});
        assert.deepEqual(result, { });
        assert.isNotOk(whitelist.blocked.called);
    });

    it('should not redirect block ui page', function() {
        var result = events.beforerequest({url: 'data/block-ui.html', tabId: 'some-tab'});
        assert.deepEqual(result, { });
        assert.isNotOk(whitelist.blocked.called);
    });
});

