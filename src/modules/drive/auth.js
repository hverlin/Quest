import React from "react";
 import { parse } from "url";
import { remote } from "electron";
import qs from "qs";

import {
  deleteCredential,
  getCredential,
  saveCredential,
} from "../../services/credential-service";
import { Button } from "@blueprintjs/core";

const DRIVE_CLIENT_ID = "drive-client-id";
const DRIVE_API_KEY = "drive-api-key";
const DRIVE_REFRESH_TOKEN = "drive-refresh-token";
const DRIVE_ACCESS_TOKEN = "drive-access-token";

const GOOGLE_AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const discoveryDriveV3RestUrl =
  "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";

// https://developers.google.com/identity/protocols/oauth2/native-app#request-parameter-redirect_uri
function getRedirectUri(clientId) {
  return `com.googleusercontent.apps.${clientId.split(".")[0]}:/oauth2redirect`;
}

function signInWithPopup(clientId) {
  return new Promise((resolve, reject) => {
    const authWindow = new remote.BrowserWindow({
      width: 500,
      height: 600,
      show: true,
    });

    const authUrl = `${GOOGLE_AUTHORIZATION_URL}?${qs.stringify({
      response_type: "code",
      redirect_uri: getRedirectUri(clientId),
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/drive.metadata.readonly",
    })}`;

    function handleNavigation(url) {
      const { query } = parse(url, true);
      if (!query) {
        return;
      }

      if (query.error) {
        reject(new Error(`There was an error: ${query.error}`));
      } else if (query.code) {
        // Login is complete
        authWindow.removeAllListeners("closed");
        setImmediate(() => authWindow.close());

        // This is the authorization code we need to request tokens
        resolve(query.code);
      }
    }

    authWindow.on("closed", () => {
      throw new Error("Auth window was closed by user");
    });

    authWindow.webContents.on("will-navigate", (event, url) => {
      handleNavigation(url);
    });

    authWindow.webContents.on(
      "did-get-redirect-request",
      (event, oldUrl, newUrl) => handleNavigation(newUrl)
    );

    authWindow.loadURL(authUrl);
  });
}

async function refreshAccessToken(clientId, refreshToken) {
  try {
    const response = await fetch(`${GOOGLE_TOKEN_URL}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: qs.stringify({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
      }),
    });

    return await response.json();
  } catch (e) {
    console.error(e);
  }
}

async function fetchAccessTokens(clientId, code) {
  try {
    const response = await fetch(`${GOOGLE_TOKEN_URL}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: qs.stringify({
        code,
        client_id: clientId,
        redirect_uri: getRedirectUri(clientId),
        grant_type: "authorization_code",
      }),
    });

    return await response.json();
  } catch (e) {
    console.error(e);
  }
}

async function googleSignIn(clientId) {
  const code = await signInWithPopup(clientId);
  return fetchAccessTokens(clientId, code);
}

export async function saveDriveCredentials({ clientId, apiKey }) {
  return Promise.all([
    saveCredential(DRIVE_CLIENT_ID, clientId),
    saveCredential(DRIVE_API_KEY, apiKey),
  ]);
}

export async function removeAccessToken() {
  return deleteCredential(DRIVE_ACCESS_TOKEN);
}

export async function removeRefreshToken() {
  return deleteCredential(DRIVE_REFRESH_TOKEN);
}

export async function getDriveCredentials() {
  const [clientId, apiKey, refreshToken, accessToken] = await Promise.all([
    getCredential(DRIVE_CLIENT_ID),
    getCredential(DRIVE_API_KEY),
    getCredential(DRIVE_REFRESH_TOKEN),
    getCredential(DRIVE_ACCESS_TOKEN),
  ]);
  return { clientId, apiKey, refreshToken, accessToken };
}

function insertGoogleDriveApiClientScript() {
  const scriptId = "google-drive-api-client";
  if (document.getElementById(scriptId)) {
    return;
  }

  const script = document.createElement("script");
  script.setAttribute("src", "https://apis.google.com/js/api.js");
  script.setAttribute(
    "onreadystatechange",
    "if (this.readyState === 'complete') this.onload()"
  );
  script.setAttribute("id", scriptId);
  document.body.appendChild(script);
}

function waitForGoogleClient() {
  return new Promise((resolve) => {
    function checkGoogleClient() {
      if (window.gapi) {
        return resolve();
      }
    }

    checkGoogleClient();

    setTimeout(checkGoogleClient, 1000);
  });
}

async function revokeRefreshToken() {
  const token = await getCredential(DRIVE_REFRESH_TOKEN);
  if (!token) {
    return;
  }

  try {
    // https://developers.google.com/identity/protocols/oauth2/web-server#tokenrevoke
    await fetch(`https://oauth2.googleapis.com/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: qs.stringify({ token }),
    });
  } catch (e) {
    console.error(e);
  }

  return removeRefreshToken();
}

export async function hasCorrectTokens() {
  const { clientId, apiKey, refreshToken } = await getDriveCredentials();
  return !!(clientId && apiKey && refreshToken);
}

async function ensureGoogleClientLoaded() {
  insertGoogleDriveApiClientScript();
  await waitForGoogleClient();
}

export async function loadGoogleDriveClient(
  onSignedIn,
  { logInIfUnauthorized = true } = {}
) {
  await ensureGoogleClientLoaded();

  window.gapi.load("client:auth2", async function initClient() {
    const {
      clientId,
      apiKey,
      refreshToken,
      accessToken,
    } = await getDriveCredentials();

    if (!clientId || !apiKey) {
      return onSignedIn(false);
    }

    if(!refreshToken && !logInIfUnauthorized) {
      return onSignedIn(false)
    }

    try {
      if (!accessToken) {
        const token = refreshToken
          ? await refreshAccessToken(clientId, refreshToken)
          : await googleSignIn(clientId);

        if (!refreshToken) {
          await saveCredential(DRIVE_REFRESH_TOKEN, token.refresh_token);
        }

        await saveCredential(DRIVE_ACCESS_TOKEN, token.access_token);
      }

      const token = await getCredential(DRIVE_ACCESS_TOKEN);

      window.gapi.client.setApiKey(apiKey);
      window.gapi.client.setToken({ access_token: token });
      await window.gapi.client.load(discoveryDriveV3RestUrl);

      onSignedIn(true);
    } catch (e) {
      onSignedIn(false);
      console.error(e);
    }
  });
}

export function DriveOauthButton() {
  const [isSignedIn, setIsSignedIn] = React.useState(null);

  React.useEffect(() => {
    async function checkStatus() {
      const hasToken = await hasCorrectTokens();
      setIsSignedIn(hasToken);
    }

    checkStatus();
  });

  async function handleSignoutClick() {
    await Promise.all([removeAccessToken(), revokeRefreshToken()]);
    setIsSignedIn(false);
  }

  return (
    <div>
      {isSignedIn || isSignedIn === null ? (
        <Button
          className={isSignedIn === null ? "bp3-skeleton" : ""}
          onClick={handleSignoutClick}
        >
          Sign Out
        </Button>
      ) : (
        <Button onClick={() => loadGoogleDriveClient(setIsSignedIn)}>
          Authorize
        </Button>
      )}
    </div>
  );
}
