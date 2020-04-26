import React from "react";
import { Button, FormGroup, InputGroup } from "@blueprintjs/core";
import { hasCorrectTokens, loadGoogleDriveClient, revokeRefreshToken } from "./auth";
import { useStateLink } from "@hookstate/core";
import _ from "lodash";
import { SKELETON } from "@blueprintjs/core/lib/cjs/common/classes";

export function DriveOauthButton({ disabled, configurationState }) {
  const configuration = configurationState.get();
  const [isSignedIn, setIsSignedIn] = React.useState(hasCorrectTokens(configuration));

  React.useEffect(() => {
    setIsSignedIn(hasCorrectTokens(configuration));
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
        <Button disabled={disabled} onClick={() => loadGoogleDriveClient(configurationState)}>
          Authorize
        </Button>
      )}
    </div>
  );
}

// noinspection JSUnusedGlobalSymbols
export default function DriveSettings({ configurationState }) {
  const configuration = useStateLink(configurationState);

  const { clientId } = configuration.get();

  return (
    <>
      <form>
        <FormGroup label="Client Id" labelFor="google-drive-client-id" labelInfo="(required)">
          <InputGroup
            id="google-drive-client-id"
            placeholder="Client id"
            value={clientId || ""}
            onChange={(e) => configuration.nested.clientId.set(e.target.value)}
          />
        </FormGroup>
        <FormGroup>
          <DriveOauthButton
            disabled={!_.isEmpty(clientId)}
            configurationState={configurationState}
          />
        </FormGroup>
      </form>
    </>
  );
}
