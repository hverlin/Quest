# Slack Module

## Setup
You or someone in your organization needs to create a Slack application.
Give it the name you want and then go to *Oauth and permissions*:
- enable the correct **user token scopes**: 
  - `emoji:read` (View custom emoji in the workspace)
  - `search:read` (Search the workspace’s content)
  - `users:read` (View people in the workspace)
- click install app
- copy the OAuth Access Token
- Add `http://localhost:9289` as a redirect URI

## Authentication
It is done using Oauth.
You will need the `client_id` and `client_secret`[1] of the Slack application. 
When you click the `Authorize` button, Quest will open a local http server to handle the Oauth flow.

The redirect URI is http://localhost:9289 by default.

[1] The client secret should usually not be shared, but that would require an additional server. 
The alternative would be to add all the users as collaborator to the application, which would also let them access to the client secret anyway.

## Limitations
- Message attachments are not yet supported.
- At the moment, might not work perfectly for workspaces with a lot of channels (10 000+)

## Resources
The application uses the following endpoints:
- https://api.slack.com/methods/channels.list
- https://api.slack.com/methods/admin.emoji.list
- https://api.slack.com/methods/search.messages
