import React from "react";
import { Button, FormGroup, H5, InputGroup } from "@blueprintjs/core";
import { getSlackToken, saveSlackToken } from "./auth";
import { notify } from "../../services/notification-service";

export default function SlackSettings() {
  const [token, setToken] = React.useState("");

  React.useEffect(() => {
    async function retrieveCredentials() {
      const token = await getSlackToken();
      setToken(token);
    }
    retrieveCredentials();
  }, []);

  async function save(event) {
    event.preventDefault();
    await saveSlackToken(token);
    notify("Slack settings saved successfully.");
  }

  return (
    <>
      <H5>Slack</H5>
      <form onSubmit={save}>
        <FormGroup
          label="API Token"
          labelFor="slack-token"
          labelInfo="(required)"
        >
          <InputGroup
            id="slack-token"
            placeholder="API token"
            type="password"
            value={token || ""}
            onChange={(e) => setToken(e.target.value)}
          />
        </FormGroup>
        <Button onClick={save} icon="floppy-disk">
          Save
        </Button>
      </form>
    </>
  );
}
