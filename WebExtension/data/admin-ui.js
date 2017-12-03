var inputUrls = document.getElementById("input-urls");
var buttonSave = document.getElementById("button-save");
var buttonPassword = document.getElementById("button-password");
var buttonExternalSelect = document.getElementById("button-external-select");
var inputExternal = document.getElementById("input-external");
var checkboxExternal = document.getElementById("checkbox-external");
var buttonHomepageSelect = document.getElementById("button-homepage-select");
var inputHomepage = document.getElementById("input-homepage");
var checkboxHomepage = document.getElementById("checkbox-homepage");
var spanBlocked = document.getElementById("span-blocked");

var port = browser.runtime.connect({ name: "admin-ui" });

port.onMessage.addListener(function (m) {
    var data = JSON.parse(m);

    switch (data["method"]) {
        case "load":

            var array = data.whitelist;
            array.sort();
            inputUrls.value = array.join('\n');

            while (spanBlocked.firstChild) {
                spanBlocked.removeChild(spanBlocked.firstChild);
            }
            if (data.history) {
                var history = data.history.reverse();
                for (var i = 0; i < history.length; i++) {
                    var div = document.createElement("DIV");
                    div.textContent = history[i];
                    div.className = 'recent';
                    div.setAttribute("data-url", history[i]);
                    div.addEventListener('click', function onkeyup(event) {
                        inputUrls.value += '\n' + event.target.getAttribute("data-url") + '*';
                        save();
                        event.stopPropagation();
                    }, false);

                    spanBlocked.appendChild(div);
                }
            }

            checkboxExternal.checked = data.external.active;
            inputExternal.value = data.external.url;

            checkboxHomepage.checked = data.homepage.active;
            inputHomepage.value = data.homepage.url;

            break;

        case "saved":
            document.location = "#top";
            alert("Settings Saved");
            break;
    }
});


function save(){
    port.postMessage(JSON.stringify(
		{  
			method : "save", 
			whitelist : inputUrls.value.split('\n'),
			external : { active : checkboxExternal.checked, url : inputExternal.value},
			homepage : { active : checkboxHomepage.checked, url : inputHomepage.value}
		}
	));
	
}

buttonSave.addEventListener('click', function onkeyup(event) {
	save();
}, false);

buttonPassword.addEventListener('click', function onkeyup(event) {
    port.postMessage(JSON.stringify({ method: "password" }));
}, false);

buttonExternalSelect.addEventListener('click', function onkeyup(event) {
    port.postMessage(JSON.stringify({ method: "select-external-file" }));
}, false);

buttonHomepageSelect.addEventListener('click', function onkeyup(event) {
    port.postMessage(JSON.stringify({ method: "select-homepage" }));
}, false);

// Load Data
port.postMessage(JSON.stringify({method: "load"}));