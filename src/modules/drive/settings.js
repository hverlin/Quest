import React from "react";
import { Button, FormGroup, InputGroup } from "@blueprintjs/core";
import {
  hasCorrectTokens,
  loadGoogleDriveClient,
  revokeRefreshToken,
} from "./auth";
import { notify } from "../../services/notification-service";
import { useStateLink } from "@hookstate/core";
import _ from "lodash";

export function DriveOauthButton({ configurationState }) {
  const configuration = configurationState.get();
  const [isSignedIn, setIsSignedIn] = React.useState(
    hasCorrectTokens(configuration)
  );

  async function handleSignoutClick() {
    await revokeRefreshToken(configuration);
    configurationState.nested.refreshToken.set(null);
    configurationState.nested.accessToken.set(null);
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
        <Button
          onClick={() =>
            loadGoogleDriveClient(configurationState, setIsSignedIn)
          }
        >
          Authorize
        </Button>
      )}
    </div>
  );
}

export default function DriveSettings({ configurationState }) {
  const configuration = useStateLink(configurationState);
  const localState = useStateLink(_.cloneDeep(configuration.get()));

  const { apiKey, clientId } = localState.get();

  async function save(event) {
    event.preventDefault();
    configuration.nested.apiKey.set(apiKey);
    configuration.nested.clientId.set(clientId);
    notify("Google Drive credentials saved successfully.");
  }

  return (
    <>
      <form onSubmit={save}>
        <FormGroup
          label="Client Id"
          labelFor="google-drive-client-id"
          labelInfo="(required)"
        >
          <InputGroup
            id="google-drive-client-id"
            placeholder="Client id"
            value={clientId || ""}
            onChange={(e) => localState.nested.clientId.set(e.target.value)}
          />
        </FormGroup>
        <FormGroup
          label="API Key"
          labelFor="google-drive-api-key"
          labelInfo="(required)"
        >
          <InputGroup
            id="google-drive-api-key"
            placeholder="API key"
            type="password"
            value={apiKey || ""}
            onChange={(e) => localState.nested.apiKey.set(e.target.value)}
          />
        </FormGroup>
        <FormGroup>
          <DriveOauthButton configurationState={configurationState} />
        </FormGroup>
        <Button onClick={save} icon="floppy-disk">
          Save
        </Button>
      </form>
    </>
  );
}
