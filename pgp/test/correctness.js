/**
 * @fileOverview correctness.js Gives testing code for the show page.
 * This spec is managed by the Jasmine testing library.
 **/
 
describe ("PGP fundamental operations", function() {
  var key_pair;
  
  beforeEach(function(){
    openpgp.init();
    key_pair = openpgp.generate_key_pair(1,2048,"alice","a");
  }):
  
  it("Can create a key pair",function(){
    expect(key_pair instanceof Object).toEqual(true);
    expect(key_pair['privateKey'] instanceof Array).toEqual(true);
    expect(key_pair['privateKeyArmored'] instanceof String).toEqual(true);
    expect(key_pair['publicKeyArmored'] instanceof String).toEqual(true);
  });

  it("Can encrypt a signed message", function(){
    var message = "much secret";
    var publickeys = key_pair['publicKeyArmored'];
    var privatekey = key_pair['privateKeyArmored'];
    var ciphertext = openpgp.write_signed_and_encrypted_message(
          privatekey,publickeys,messagetext);

    expect(ciphertext instanceof String).toEqual(true);
  });
  
  it("Can correctly decrypt a signed message", function(){
    var message = "much secret";
    var publickeys = key_pair['publicKeyArmored'];
    var privatekey = key_pair['privateKeyArmored'];
    var ciphertext = openpgp.write_signed_and_encrypted_message(
          privatekey,publickeys,messagetext);
    var plaintext  = openpgp.read_message(ciphertext);

    expect(plaintext).toEqual(message);
  });
});
