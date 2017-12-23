var assert = require('chai').assert;
var sinon = require('sinon');

describe('WebExtension/lib/events.js', function() {

    before(function () {
        chrome = require('sinon-chrome/extensions');
        browser = require('sinon-chrome/webextensions');

        whitelist = {
            init: sinon.spy(),
            isAllowed: sinon.stub(),
            blocked: sinon.spy()
        };
        expandUrl = sinon.stub().returnsArg(0);

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
        assert.isOk(chrome.webRequest.onBeforeRequest.addListener.calledWith(events.beforerequest, {urls: ["<all_urls>"],  types: ["main_frame"]}, ['blocking']));
    });

    it('should redirect on blocked page when not in whitelist', function() {
        var result = events.beforerequest({url: 'some-url', tabId: 'some-tab'});

        assert.deepEqual(result, { redirectUrl: 'data/block-ui.html?some-url' });
        assert.isOk(whitelist.blocked.calledWith('some-url'));
    });
    
    it('should not redirect on blocked page when isNotActive', function() {
        isActive = false;
        
        var result = events.beforerequest({url: 'some-url', tabId: 'some-tab'});

        assert.deepEqual(result, { });
        assert.isOk(whitelist.blocked.notCalled);
    });

    it('should not redirect on blocked page when url is in whitelist', function() {
        whitelist.isAllowed.withArgs('some-url').returns(true);

        var result = events.beforerequest({url: 'some-url', tabId: 'some-tab'});

        assert.deepEqual(result, { });
        assert.isOk(whitelist.blocked.notCalled);
    });

    it('should not redirect panel ui page', function() {
        var result = events.beforerequest({url: 'data/panel-ui.html', tabId: 'some-tab'});

        assert.deepEqual(result, { });
        assert.isOk(whitelist.blocked.notCalled);
    });

    it('should not redirect block ui page', function() {
        var result = events.beforerequest({url: 'data/block-ui.html', tabId: 'some-tab'});

        assert.deepEqual(result, { });
        assert.isOk(whitelist.blocked.notCalled);
    });
});

