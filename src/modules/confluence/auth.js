import {
  getCredential,
  saveCredential,
} from "../../services/credential-service";
import {getSetting, storeSetting} from "../../services/storage-service";

const CONFLUENCE_USERNAME = "confluence-username";
const CONFLUENCE_PASSWORD = "confluence-password";
const CONFLUENCE_URL_KEY = "module.confluence.url";

export function getConfluenceUrl() {
  return getSetting(CONFLUENCE_URL_KEY);
}

export function storeConfluenceUrl(url) {
  storeSetting(CONFLUENCE_URL_KEY, url);
}

export async function getConfluenceCredentials() {
  const [username, password] = await Promise.all([
    getCredential(CONFLUENCE_USERNAME),
    getCredential(CONFLUENCE_PASSWORD),
  ]);
  return { username, password };
}

export async function saveConfluenceCredentials({ username, password }) {
  return Promise.all([
    saveCredential(CONFLUENCE_USERNAME, username),
    saveCredential(CONFLUENCE_PASSWORD, password),
  ]);
}
