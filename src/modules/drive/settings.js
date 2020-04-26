import React from "react";
import { Button, FormGroup } from "@blueprintjs/core";
import { hasCorrectTokens, loadGoogleDriveClient, revokeRefreshToken } from "./auth";
import { useStateLink } from "@hookstate/core";
import _ from "lodash";
import { SKELETON } from "@blueprintjs/core/lib/cjs/common/classes";
import ConfigurationForm from "../../components/configuration-form";

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

  return (
    <>
      <form>
        <ConfigurationForm
          configuration={configurationState}
          fields={["clientId", "pageSize"]}
          isForm={false}
        />
        <FormGroup>
          <DriveOauthButton
            disabled={_.isEmpty(configuration.nested.clientId.get())}
            configurationState={configurationState}
          />
        </FormGroup>
      </form>
    </>
  );
}
