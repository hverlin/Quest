import React from "react";
import {
  getCredential,
  saveCredential,
} from "../../services/credential-service";
import { Button } from "@blueprintjs/core";

const DRIVE_CLIENT_ID = "drive-client-id";
const DRIVE_API_KEY = "drive-api-key";

const DISCOVERY_DOCS = [
  "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
];

const SCOPES = "https://www.googleapis.com/auth/drive.metadata.readonly";

export async function saveDriveCredentials({ clientId, apiKey }) {
  return Promise.all([
    saveCredential(DRIVE_CLIENT_ID, clientId),
    saveCredential(DRIVE_API_KEY, apiKey),
  ]);
}

export async function getDriveCredentials() {
  const [clientId, apiKey] = await Promise.all([
    getCredential(DRIVE_CLIENT_ID),
    getCredential(DRIVE_API_KEY),
  ]);
  return { clientId, apiKey };
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

export async function loadGoogleDriveClient(onSignedIn) {
  insertGoogleDriveApiClientScript();
  await waitForGoogleClient();

  window.gapi.load("client:auth2", async function initClient() {
    const { clientId, apiKey } = await getDriveCredentials();

    if (!clientId || !apiKey) {
      return;
    }

    try {
      await window.gapi.client.init({
        apiKey,
        clientId,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES,
      });

      window.gapi.auth2.getAuthInstance().isSignedIn.listen(onSignedIn);

      // Handle the initial sign-in state.
      onSignedIn(window.gapi.auth2.getAuthInstance().isSignedIn.get());
    } catch (e) {
      console.error(e);
    }
  });
}

export function DriveOauth() {
  const [isSignedIn, setIsSignedIn] = React.useState(null);

  React.useEffect(() => {
    loadGoogleDriveClient(setIsSignedIn);
  }, []);

  function handleAuthClick() {
    window.gapi.auth2.getAuthInstance().signIn();
  }

  function handleSignoutClick() {
    window.gapi.auth2.getAuthInstance().signOut();
  }

  if (isSignedIn == null) {
    return <Button disabled>Checking status...</Button>;
  }

  return (
    <div>
      {isSignedIn === false && (
        <Button onClick={handleAuthClick}>Authorize</Button>
      )}
      {isSignedIn === true && (
        <Button onClick={handleSignoutClick}>Sign Out</Button>
      )}
    </div>
  );
}
