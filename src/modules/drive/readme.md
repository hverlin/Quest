# Drive Module

## Authentication
Authentication is done using OAUTH.
We require the https://www.googleapis.com/auth/drive.readonly scope to be able to list and get a preview of the files.

You need a client ID. You can obtain a client id by going to https://console.developers.google.com/apis/credentials. 

You will need to create a *client ID for IOS*. This is important as otherwise Google Oauth only supports redirecting to an url.

The Google Drive API needs to be enabled as well:
https://console.developers.google.com/apis/library/drive.googleapis.com

## Limitations
- Due to how the javascript Google API client works, only one Google Drive module is supported at once.
- Google Slides and Google Docs are the only formats that support preview.
- The Google Drive API does not return the total number of results. Therefore, it cannot be displayed.

## Resources
- https://developers.google.com/drive/api/v3/about-auth
