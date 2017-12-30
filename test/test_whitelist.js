var assert = require('chai').assert;
var sinon = require('sinon');

describe('WebExtension/lib/whitelist.js', function() {

    var storage;
    var toggleHomepage = sinon.spy();

    before(function() {
        chrome = require('sinon-chrome/extensions');
        browser = require('sinon-chrome/webextensions');

        storageWrapper = function() {
            storage = this;
            this.data = {};
            this.init = sinon.spy(function(callback) {
                callback();
            });
            this.save = sinon.spy();
        };
        checkAllTabs = sinon.spy();
        util = {
            readTextFromFile: sinon.spy(),
            alert: sinon.spy(),
            stripUrlProtocol: sinon.stub(),
            getDomain: sinon.stub(),
            stringStartsWith: sinon.stub()
        };
        expandUrl = sinon.stub().returnsArg(0);

        whitelist = require('../WebExtension/lib/whitelist.js');
    });

    beforeEach(function() {
        storage.save.reset();
        checkAllTabs.reset();
        toggleHomepage.reset();
        util.readTextFromFile.reset();
        util.alert.reset();
        util.stripUrlProtocol.reset();
        util.getDomain.reset();
        util.stringStartsWith.reset();
    });

    it('init should initalize empty storage', function() {
        whitelist.init();

        assert.deepEqual(storage.data.whitelist, ["simple.wikipedia.org/*"]);
        assert.deepEqual(storage.data.history, []);
        assert.deepEqual(storage.data.externalList, { active : false, url : null, lastModified : null });
        assert.deepEqual(storage.data.homepage, { active : false, url : null, original : null });
        assert.isOk(storage.save.called);
        assert.isOk(checkAllTabs.called);
    });

    it('init should read external list if storage contains it', function() {
        storage.data.externalList = { url: 'external-list-json' };
        util.readTextFromFile = sinon.spy(function(url, callback) {
            if (url === 'external-list-json') {
                callback('{ "redirect_homepage": true, "homepage_url": "homepage-url" }');
            }
        });

        whitelist.init(toggleHomepage);

        assert.isOk(util.alert.notCalled);
        assert.equal(storage.data.homepage.active, true);
        assert.equal(storage.data.homepage.url, 'homepage-url');
        assert.isOk(storage.save.called);
        assert.isOk(toggleHomepage.called);
    });

    it('alert should be raised if external list JSON contains errors', function() {
        storage.data.externalList = { url: 'incorrect-json' };
        storage.data.homepage = { active : false, url : null, original : null };
        util.readTextFromFile = sinon.spy(function(url, callback) {
            if (url === 'incorrect-json') {
                callback('{ : }');
            }
        });

        whitelist.init(toggleHomepage);

        assert.isOk(util.alert.called);
        assert.isOk(toggleHomepage.notCalled);
        assert.deepEqual(storage.data.homepage, { active : false, url : null, original : null });
    });

    it('url is added to whitelist', function() {
        storage.data.whitelist = [ 'url-1' ];
        util.stripUrlProtocol.withArgs('protocol://domain/some-url').returns('domain/some-url');

        whitelist.add('', 'protocol://domain/some-url');

        assert.isOk(storage.save.called);
        assert.deepEqual(storage.data.whitelist, [ 'url-1', 'domain/some-url' ]);
    });

    it('wildcard url is added to whitelist when domain method is set', function() {
        storage.data.whitelist = [ 'url-1' ];
        util.stripUrlProtocol.withArgs('protocol://domain/some-url').returns('domain/some-url');
        util.getDomain.withArgs('domain/some-url').returns('domain')

        whitelist.add('domain', 'protocol://domain/some-url');

        assert.isOk(storage.save.called);
        assert.deepEqual(storage.data.whitelist, [ 'url-1', 'domain*' ]);
    });

    it('url is removed from whitelist', function() {
        storage.data.whitelist = [ 'url-1', 'url-2', 'url-3' ];
        
        whitelist.remove('url-2');

        assert.deepEqual(storage.data.whitelist, [ 'url-1', 'url-3' ]);
        assert.isOk(storage.save.called);
    });

    it('block-ui.html is allowed', function() {
        assert.isOk(whitelist.isAllowed('block-ui.html'));
    });

    it('admin-ui.html is allowed', function() {
        assert.isOk(whitelist.isAllowed('admin-ui.html'));
    });

    it('about:addons is allowed', function() {
        assert.isOk(whitelist.isAllowed('about:addons'));
    });

    it('about:config is allowed', function() {
        assert.isOk(whitelist.isAllowed('about:config'));
    });

    it('resource://* is allowed', function() {
        assert.isOk(whitelist.isAllowed('resource://something'));
    });

    it('url is allowed when it is in whitelist', function() {
        storage.data.whitelist = [ 'url-1', 'domain/some-url', 'url-3' ];
        util.stripUrlProtocol.withArgs('protocol://domain/some-url').returns('domain/some-url');

        assert.isOk(whitelist.isAllowed('protocol://domain/some-url'));
    });

    it('url is allowed when domain is in whitelist', function() {
        storage.data.whitelist = [ 'url-1', 'domain*', 'url-3' ];
        util.stripUrlProtocol.withArgs('protocol://domain/some-url').returns('domain/some-url');
        util.stringStartsWith.withArgs('domain/some-url', 'domain').returns(true);

        assert.isOk(whitelist.isAllowed('protocol://domain/some-url'));
    });

    it('url is allowed when it starts with www plus domain from whitelist', function() {
        storage.data.whitelist = [ 'url-1', 'domain*', 'url-3' ];
        util.stripUrlProtocol.withArgs('protocol://www.domain/some-url').returns('www.domain/some-url');
        util.stringStartsWith.withArgs('www.domain/some-url', 'www.domain').returns(true);

        assert.isOk(whitelist.isAllowed('protocol://www.domain/some-url'));
    });

    it('url is allowed when it is in external whitelist', function() {
        storage.data.whitelist = [ ];
        storage.data.externalList = { active: true, url: 'external-list-json' };
        util.stripUrlProtocol.withArgs('protocol://domain/some-url').returns('domain/some-url');
        util.stringStartsWith.withArgs('domain/some-url', 'domain/some-url').returns(true);
        util.readTextFromFile = sinon.spy(function(url, callback) {
            if (url === 'external-list-json') {
                callback('{ "whitelist": [ "url-1", "domain/some-url", "url-3" ] }');
            }
        });

        assert.isOk(whitelist.isAllowed('protocol://domain/some-url'));
    });

    it('url is allowed when it is a homepage', function() {
        storage.data.whitelist = [ ];
        storage.data.externalList = { active: false };
        storage.data.homepage = { active : true, url : 'protocol://domain/some-url' };
        util.stripUrlProtocol.withArgs('protocol://domain/some-url').returns('domain/some-url');
        util.stringStartsWith.withArgs('domain/some-url', 'domain/some-url').returns(true);

        assert.isOk(whitelist.isAllowed('protocol://domain/some-url'));
    });

    it('url is denied if it is not in whitelist', function() {
        storage.data.whitelist = [ 'url-1' ];
        storage.data.externalList = { active: false };
        storage.data.homepage = { active : false };
        util.stripUrlProtocol.withArgs('protocol://domain/some-url').returns('domain/some-url');
        util.stringStartsWith.withArgs('domain/some-url', 'domain/some-url').returns(true);

        assert.isNotOk(whitelist.isAllowed('protocol://domain/some-url'));
    });

    it('blocked url is not kept in history, if active tab is private', function() {
        isActiveTabPrivate = sinon.spy(function(callback) { callback(true); });

        whitelist.blocked('protocol://domain/some-url'); 

        assert.isOk(storage.save.notCalled);
    });

    it('blocked url is kept in history', function() {
        storage.data.history = [ 'url-1' ];
        isActiveTabPrivate = sinon.spy(function(callback) { callback(false); });
        util.stripUrlProtocol.withArgs('protocol://domain/some-url').returns('domain/some-url');
        util.getDomain.withArgs('domain/some-url').returns('domain');

        whitelist.blocked('protocol://domain/some-url'); 

        assert.isOk(storage.save.called);
        assert.deepEqual(storage.data.history, [ 'url-1', 'domain' ]);
    });

    it('blocked url domain replaces previous occurence in history', function() {
        storage.data.history = [ 'domain', 'url-1' ];
        isActiveTabPrivate = sinon.spy(function(callback) { callback(false); });
        util.stripUrlProtocol.withArgs('protocol://domain/some-url').returns('domain/some-url');
        util.getDomain.withArgs('domain/some-url').returns('domain');

        whitelist.blocked('protocol://domain/some-url'); 

        assert.isOk(storage.save.called);
        assert.deepEqual(storage.data.history, [ 'url-1', 'domain' ]);
    });

    it('21 last blocked urls are kept in history', function() {
        var maxHistorySize = 21;
        var lastDomain = 'domain-' + maxHistorySize;
        storage.data.history = [];
        for (var i = 0; i < maxHistorySize; ++i) {
            storage.data.history.push('domain-' + i);
        }
        var expectedHistory = storage.data.history.slice();
        expectedHistory.shift();
        expectedHistory.push(lastDomain);
        isActiveTabPrivate = sinon.spy(function(callback) { callback(false); });
        util.stripUrlProtocol.withArgs('protocol://' + lastDomain + '/some-url').returns(lastDomain + '/some-url');
        util.getDomain.withArgs(lastDomain + '/some-url').returns(lastDomain);

        whitelist.blocked('protocol://' + lastDomain + '/some-url'); 

        assert.isOk(storage.save.called);
        assert.deepEqual(storage.data.history, expectedHistory);
    });

    it('setExternalList method reads external file if external list is active', function() {
        storage.data.externalList = {};

        whitelist.setExternalList(true, 'external-list-json');

        assert.isOk(storage.save.called);
        assert.isOk(util.readTextFromFile.calledWith('external-list-json'));
        assert.deepEqual(storage.data.externalList, { active: true, url: 'external-list-json' });
    });

    it('setExternalList method doesn\'t read external file if external list is NOT active', function() {
        storage.data.externalList = {};

        whitelist.setExternalList(false, 'external-list-json');

        assert.isOk(storage.save.called);
        assert.isOk(util.readTextFromFile.notCalled);
        assert.deepEqual(storage.data.externalList, { active: false, url: 'external-list-json' });
    });

    it('setList saves whitelist data', function() {
        storage.data.whitelist = [];

        whitelist.setList([ 'url' ]);
        
        assert.isOk(storage.save.called);
        assert.deepEqual(storage.data.whitelist, [ 'url' ]);
    });

    it('setHomepage saves data', function() {
        storage.data.homepage = {}; 

        whitelist.setHomepage(true, 'url');
        
        assert.isOk(storage.save.called);
        assert.deepEqual(storage.data.homepage, { active: true, url: 'url' });
    });

    it('setOriginalHomepage saves data', function() {
        storage.data.homepage = {}; 

        whitelist.setOriginalHomepage('url');
        
        assert.isOk(storage.save.called);
        assert.deepEqual(storage.data.homepage, { original: 'url' });
    });
});
