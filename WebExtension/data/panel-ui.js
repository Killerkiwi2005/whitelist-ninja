var buttonToggle = document.getElementById("button-toggle");
var spanDomain = document.getElementById("span-domain");
var divStatus = document.getElementById("div-status");
var buttonToggleSite = document.getElementById("button-toggle-site");
var aAllSites = document.getElementById("a-all-sites");
var divSite = document.getElementById("div-site");
var ninjaImage = document.getElementById("img-ninja");
var port = browser.runtime.connect({name:"panel-ui"});

buttonToggle.addEventListener('click', function onkeyup(event) {
    emit("toggle-active");
    window.close();
}, false);

buttonToggleSite.addEventListener('click', function onkeyup(event) {
    emit("toggle-site");
    window.close();
}, false);

aAllSites.addEventListener('click', function onkeyup(event) {
    emit("admin");
    window.close();
}, false);

function onMessage(json) {

    data = json;

	// setup UI
	buttonToggle.textContent = data.isActive ? "Disable Blocking" : "Enable Blocking";
	spanDomain.textContent = data.domain || "allowed location";
	divStatus.textContent = data.isSiteBlocked ? "BLOCKED" : "ALLOWED";
	divStatus.className = data.isSiteBlocked ? "blocked" : "allowed";
	buttonToggleSite.textContent = data.isSiteBlocked ? "Allow Site" : "Block Site";
	buttonToggleSite.className = data.isSiteBlocked ? "button" : "button button-alt2";
	ninjaImage.className = data.isSiteBlocked ? "blocked" : "inactive" 
	buttonToggleSite.style.display = !data.domain ? "none" : "";


	if(!data.domain){
		ninjaImage.className = "inactive"
		divStatus.textContent = "ALLOWED"
		divStatus.className = "allowed";
	}
	if(!data.isActive){
		divStatus.textContent = "BLOCKING IS DISABLED";
	}
};


port.onMessage.addListener(function(message) {

	onMessage(message);
});
// self.port.on("load", func );
function emit(message){
	//self.port.emit("toggle-active");
    port.postMessage(message);
    
}

// Send load event
emit("load");