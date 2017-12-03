var isActive = true;//security.hasPassword();
var lastDomain = "";
var lastUrl = "";
var lastCustomHomePage = null;

function adminUI(m, sender, port) {

    function post() {
        port.postMessage(JSON.stringify({
            method: "load",
            whitelist: whitelist.getList(),
            history: whitelist.getHistory(),
            external: whitelist.getExternalList(),
            homepage: whitelist.getHomepage()
        }));
    }

    var data = JSON.parse(m);
    switch (data["method"]) {

        case "load":

            getCurrentTabUrl(null, null, function(url) {
                if (security.checkPassword(url)) {
                    post();
                }
            });
            break;

        case "add":
            whitelist.add("domain", data.domain);
            post();
            break;

        case "save":
            whitelist.setList(data.whitelist);
            whitelist.setExternalList(data.external.active, data.external.url);
            whitelist.setHomepage(data.homepage.active, data.homepage.url);
            port.postMessage(JSON.stringify({ method: "saved" }));
            break;

        case "password":
            security.resetPassword();
            return;

        case "select-external-file":
            var path = util.pickFile();
            if (path) {
                whitelist.setExternalList(true, path);
            }
            break;

        case "select-homepage":
            var path = util.pickFile();
            if (path) {
                whitelist.setHomepage(true, path);
            }
            break;
    }
}


function blockUI(data, sender, port){
    
    var params = JSON.parse(data);

    if (params["load"]) {
        getCurrentTabUrl(null, null, function (url) {
            lastUrl = util.stripUrlProtocol(url);
            lastDomain = util.getDomain(lastUrl);
            port.postMessage(JSON.stringify(lastDomain));
        });
    }
    else if(params["admin"]){
        showAdminPage();
    }
    else if(params["forgotpassword"]){
        security.resetPasswordByToken();
    }
    else if (params["toggle"]) {
        getCurrentTabUrl(null, null, function(url) {
            toggleIsActive(url, function() {
                reloadCurrentTab();
            });
        });
    }
    else {
        getCurrentTabUrl(null, null, function (url) {
            if (security.checkPassword(url, function() {
                console.log("object :: " + JSON.stringify(params));
                whitelist.add(params["method"], cleanUrl(url));
                reloadCurrentTab();
            }));
        });
    }
}

function panelUI(data, sender){
    switch(data){
        case "toggle-active":
            getCurrentTabUrl(null, null, function(url) {
                toggleIsActive(url, function() {
                    reloadCurrentTab();
                    updatePanel();
                });
            });
            break;

        case "toggle-site":

            getCurrentTabUrl(null, null, function(url) {
                lastUrl = util.stripUrlProtocol(url);
                lastDomain = util.getDomain(lastUrl);

                if (whitelist.contains(lastDomain + "*")) {
                    whitelist.remove(lastDomain + "*");
                    if (isActive) {
                        reloadCurrentTab();
                    }
                } else if (security.checkPassword(url, function () {
                    whitelist.add("domain", lastUrl);
                    if (isActive) {
                        // Blockings active, reload new allowed url and hide panel
                        reloadCurrentTab();
                    }
                }));
            });
            break;
        case "admin":
            showAdminPage();
            break;
            
         case "load":
             updatePanel(); 
            break;            
    }
}

function logError(error) {
    console.log(`Error: ${error}`);
}
function logSuccess(object) {
    console.log(`Success: ${object}`);
}

// Update the panel contents
function updatePanel(){
	getCurrentTabUrl(null, null, function(url) {
	    lastUrl = util.stripUrlProtocol(url);
	    lastDomain = util.getDomain(lastUrl);;
        if(panelPort) panelPort.postMessage({ isActive : isActive, isSiteBlocked : !whitelist.contains(lastDomain + "*"), domain : lastDomain });
    });
}

function getLastActiveTab(cb) {
    var querying = browser.tabs.query({ active: true, currentWindow: true });
    querying.then(function (arrayOfTabs) {
         // since only one tab should be active and in the current window at once
        // the return variable should only have one entry
        console.log('querying: ' + arrayOfTabs[0]);
         cb(arrayOfTabs[0]);
    }, logError);
}


function cleanUrl(url) {

    // check if on blocked page
    if (util.stringStartsWith(url, expandUrl("data/block-ui.html")) || util.stringStartsWith(url, expandUrl("data/password-ui.html")))
        return unescape(unescape(url.split('?')[1]));
    
    /*
    if(checkHistory){
        var history = whitelist.getHistory();
        if(history.length > 0){
            return history[history.length-1];
        }
    }*/
    
    return url;
}

function getCurrentTabUrl(tab, checkHistory, cb){
    
    if(tab){
        cb(cleanUrl(tab.url));
    }else{
        getLastActiveTab(function(tab){
            cb(cleanUrl(tab.url));
        });
    }
}

function setCurrentTabUrl(url) {
    //getLastActiveTab(function (tab) {
        console.log("Change Tab Url :: " + url);
        //browser.tabs.update(tab.id, { url: url }).then(logSuccess, logError);
    //});
        browser.tabs.update({ url: url }).then(logSuccess, logError);
}


function showAdminPage() {

    //getCurrentTabUrl(null, null, function(url) {
        var check = security.insurePassword();
        if (check === security.PASSWORD_EXISTS && security.checkPassword(expandUrl("data/admin-ui.html"))) {
            setCurrentTabUrl(expandUrl("data/admin-ui.html"));
        }
    //});
}

function reloadCurrentTab(tab, checkHistory){
	//panel.hide();
    getCurrentTabUrl(tab, checkHistory, function(url) {
        setCurrentTabUrl(url);
    });
    
	//tabs.activeTab.url = url;
	//(tab || tabs.activeTab).reload();
}

function toggleIsActive(url, cb) {

    function complete() {
        isActive = !isActive;
        checkAllTabs();
        toggleHomepage();
        if (cb) cb();
    }

    if (!isActive) complete();
    else security.checkPassword(url, complete);
}

function checkAllTabs() {
    if (isActive) {
        var querying = browser.tabs.query({});
        querying.then(function(tabs) {

            for (var i = 0; i < tabs.length; i++) {
                var tab = tabs[i];
                if (!whitelist.isAllowed(tab.url)) {
                    var blockUrl = expandUrl("data/block-ui.html") + "?" + escape(escape(tab.url));

                    // redirect to block url
                    browser.tabs.update(tab.id, { url: blockUrl }).then(logSuccess, logError);
                }
            }
        }, logError);
    }
}

function toggleHomepage(){
	var homepage = whitelist.getHomepage();
	var currentHomepage = getHomepage();
	if(isActive){
		// Save original homepage
		if(currentHomepage != homepage.url && currentHomepage != lastCustomHomePage)
			whitelist.setOriginalHomepage(currentHomepage);
		
		// Set to locked home page
		if(homepage.active && homepage.url && homepage.url != currentHomepage){
			lastCustomHomePage = homepage.url;
			setHomepage(homepage.url);
		}
	}else{
		// Restore original home page
		if(homepage.active && homepage.original && homepage.original != currentHomepage){
			setHomepage(homepage.original);
		}
	}	
}

whitelist.init();