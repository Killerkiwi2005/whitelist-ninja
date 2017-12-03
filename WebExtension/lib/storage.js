

function storageWrapper(name){

	var self = this;
	self.data = {};
	var storageName = name || "default";

	self.init = function(cb){
		browser.storage.local.get(storageName, function (result) {
		    cb(result[storageName]);
		});
	};

	self.set = function(key, value){
		data[key] = vakue;
		self.save();
	}
	
	self.get = function(key){
		return data[key];
	}

	self.save = function(){
	    browser.storage.local.set({ storageName : data });
	}
	
	self.init();
}