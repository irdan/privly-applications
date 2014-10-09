/**
 * @fileOverview Manages the form interaction with remote servers.
 **/

/**
 * The callbacks assign the state of the application.
 *
 * TODO: Fix this documentation
 *
 * This application can be placed into the following states:
 * 1. Pending Login Check: The app is currently requesting the CSRF
 *    token from the remote server. Callback=pendingLogin
 * 2. Failure to login: The user is not currently authenticated with the
 *    remote server. In this state the user is prompted to login.
 *    Callback=loginFailure
 * 3. Pending post: The user can make the post at this point.
 *    Callback=pendingPost
 * 4. submit: the user has submitted the posting form.
 *    Callback=submit
 * 5. Completed post: The remote server has returned a URL. This app should
 *    display it and fire the URL event.
 *    Callback=postCompleted
 */

var callbacks = {

  /**
   * Check if user has set a passed in item
   *
   * @param {string} option A string representing a local storage key.
   * @param {function} callback The function to execute after the value of the
   * option has been acquired. This function should accept as a paremeter the
   * value of the option that was acquired.
   * 
   */
  assureItemIsSet: function(option, callback){
    var value = ls.getItem(option);
    if (value == undefined || value == ""){
      if (option === 'pgp:email'){
        keyManager.promptUserToSetEmail(function(value){
          callback(value);
        });
      }
      else if (option === 'pgp:directoryURL'){
        var default_dirp = "http://dirp.grr.io";
        ls.setItem(option, default_dirp);
        callback(default_dirp);
      }
    } else if (option === 'pgp:directoryURL'){
      // Prepend http:// to dirp if needed
      if (value.indexOf("http://") === -1 &&
          value.indexOf("https://") === -1){
        var updated = "http://" + value;
        ls.setItem(option, updated);
      }
      callback(value);
    } else {
      callback(value);
    }
  },

  /**
   * Check if user has set options
   *
   * @param {function} callback The function to execute after all items have
   * been set.
   */
  checkOptionsSet: function(callback){
    var items = ['pgp:email','pgp:directoryURL'];
    var set = 0;
    var check = function(option){
      callbacks.assureItemIsSet(option, function(value){
        set += 1;
        if (set === items.length){
          callback(true);
        }
      });
    };
    for (var i = 0; i < items.length; i++){
      check(items[i]);
    }
  },

  /**
   * Check if user needs to generate new keys
   */
  checkForKeyManagement: function() {
    keyManager.needPersonaKey(function(persona_need){
      if (persona_need === true){
        keyManager.promptUserToLogin();
      }
      keyManager.needNewKey(function(pgp_need){ 
        if (pgp_need === true){
          keyManager.genPGPKeys(function(outcome){
            callbacks.needToUpload();
          });
        } else {
          callbacks.needToUpload();
        }
      });
    });
  },

  /**
   * Assess if a key needs to be uploaded to dirp.  Call notifier if needed.
   */
  needToUpload: function(){
    var payload = ls.getItem('pgp:payload');
    if (payload !== null ){ // have a stored playload to upload
      var directoryURL = ls.getItem('pgp:directoryURL');
      keyManager.notifyConnectivity(directoryURL);
    }
  },

  /**
   * Populate autocomplete from from localstorage
   *
   * @param {function} callback The function to execute after the list of
   * contacts has been retrieved. This function should accept an array of
   * emails as a paremeter.
   */
  populateToField: function(callback){
    var contacts = ls.getItem('pgp:my_contacts');
    var emails = [];
    for(var email in contacts){
      if (contacts.hasOwnProperty(email)){
        emails.push(email);
      }
    }
    callback(emails);
  },

  /**
   * Modify the text of the missing email notifier and then show it.
   */
  inviteFriendNotifier: function(email){
    var emails = $("#missingEmails").text();
    var whitespace = /^\s+$/mg;  // entire string is whitespace
    if (whitespace.exec(emails) != null) {
      emails = email;
    } else {
      var existing = new RegExp("(\\s|^)"+email+"\\b"); 
      if (existing.exec(emails) === null ){ //already contains the email?
        emails = $("#missingEmails").text() + ", " + email;
      }
    }
    $("#missingEmails").text(emails);
    $("#missingEmails").css({
      "font-size" : "1.1em",
      "font-weight" : "bold"
    });
    $(".dropdown").css({"list-style-type":"none"});
    $("#invite").click(function(){  // Add email to URLs in dropdown
      $("#inviteMenu li a").each(function(){
        var old = $( this ).attr("href");
        var urlemail = encodeURIComponent(emails);
        var updated = old.replace(/\[FRIENDS\]/, urlemail);
        $( this ).attr("href", updated);
      });
    });
    $("#emailInvite").show();
  },

  /**
   * Remove an email address from the autoComplete selection 
   */
  autoCompleteRemove: function(remove){
    $(".select2-search-choice div:last").css({
      "font-size" : "1.1em",
      "font-weight" : "bold"
    });
    $(".select2-search-choice:last").fadeOut(1500, function(){
      var emails = $("#emailAddresses").select2("val");
      var updated = [];
      for (var i = 0; i < emails.length; i++){
        if (emails[i] !== remove){
          updated.push(emails[i]);
        }
      }
      $("#emailAddresses").select2("val", updated);
    });
  },

  /**
   * Highlight an email address in the autoComplete selection 
   */
  autoCompleteHighlight: function(email){
    $(".select2-search-choice:last")
      .css("border","2px solid green")
      .animate({
        "border-width":"1px",
        "border-color":"solid #aaaaaa"
        }, 1000);
  },

  /**
   * Setup and manage autocomplete form
   */
  autoComplete: function(){
    callbacks.populateToField(function(emails){
      $("#emailAddresses").select2({
        placeholder: "Recipients",
        tags: emails,
        tokenSeparators: [" ",","]
      }).on("change", function(change){
        if (change.added !== undefined){               // tag was added
          if (emails.indexOf(change.added.id) === -1){ // tag was new
            var email = change.added.id;
            // Search Remotely, verify and add to local if found
            PersonaPGP.findPubKey(email, function(results){
              if (results === null){ // not found remotely or locally
                callbacks.inviteFriendNotifier(email);
                callbacks.autoCompleteRemove(email);
              } else { // Found, update ui somehow?
                callbacks.autoCompleteHighlight(email);
                // This branch is taken if email is in the directory but the
                // returned keys are expired.
                // TODO: Rewrite findPubKey chain of functions to propagate
                // errors or provide some sort of feedback of this situation.
              }
            });
          }
        }
      });
    });
  },
};
