var inputPassword = document.getElementById("input-password");
var buttonLogin = document.getElementById("button-login");
var port = browser.runtime.connect({ name: "password-ui" });

buttonLogin.addEventListener('click', function (event) {
    sendLogin();
}, false);

inputPassword.addEventListener('keypress', function inputPassword(event) {
    if (event.which == 13 || event.keyCode == 13) {
        sendLogin();
        return true;
    }
    return true;
}, false);

function sendLogin() {
    port.postMessage(JSON.stringify({ password: inputPassword.value }));
}

inputPassword.focus();

port.onMessage.addListener(function (m) {
    var data = JSON.parse(m);
    alert(data.text);
    inputPassword.value = "";
});

