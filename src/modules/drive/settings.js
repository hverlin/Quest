import React from "react";
import { Button, FormGroup, H5, InputGroup } from "@blueprintjs/core";
import { DriveOauthButton, getDriveCredentials, saveDriveCredentials } from "./auth";
import { notify } from "../../services/notification-service";

export default function DriveSettings() {
  const [clientId, setClientId] = React.useState("");
  const [apiKey, setApiKey] = React.useState("");

  React.useEffect(() => {
    async function retrieveCredentials() {
      const { apiKey, clientId } = await getDriveCredentials();
      setApiKey(apiKey);
      setClientId(clientId);
    }
    retrieveCredentials();
  }, []);

  async function save(event) {
    event.preventDefault();
    await saveDriveCredentials({ apiKey, clientId });
    notify("Google Drive credentials saved successfully.");
  }

  return (
    <>
      <H5>Google Drive</H5>
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
            onChange={(e) => setClientId(e.target.value)}
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
            onChange={(e) => setApiKey(e.target.value)}
          />
        </FormGroup>
        <FormGroup>
          <DriveOauthButton />
        </FormGroup>
        <Button onClick={save} icon="floppy-disk">
          Save
        </Button>
      </form>
    </>
  );
}
