/**
 * @fileOverview Privly Application specific code.
 * This file modifies the privly-web adapter found
 * in the shared directory.
 **/

/**
 * Display rendered markdown as a preview of the post.
 */
function previewMarkdown() {
  $( "#preview" ).html(markdown.toHTML($( "#content" ).val()));
}

/**
 * The user submitted the form so the content will be sent to the remote server.
 */
function save() {
  var plaintext = $("#content")[0].value;
  var emails = $("#emailAddresses").val();
  emails = emails.split(",");

  PersonaPGP.encrypt(emails, plaintext, function(ciphertext) {
    callbacks.postSubmit(ciphertext, 
      "PGP", 
      $( "#seconds_until_burn" ).val(), 
      "");
  });
}


/**
 * Initialize the application
 */
function initializeApplication() {
  
  // Generate the previewed content
  var contentElement = document.getElementById("content");
  contentElement.addEventListener('keyup', previewMarkdown);

  // Initialize the application
  callbacks.pendingLogin();

  callbacks.checkOptionsSet( callbacks.checkForKeyManagement );

  // Monitor the submit button
  document.querySelector('#save').addEventListener('click', save);
  
  // Make all text areas auto resize to show all their contents
  $('textarea').autosize();
}

document.addEventListener('DOMContentLoaded', initializeApplication);
