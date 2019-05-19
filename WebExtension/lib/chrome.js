

function storageWrapper(name){

	var self = this;
	self.data = {};
	var storageName = name || "default";

	self.init = function(cb){
		var s = localStorage[storageName];
		data = s ? JSON.parse(s) : {};
		if(cb) cb();
	};

	self.set = function(key, value){
		data[key] = value;
		self.save();
	}
	
	self.get = function(key){
		return data[key];
	}

	self.save = function(){
		localStorage[storageName] = JSON.stringify(data);
	}
	
	self.init();
	return self
}

function expandUrl(url){
	// data.url("block-ui.html")
	return chrome.extension.getURL(url).toString();
}

function isActiveTabPrivate(cb){
	// Do not track private tabs
	//if(privateBrowsing.isPrivate(tabs && tabs.activeTab))
	//	return;

	return  chrome.tabs.query({active: true, lastFocusedWindow: true }, function(tabs){ cb(tabs[0].incognito)}) 
}

if (typeof window === 'undefined') { // running in node.js
    module.exports.storageWrapper = storageWrapper;
} else { // running in browser
}
