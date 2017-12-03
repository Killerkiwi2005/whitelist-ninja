const {Cc,Cu,Ci,Cr} = require("chrome");
Cu.import("resource://gre/modules/XPCOMUtils.jsm", this);
const windowUtils = require("sdk/window/utils");
const data = require("sdk/self").data;
const windows = require("sdk/windows");
// Need this just to block about:addons now, looking into better way to do this...

var security = require("./security.js");
var lastAccpetedUrl = null;

function init(isAllowed, isActive){

	// implement nsIWebProgress interface
	urlBarListener = {
		// nsIWebProgressListener
		QueryInterface: XPCOMUtils.generateQI(["nsIWebProgressListener",
											   "nsISupportsWeakReference"]),
		onStateChange: function() {},
		onProgressChange: function() {},
		onStatusChange: function() {},
		onSecurityChange: function() {},
		onLinkIconAvailable: function() {},

		// called when uri of document of current tab is changed
		onLocationChange: function(aBrowser, aWebProgress, aRequest, aLocation) {
			var url = aLocation.spec.toString();
			console.log("url :: " + url);

			// Admin pages
			if(url.startsWith(data.url("admin-ui.html"))){
				if(security.checkPassword()){
					return;
				}else{
					aWebProgress.DOMWindow.location.replace(data.url("block-ui.html") + "?" + escape(escape(url)));
					return;
				}
			}

			var active = isActive();
			if(!active)
				return;
			
			if (aWebProgress.DOMWindow.top != aWebProgress.DOMWindow)
				return;
			
			// Admin pages
			if(url.startsWith("about:addons") || url.startsWith("about:config")){
				console.log("ADMIN PAGE : " + url);
				if(security.checkPassword()){
					return
				}else{
					aWebProgress.DOMWindow.location.replace(data.url("block-ui.html") + "?" + escape(escape(url)));
				}
			}		
		}
	}

	// Bind event handler to window
	function initWindowEvents(window){
		var gBrowser = windowUtils.getMostRecentBrowserWindow().getBrowser();
		gBrowser.addTabsProgressListener(urlBarListener);
		windowUtils.getMostRecentBrowserWindow().addEventListener("unload", function() { 
			window.gBrowser.removeProgressListener(urlBarListener);
		}, false);
	}
/*
	// bind existing windows
	for each (let window in windowUtils.windows(null, {includePrivate:true})) {
		initWindowEvents(window)
	}*/
	// bind existing windows Method 2
	for each (let window in windows.browserWindows) {
		initWindowEvents(window)
	}

	// Look for new windows
	windows.browserWindows.on('open', function(window) {
		initWindowEvents(window); 
	});
}


exports.init = init;