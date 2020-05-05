# Slack Module

## Authentication
It is done using an API token.
To get one, you need to create a Slack application.
Then go to *Oauth and permissions* and do the following:
 
- enable the correct **user token scopes**: 
  - `emoji:read` (View custom emoji in the workspace)
  - `search:read` (Search the workspace’s content)
  - `users:read` (View people in the workspace)
- click install app
- copy the OAuth Access Token

Eventually we would support use Oauth directly by starting a local server to handle the redirect URL of the Oauth flow.

## Limitations
- Message attachments are not yet supported.
- At the moment, might not work well for workspaces with a lot of channels.

## Resources
- https://api.slack.com/methods/reactions.get
- https://api.slack.com/methods/search.messages
- https://api.slack.com/methods/search.all
