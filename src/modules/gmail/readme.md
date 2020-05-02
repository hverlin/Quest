# Gmail Module

## Authentication
Authentication is done using OAUTH.
We require the https://www.googleapis.com/auth/gmail.readonly scope to be able to list and get a preview of the messages.

You need a client ID. You can obtain a client id by going to https://console.developers.google.com/apis/credentials. 

You will need to create a *client ID for IOS*. This is important as otherwise Google Oauth only supports redirecting to an url.

The Google Drive API needs to be enabled as well:
https://console.developers.google.com/apis/library/gmail.googleapis.com

## Resources
This is using the batch gmail API. Read more about it here:
- https://developers.google.com/gmail/api/guides/batch
