var buttonAllow = document.getElementById("button-allow");
var buttonToggle = document.getElementById("button-toggle");
var spanSite = document.getElementById("span-site");
var aAllSites = document.getElementById("a-all-sites");
var port = browser.runtime.connect({name:"block-ui"});

buttonAllow.addEventListener('click', function onkeyup(event) {
	port.postMessage(JSON.stringify({ method : "domain" }));
}, false);

buttonToggle.addEventListener('click', function onkeyup(event) {
	port.postMessage(JSON.stringify({ toggle : true }));
}, false);

aAllSites.addEventListener('click', function onkeyup(event) {
	port.postMessage(JSON.stringify({ admin : true }));
}, false);

port.onMessage.addListener(function (m) {
	var domain = JSON.parse(m)[0];
	var isAdminPage = (domain == "whitelistninja/");
   	spanSite.textContent = domain || "This Site";
	buttonAllow.style.display = isAdminPage ? "none" : "";  
});

port.postMessage(JSON.stringify({ load: true }));