import { useStateLink } from "@hookstate/core";
import React from "react";
import { Button } from "@blueprintjs/core";
import { SKELETON } from "@blueprintjs/core/lib/cjs/common/classes";

import { parse } from "url";
import { remote } from "electron";
import qs from "qs";
import log from "electron-log";

const GOOGLE_AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

// https://developers.google.com/identity/protocols/oauth2/native-app#request-parameter-redirect_uri
function getRedirectUri(clientId) {
  return `com.googleusercontent.apps.${clientId.split(".")[0]}:/oauth2redirect`;
}

function signInWithPopup(clientId, { scope }) {
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
      scope,
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

    authWindow.webContents.on("did-get-redirect-request", (event, oldUrl, newUrl) =>
      handleNavigation(newUrl)
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
    log.error(e);
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
    log.error(e);
  }
}

async function googleSignIn(clientId, { scope }) {
  const code = await signInWithPopup(clientId, { scope });
  return fetchAccessTokens(clientId, code);
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
    log.error(e);
  }
}

export function hasCorrectTokens(configuration) {
  const { clientId, refreshToken } = configuration;
  return !!(clientId && refreshToken);
}

export async function ensureAccessToken(
  configurationState,
  { logInIfUnauthorized = true, scope } = {}
) {
  const { clientId, refreshToken, accessToken } = await configurationState.get();

  if (!clientId) {
    return false;
  }

  if (!refreshToken && !logInIfUnauthorized) {
    return false;
  }

  try {
    if (!accessToken) {
      const token = refreshToken
        ? await refreshAccessToken(clientId, refreshToken)
        : await googleSignIn(clientId, { scope });

      if (!refreshToken) {
        configurationState.nested.refreshToken.set(token.refresh_token);
      }

      configurationState.nested.accessToken.set(token.access_token);
    }

    return true;
  } catch (e) {
    log.error(e);
    return false;
  }
}

export function OauthButton({ disabled, configurationState, scope }) {
  const configuration = useStateLink(configurationState);
  const [isSignedIn, setIsSignedIn] = React.useState(hasCorrectTokens(configuration.get()));

  React.useEffect(() => {
    setIsSignedIn(hasCorrectTokens(configuration.get()));
  });

  async function handleSignoutClick() {
    await revokeRefreshToken(configuration);
    configurationState.nested.refreshToken.set(null);
    configurationState.nested.accessToken.set(null);
  }

  return (
    <div>
      {isSignedIn || isSignedIn === null ? (
        <Button className={isSignedIn === null ? SKELETON : ""} onClick={handleSignoutClick}>
          Sign Out
        </Button>
      ) : (
        <Button
          disabled={disabled}
          onClick={() => ensureAccessToken(configurationState, { scope })}
        >
          Authorize
        </Button>
      )}
    </div>
  );
}

export async function makeGoogleRequest({ configuration, scope, url, shouldRetry = true }) {
  const isAuthorized = await ensureAccessToken(configuration, {
    logInIfUnauthorized: false,
    scope,
  });

  if (!isAuthorized) {
    return;
  }

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${configuration.nested.accessToken.get()}` },
    });

    if (response.status === 401 && shouldRetry) {
      configuration.nested.accessToken.set(null);
      await ensureAccessToken(configuration, { logInIfUnauthorized: false, scope });
      return makeGoogleRequest({ configuration, url, scope, shouldRetry: false });
    }

    return response.json();
  } catch (e) {
    log.error(e);
  }
}

/**
 * Small utility to prevent caching by SWR when using two Google modules
 */
export function hashConfiguration(configuration) {
  const { clientId, refreshToken } = configuration.get();
  return clientId + refreshToken;
}
