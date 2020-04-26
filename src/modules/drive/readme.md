# Drive Module

## Authentication
Authentication is done using OAUTH.
We require the https://www.googleapis.com/auth/drive.readonly scope to be able to list and get a preview of the files.

For that you need a client ID. You can obtain a client id by going to https://console.developers.google.com/apis/credentials. 

You will need to create a *client ID for IOS*. This is important as otherwise Google Oauth would redirect try to redirect to url.

## Resources
- https://developers.google.com/drive/api/v3/about-auth
