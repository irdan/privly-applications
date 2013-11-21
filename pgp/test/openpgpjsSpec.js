/**
 * @fileOverview openpgpjsSpec.js provides a basic POC test for openpgp.js
 * This spec is managed by the Jasmine testing library.
 **/

function loadJs(filename){
  var fileref= document.createElement('script');
  fileref.setAttribute("type","text/javascript");
  fileref.setAttribute("src",filename);
  if (typeof fileref !== "undefined"){
    //console.log(document.getElementsByTagName("head")[0]);
    document.getElementsByTagName("head")[0].appendChild(fileref);
  }
}
loadJs("vendor/openpgp.min.js");
loadJs("vendor/jquery.min.js");

 
setTimeout(function(){
describe ("openpgp POC", function() {
  var key_pair;
  
  beforeEach(function(){
    openpgp.init();
    key_pair = openpgp.generate_key_pair(1,2048,"alice","a");
  });
  
  it("Can create a key pair",function(){
    //console.log(key_pair);
    expect(key_pair.constructor == Object).toEqual(true);
    expect(key_pair['privateKey'].constructor == openpgp_msg_privatekey).toEqual(true);
    expect(key_pair['privateKeyArmored'].constructor == String).toEqual(true);
    expect(key_pair['publicKeyArmored'].constructor  == String).toEqual(true);
  });

  it("Can encrypt a message", function(){
    var messagetext = "much secret";
    var publickeys = openpgp.read_privateKey(key_pair['publicKeyArmored']);
    var ciphertext = openpgp.write_encrypted_message(
          publickeys,messagetext);

    console.log(ciphertext);
    expect(ciphertext.constructor ==  String).toEqual(true);
  });
  
  it("Can correctly decrypt an encrypted message", function(){
    var messagetext = "much secret";
    var publickeys = key_pair['publicKeyArmored'];
    var ciphertext = openpgp.write_encrypted_message(
          publickeys,messagetext);
    var plaintext  = openpgp.read_message(ciphertext);

    expect(plaintext).toEqual(messagetext);
  });
});
(function(){
  var jasmineEnv = jasmine.getEnv();
  jasmineEnv.updateInterval = 2500;
  var console = new jasmine.ConsoleReporter();
  jasmineEnv.addReporter(console);
  jasmineEnv.execute();
})();
},500);
