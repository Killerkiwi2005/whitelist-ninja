console.log("Loading whitelist.js");

var cache = {};
var _toggleHomepage = null;
var storage = new storageWrapper("whitelist");

function init(toggleHomepage){
	
	storage.init(function(){
		// Create whitelist array if there is not one already
		if (!storage.data.whitelist)
			storage.data.whitelist = ["simple.wikipedia.org/*"];

		if (!storage.data.history)
			storage.data.history = [];
		
		if (!storage.data.externalList)
			storage.data.externalList = { active : false, url : null, lastModified : null };	
		
		if (!storage.data.homepage)
			storage.data.homepage = { active : false, url : null, original : null };

		_toggleHomepage = toggleHomepage;
		
		storage.save();
		
		readExternalFile();

	    checkAllTabs();
	});
}

function add(method, url){
	// strip protocol from url
	url = util.stripUrlProtocol(url);
	console.log("NO PROTOCOL : " + url);

	if(method == "domain"){
		domain = util.getDomain(url);
		storage.data.whitelist.push(domain + "*")
	}else{
		// Add url as it is
		storage.data.whitelist.push(url);
	}
	storage.save();
}

function remove(url){
	for(var i = storage.data.whitelist.length-1; i>=0;i--){
		if (storage.data.whitelist[i] == url){
			 storage.data.whitelist.splice(i, 1);
			 storage.save();
		}
	}
}

function isAllowed(url){
	
	// Allow access to all other about: pages
	//if(url.startsWith("about:"))
	//	return true;

	// Allow access to firefox resource pages
	if(url.startsWith(expandUrl("block-ui.html")) || url.startsWith("about:addons") || url.startsWith("about:config") || url.startsWith(expandUrl("admin-ui.html"))){
		return true;
	}

	// Allow access to firefox resource pages
	if(url.startsWith("resource://"))
		return true;

	// Allow whitelisted pages
	if(contains(url))
		return true;
	
	return false;
}


function contains(url){

	url = util.stripUrlProtocol(url);
	
	function checkList(list){
		for(var i=0; i < list.length; i++)	{
			whitelistitem = list[i]
			if(whitelistitem){
				if ( whitelistitem.charAt(whitelistitem.length - 1) != "*" && url === whitelistitem) {
					// Exact match
					return true;
				} else if ( util.stringStartsWith(url, whitelistitem.substring(0, whitelistitem.length - 1)) ) {
					// url starts with 
					return true;
				} else if ( util.stringStartsWith(url, "www." + whitelistitem.substring(0, whitelistitem.length - 1)) ) {
					// url starts with 
					return true;
				}
			}
		}
		return false;
	}
	console.log("Check internal whitelist");
	
	if( checkList(storage.data.whitelist) ){
		return true;
	}
	console.log(JSON.stringify(storage.data.externalList));
	if(storage.data.externalList && storage.data.externalList.active && storage.data.externalList.url)
	{
		var json = readExternalFile();
		console.log("Check external whitelist");
		if(json && json.whitelist && checkList(json.whitelist)){
			return true;
		}
	}
	
	if(storage.data.homepage && storage.data.homepage.active && storage.data.homepage.url)
	{
		console.log("Check custom homepage");
		if(checkList([util.stripUrlProtocol(storage.data.homepage.url)])){
			return true;
		}
	}

	return false;
}

function readExternalFile(){

	// TODO: should really block all requests and check url first to make sure remote source is reloaded before checking
	if(storage.data.externalList && storage.data.externalList.url)
	{
		console.log("external :: " + storage.data.externalList.url);
		util.readTextFromFile(storage.data.externalList.url, function(data){
			 if(data){
				 try{
					var json = JSON.parse(data)
					
					if(json.redirect_homepage != null){
						storage.data.homepage.active = json.redirect_homepage;
						storage.save();
					}
					 
					if(json.homepage_url != null){
						storage.data.homepage.url = json.homepage_url;
						storage.save();
					}
					
					_toggleHomepage();
					
					cache.externalList = json;
				
				 }catch(e){
					 util.alert("Could not read eternal whitelist file :: " +  storage.data.externalList.url);
				 }
			 }
		 });
	}
	return cache.externalList;
}

function blocked(location){

	isActiveTabPrivate(function(result){
		if(result) return;

		var url = util.stripUrlProtocol(location);
		var domain = util.getDomain(url);

		// var idx = storage.history.indexOf(domain); fails, objet compare seems differnt?!?
		for(var i=0; i< storage.data.history.length;i++){
			if(storage.data.history[i].toString() == domain.toString()){
				storage.data.history.splice(i, 1);
				storage.data.history.push(domain);
				storage.save();
				return;
			}
		}	

		if(storage.data.history.length > 20)
			storage.data.history.shift();

		storage.data.history.push(domain);
		
		storage.save();
	});
}

function getList(){
	return storage.data.whitelist;
}

function setList(list){
	storage.data.whitelist = list;
}

function getHistory(){
	return storage.history;
}

function getExternalList(){
	return storage.data.externalList;
}

function setExternalList(active, url){
	 storage.data.externalList.active = active;
	 storage.data.externalList.url = url;
	 storage.save();
	 
	 if(active && url){
		readExternalFile(url);
	 }
}

function getHomepage(){
	return storage.data.homepage;
}

function setHomepage(active, url){
	 storage.data.homepage.active = active;
	 storage.data.homepage.url = url;
	 storage.save();
}

function setOriginalHomepage(url){
	storage.data.homepage.original = url;
	storage.save();
}

function exportWhitelist(exports) {
    exports.init = init;
    exports.add = add;
    exports.remove = remove;
    exports.isAllowed = isAllowed;
    exports.contains = contains;
    exports.blocked = blocked;
    exports.getList = getList;
    exports.setList = setList;
    exports.getHistory = getHistory;
    exports.getExternalList = getExternalList;
    exports.setExternalList = setExternalList;
    exports.getHomepage = getHomepage;
    exports.setHomepage = setHomepage;
    exports.setOriginalHomepage = setOriginalHomepage;
}

if (typeof window === 'undefined') { // running in node.js
    exportWhitelist(exports);
} else { // running in browser
    (function(){
        if(typeof(window.exports) == 'undefined'){
            var exports = {};
            window.whitelist = exports;
        }
        exportWhitelist(exports);
    })();
}
