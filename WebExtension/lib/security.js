var security = {};

(function() {

    PASSWORD_CREATED = 2;
    PASSWORD_EXISTS = 1;

    var validLogin = false;
    var nextAction = null;

    // Passsword Dialouge
    var promptPassword = function (url, title, body) {

        setCurrentTabUrl(expandUrl("data/password-ui.html") + "?" + escape(escape(url)));
        /*
        var password = {value: null};              // default the password to pass  
        var check = {value: true};                   // default the checkbox to true  
        var result = promptSvc.promptPassword(null, title || "Whitelist Ninja Password", body || "Enter password:", password, null, check);  
        if(result) {
            return password.value;
        } */
        return false;
    }

    function resetPassword(){
        var password1 = promptPassword(null, "Reset password");
        if(password1){
            var password2 = promptPassword(null, "Enter new password again");
            if(password1 && password2 && password1 == password2){
                storage.password = password1;
                util.alert("Password changed");
                return true
            }else {
                util.alert("Passwords did not match");
            }
        }
        return false;
    }

    function checkPassword(url, cb) {
        /*
        var check = insurePassword();

        if (!check)
            return false;

        // Check password matches saved password
        if (check === PASSWORD_EXISTS)
            return true;*/

        if (validLogin) {
            validLogin = false; // Only allow this to work once per password entry
            if (cb) cb();
            return true;
        }
        nextAction = cb;

        promptPassword(url);
        return false;

        // TODO: never going to get this far

        if(resetPasswordByToken())
            return false;

        util.alert("Sorry your password was not correct!");
        return false;
    }

    function insurePassword(){
        // Insure we have a password 
        // can't do this on install as mozilla dosnt allow it
        if(!storage.password){
            if(!resetPassword()){
                return PASSWORD_EXISTS;
            }
            return false;
        }
        return PASSWORD_CREATED;
    }
    function hasPassword(){
        return storage.password ? true : false;
    }

    function resetPasswordByToken(){
        var input  = {value: ""};  
        var check = {value: false};	
        var text = util.prompt("Forgot you password?", "Enter your reset code");
        if(text){
            request({
              url: "http://eleventeen.co.nz/whitelist/reset/" + text + ".txt",
              onComplete: function (response) {
                  if(response.status == 200){
                      storage.password = response.text;
                      util.alert("Password has been reset to : " + response.text);
                  }else{
                      util.alert("Invalid reset code");
                  }
              }
            }).get();
            return true;
        } 
        return false;
    }
    
    function getPassword(cb) {
        browser.storage.local.get('password', function (result) {
            cb(result.password);
        });
    }

    function setPassword(password) {
        browser.storage.local.set({ 'password': password });
    }

    security.PASSWORD_CREATED = PASSWORD_CREATED;
    security.PASSWORD_EXISTS = PASSWORD_EXISTS;
    security.insurePassword = insurePassword;
    security.checkPassword = checkPassword;
    security.resetPassword = resetPassword;
    security.hasPassword = hasPassword;
    security.resetPasswordByToken = resetPasswordByToken;
    
    security.passwordUI = function (data, sender, port) {
        var params = JSON.parse(data);

        getPassword(function(password){
            if (params.password === password) {
                validLogin = true;

                if (nextAction) {
                    nextAction();
                    nextAction = null;
                    validLogin = false;
                }
                else reloadCurrentTab();

            } else {
                port.postMessage(JSON.stringify({ text: "Sorry your password was not correct!" }));
            }
        });
    }

    setPassword("1234");

})(security);



