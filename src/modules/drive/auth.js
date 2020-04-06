import React from "react";
import { parse } from "url";
import { remote } from "electron";
import qs from "qs";

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

export async function revokeRefreshToken({ refreshToken }) {
  if (!refreshToken) {
    return;
  }

  try {
    // https://developers.google.com/identity/protocols/oauth2/web-server#tokenrevoke
    await fetch(`https://oauth2.googleapis.com/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: qs.stringify({ token: refreshToken }),
    });
  } catch (e) {
    console.error(e);
  }
}

export function hasCorrectTokens(configuration) {
  const { clientId, apiKey, refreshToken } = configuration;
  return !!(clientId && apiKey && refreshToken);
}

async function ensureGoogleClientLoaded() {
  insertGoogleDriveApiClientScript();
  await waitForGoogleClient();
}

export async function loadGoogleDriveClient(
  configurationState,
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
    } = await configurationState.get();

    if (!clientId || !apiKey) {
      return onSignedIn(false);
    }

    if (!refreshToken && !logInIfUnauthorized) {
      return onSignedIn(false);
    }

    try {
      if (!accessToken) {
        const token = refreshToken
          ? await refreshAccessToken(clientId, refreshToken)
          : await googleSignIn(clientId);

        if (!refreshToken) {
          configurationState.nested.refreshToken.set(token.refresh_token);
        }

        configurationState.nested.accessToken.set(token.access_token);
      }

      const { accessToken: token } = configurationState.get();

      window.gapi.client.setApiKey(apiKey);
      window.gapi.client.setToken({ access_token: token });
      await window.gapi.client.load(discoveryDriveV3RestUrl);

      onSignedIn(true);
    } catch (e) {
      console.error(e);
      onSignedIn(false);
    }
  });
}
