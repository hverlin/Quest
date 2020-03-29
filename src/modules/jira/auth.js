import {
  getCredential,
  saveCredential,
} from "../../services/credential-service";

import { getSetting, storeSetting } from "../../services/storage-service";

const JIRA_USERNAME = "jira-username";
const JIRA_PASSWORD = "jira-password";
const JIRA_URL_KEY = "module.jira.url";

export function getJiraUrl() {
  return getSetting(JIRA_URL_KEY);
}

export function storeJiraUrl(url) {
  storeSetting(JIRA_URL_KEY, url);
}

export async function getJiraCredentials() {
  const [username, password] = await Promise.all([
    getCredential(JIRA_USERNAME),
    getCredential(JIRA_PASSWORD),
  ]);
  return { username, password };
}

export async function saveJiraCredentials({ username, password }) {
  return Promise.all([
    saveCredential(JIRA_USERNAME, username),
    saveCredential(JIRA_PASSWORD, password),
  ]);
}
