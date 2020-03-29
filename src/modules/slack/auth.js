import {
  getCredential,
  saveCredential,
} from "../../services/credential-service";

const SLACK_TOKEN = "slack-token";

export async function getSlackToken() {
  return getCredential(SLACK_TOKEN);
}

export async function saveSlackToken(token) {
  return saveCredential(SLACK_TOKEN, token);
}
