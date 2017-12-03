const FILTERS = [/.*/, //
      /.*\.html?$/, //
      /.*\.txt$/, //
      /.*\.css$/, //
      /.*\.js$/, //
      ];
	  
	  
function stringStartsWith (value, search) {     
	  if(!value || !search) return false;
      return value.toString().toLowerCase().startsWith(search.toString().toLowerCase());
};

function escapeSearchString(text) {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&").replace("*",".*");
};   

function stripUrlProtocol(url){
	return url.toString().replace(/.*?:\/\//g, "");
}

function getDomain(url){
	domain = url.match(/[^\/]+\//);
	return domain;
}

function prompt(heading, text){
	var input  = {value: ""};  
	var check = {value: false};	
	var result = promptSvc.prompt(null, heading, text, input, null, check);
	if(result) return input.value;
	return null;
}

function pickFile(title){
    var mode = Ci.nsIFilePicker.modeOpen;
    fp.init(utils.getMostRecentBrowserWindow(), title || "Select whitelist file", mode);
    fp.appendFilters(Ci.nsIFilePicker.filterAll);
    var rv = fp.show();
    if (rv == Ci.nsIFilePicker.returnOK || rv == Ci.nsIFilePicker.returnReplace) {
		var file = fp.file;
		if(file)
			return fp.file.path;
    }
	return null;
}

function readTextFromFile(url, cb) {
	
  // remote file
 if(url.startsWith("http:") || url.startsWith("https:"))	{
	// Be a good consumer and check for rate limiting before doing more.
	Request({
	  url: url,
	  onComplete: function (response) {
		  if(cb) cb(response.text) 
	  }
	}).get();	 
	return null;
 }
  // Local file
  var text = null;
  if (fileIO.exists(url)) {
    var TextReader = fileIO.open(url, "r");
    if (!TextReader.closed) {
      text = TextReader.read();
      TextReader.close();
    }
  }
  if(cb) cb(text) 
  return text;
}

(function(){
	if(!window.exports){
		var exports = {};
		window.util = exports;
	}

	exports.getDomain = getDomain;
	exports.stripUrlProtocol = stripUrlProtocol;
	exports.stringStartsWith = stringStartsWith;
	exports.alert = alert;
	exports.prompt = prompt;
	exports.pickFile = pickFile;
	exports.readTextFromFile = readTextFromFile;
})();
