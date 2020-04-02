import React from "react";
import { Button, FormGroup, H5, InputGroup } from "@blueprintjs/core";
import { getPaperToken, savePaperToken } from "./auth";
import { notify } from "../../services/notification-service";

export default function PaperSettings() {
  const [token, setToken] = React.useState("");

  React.useEffect(() => {
    async function retrieveCredentials() {
      const token = await getPaperToken();
      setToken(token);
    }
    retrieveCredentials();
  }, []);

  async function save(event) {
    event.preventDefault();
    await savePaperToken(token);
    notify("Dropbox Paper token saved successfully.");
  }

  return (
    <>
      <H5>Dropbox Paper</H5>
      <form onSubmit={save}>
        <FormGroup
          label="API Token"
          labelFor="dropbox-paper-token"
          labelInfo="(required)"
        >
          <InputGroup
            id="dropbox-paper-token"
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
