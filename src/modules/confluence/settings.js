import React from "react";
import { Button, FormGroup, H5, InputGroup } from "@blueprintjs/core";
import {
  getConfluenceCredentials,
  getConfluenceUrl,
  saveConfluenceCredentials,
  storeConfluenceUrl,
} from "./auth";
import { notify } from "../../services/notification-service";

export default function ConfluenceSettings() {
  const [url, setUrl] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");

  React.useEffect(() => {
    async function retrieveCredentials() {
      const { username, password } = await getConfluenceCredentials();
      setUsername(username);
      setPassword(password);
      setUrl(getConfluenceUrl());
    }
    retrieveCredentials();
  }, []);

  async function save(event) {
    event.preventDefault();
    storeConfluenceUrl(url);
    await saveConfluenceCredentials({ username, password });
    notify("Confluence settings saved successfully.");
  }

  return (
    <>
      <H5>Confluence</H5>
      <form onSubmit={save}>
        <FormGroup label="URL" labelFor="confluence-url" labelInfo="(required)">
          <InputGroup
            id="confluence-url"
            placeholder="URL (e.g. https://confluence.domain.com)"
            value={url || ""}
            onChange={(e) => setUrl(e.target.value)}
          />
        </FormGroup>
        <FormGroup
          label="Username"
          labelFor="confluence-username"
          labelInfo="(required)"
        >
          <InputGroup
            id="confluence-username"
            placeholder="username"
            value={username || ""}
            onChange={(e) => setUsername(e.target.value)}
          />
        </FormGroup>
        <FormGroup
          label="Password"
          labelFor="confluence-password"
          labelInfo="(required)"
        >
          <InputGroup
            id="confluence-password"
            placeholder="password"
            type="password"
            value={password || ""}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormGroup>
        <Button onClick={save} icon="floppy-disk">
          Save
        </Button>
      </form>
    </>
  );
}
