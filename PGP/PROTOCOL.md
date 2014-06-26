# Outline and Purpose

The Privly PGP application allows users to securly communicate with
verified identites. It is built on top of Mozilla Persona for identity
verification, and provides a seperate service for public key
distribution and discovery. This document describes how the Privly PGP
application builds on top of Persona for public key distribution and
discovery.

Mozilla Persona allows users to log into supporting websites using
identities signed by an email provider. Any domain that supports email
can also become and Identity Provider and sign identities. Domain who
aren't yet Identity Providers may allow Mozilla to act as a fallback
identity provider on their behalf.

Our application builds on top of the Persona protocol by associating
existing Persona identities with PGP public keys to enable authenticated
and confidential sharing of content.

The BrowserID protocol document should be read over, before continuing
as we interface with the BrowserID protocol and adhear to the same
terminology used by that document as much as possible.

An overview of the BrowserID protocol document can be found at:
<https://developer.mozilla.org/en-US/Persona/Protocol_Overview>


# Privly Protocol Actors

The Privly PGP application involves four actors:

*  Uploading Users (UUs): People that want to upload their PGP public key and
           associated identity to a public directory.
*  Relying Users (RUs): People that want to discover a trusted public key.
*  Directory Provider (DPs): A key-value store for holding associations between
           identities and PGP public keys.
*  Remote Verifier (RV): The service that verifies cryptographic assertions of
           identity.


# Privly Protocol Steps

The Privly PGP application extensions to Persona use, unmodified, the
existing infrastructure for IdPs and remote verifiers. The BrowserID
protocol is extended with three distinct steps:

1. Persona Interception
1. Identity Association
1. Identity Publishing

As a prerequisite, the user should be aware they are
publicly disclosing an IdP-backed identity.


## Persona Interception

When a user logs into any site using Persona the browser intercepts the
user's local Persona data, including the private key (see BrowserID
Assertion Generation) and stores it in context of the extension.
If a user logs into the DP, this step is complete. If the user did not
log into the DP, the user will be requested by the extension to log into
the DP.


## Identity Association

A PGP keypair is then generated for the user.  The browser extension now
has a the private key used to sign the Backed Identity Assertion, as
well as a PGP keypair. The private key is used to sign the PGP public
key. This adds a link in the chain of trust, asserting the identity of
the privly public key.


## Identity Publishing

The signed PGP public key, and the user's email is bundled together and
uploaded to the DP.


## Privly Assertion Verification

Last, the Backed Identity Assertion is added twice to the key-value store. The
first entry is keyed by the email address to allow RUs to discover privly public
keys. The second entry is keyed with the Privly public key to support a RU
locating the email address of a signature from a contact not yet established.

Once these steps are complete the DP returns to the UU the results of the
verification.  Additionally, if there is any error while adding the Backed
Identity Assertion into the key-value store it is included in the return value.


## RU queries DP for public key
Here, the RU wants to discover a public key for an UU. The RU queries the
directory provider with an email address, and receives a list of public keys.


## RU queries RV for validity of keys returned from DP
The RU evaluates all returned keys to see if they are not expired. Those that
are not expired are sent to the RV for verification.


## RU stores key if verified
The keys verified by the RV are then stored locally.


# Appendix

## The Persona Fallback Verifier

Architecturally Persona is built such that verification is performed by a
remote service.  It is the intention of the persona team to incorporate this
natively into the browser. At the time of this writing this is not the case so
we are unable to remove this from the protocol. As the system matures we will
look to incorporate natively into the extension if it is not in the browser.

## The Persona Fallback IdP

What if a user's email provider doesn't support Persona? In that case, the
provisioning step would fail. By convention, the user's browser handles this by
asking a trusted third party, https://login.persona.org/, to certify the user's
identity on behalf of the unsupported domain. After demonstrating ownership of
the address, the user would then receive a certificate issued by the fallback
IdP, login.persona.org, rather than the identity's domain.

DPs follow a similar process when validating the assertion: the DP would
ultimately request the fallback IdP's public key in order to verify the
certificate.


# Use Cases

## Use case 1:
User uploads a Privly public key to the directory provider.

This use case involves the following steps:

1.    Generation of the User Certificate from the browser extension.
1.    Send the certificate to the IdP.
1.    IdP creates an Identity Assertion.
1.    Returns the Identity Assertion to the user.
1.    User uploads the Backed Identity Assertion and PGP public key to the DP.

## Use case 2:
User wants to find the Privly PGP public key associated with an identity
(email address).

1.    User send the DP a specific e-mail address or public key.
1.    Directory provider returns the Backed Identity Assertion along
      with the Privly public key.
1.    The browser extension checks that the Persona public key signed
      the Privly Assertion.
1.    The browser extension sends the Identity Assertion to the verifier.
1.    The verifier evaluates the assertion and responds to the client.
1.    The Privly public key is valid and can now be used.

### Caveat
Because we are unaware of any verifier libraries that can run in the
local context of a browser extension, initially we will not be doing
verification from the browser extension. The first version of our
implementation will make use of a remote verifier.  Eventually we would
like to remove the threat model of trusting a remote verifier resource.

## Expected JSON Request to DP

The DP expects a object containing two things.

  1.   Backed Identity Assertion
  1.   Privly Assertion

These two objects verify that a user's identity:

*  Is associated with the given Privly PGP public key
*  Is a valid email address owned by the user and provided by the IdP.

