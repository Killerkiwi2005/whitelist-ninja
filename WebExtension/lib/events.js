
// https://developer.chrome.com/extensions/webRequest#type-RequestFilter
var beforerequest = function(details) {
	console.log("beforerequest called details: " + JSON.stringify(details));
	
	var url = details.url;
	//details.url
	//details.frameId // 0 = main frame 
	//details.parentFrameId
    //details.tabId

	if (!isActive) return {};

	if(url.startsWith(expandUrl("data/panel-ui.html"))){
		return {};
	}
	
	if(url.startsWith(expandUrl("data/block-ui.html"))){
		return {};
	}
	
	// Allow whitelisted pages
	if(whitelist.isAllowed(url)){
		if(url.startsWith(expandUrl("data/block-ui.html"))){
			updateButtonIcon(false);
		}
		return {};
	}

	// Redirect to block page
	whitelist.blocked(url);
    var blockUrl = expandUrl("data/block-ui.html") + "?" + escape(escape(url));
    redirectWorkAround(details.tabId, blockUrl); // TODO: Remove this once redirect works correctly
	return { redirectUrl : blockUrl}; //cancel: true , 
};
// BUG in chrome prevents redirect from working correctly
function redirectWorkAround(tabId, url){
	setTimeout( function() { chrome.tabs.update(tabId, {url: url}); }, 10);
}
var filter = {urls: ["<all_urls>"],  types: ["main_frame"]};
// Filter options : ", "sub_frame" stylesheet", "script", "image", "object", "xmlhttprequest", or "other"
chrome.webRequest.onBeforeRequest.addListener(beforerequest, filter, ['blocking']);
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {

});
/*
var port = null;
if(chrome && chrome.extension && chrome.extension.connect){
    // chrome only
    port = chrome.extension.connect({name: "panel-ui"});
    chrome.extension.onConnect.addListener(function(port) {
      port.onMessage.addListener(function(msg) {
            alert("message recieved"+ msg);
            port.postMessage("Hi Popup.js");
      });
    });    
}else{
    // generic
    var port = browser.runtime.connect({name: "panel-ui"});
    browser.runtime.onConnect.addListener(function(port) {
      port.onMessage.addListener(function(msg) {
            alert("message recieved"+ msg);
            port.postMessage("Hi Popup.js");
      });
    });  
/ *
    // BLOCK UI PORT
    var portBlockUI = browser.runtime.connect({name: "block-ui"});
    browser.runtime.onConnect.addListener(function(port) {
      port.onMessage.addListener(function(msg, sender) {
            dataUiMessage(msg, sender);
      });
    }); * /
}
*/

var panelPort = null;
var securityPort = null;

browser.runtime.onConnect.addListener(function(port) {
    console.log("browser.runtime.onConnect");
    port.onMessage.addListener(function(msg, sender) {
        
        switch(port.name){
            case "panel-ui":
                panelPort = port;
                panelUI(msg, sender, port);
                break;
                
             case "block-ui":
                 blockUI(msg, sender, port);
                break;

            case "password-ui":
                security.passwordUI(msg, sender, port);
                break;

            case "admin-ui":
                adminUI(msg, sender, port);
                break;

            default:
                console.log(msg);
                port.postMessage(port.name);     
        }
    });
});  

browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    
});

if (typeof window === 'undefined') { // running in node.js
    module.exports.beforerequest = beforerequest;
} else { // running in browser
}





