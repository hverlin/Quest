# Slack Module

## Authentication
It is done using an API token.
To get one, you need to create a Slack application.

Then go to oauth and permissions:
- enable the correct user token scopes: 
    - channels:history
    - channels:read
    - emoji:read
    - search:read
    - users:read
- click install app
- copy the OAuth Access Token

Eventually we would need to use oauth directly by starting a local server locally to handle the redirect URL of the Oauth flow.

## Resources
- https://api.slack.com/methods/reactions.get
- https://api.slack.com/methods/search.messages
- https://api.slack.com/methods/search.all
