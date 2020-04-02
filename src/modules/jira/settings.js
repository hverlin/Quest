import React from "react";
import { Button, FormGroup, H5, InputGroup } from "@blueprintjs/core";
import {
  getJiraCredentials,
  getJiraUrl,
  saveJiraCredentials,
  storeJiraUrl,
} from "./auth";
import { notify } from "../../services/notification-service";

export default function JiraSettings() {
  const [url, setUrl] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");

  React.useEffect(() => {
    async function retrieveCredentials() {
      const { username, password } = await getJiraCredentials();
      setUsername(username);
      setPassword(password);
      setUrl(getJiraUrl());
    }

    retrieveCredentials();
  }, []);

  async function save(event) {
    event.preventDefault();
    storeJiraUrl(url);
    await saveJiraCredentials({ username, password });
    notify("Jira settings saved successfully.");
  }

  return (
    <>
      <H5>JIRA</H5>
      <form onSubmit={save}>
        <FormGroup label="URL" labelFor="jira-url" labelInfo="(required)">
          <InputGroup
            id="jira-url"
            placeholder="URL (e.g. https://jira.domain.com)"
            value={url || ""}
            onChange={(e) => setUrl(e.target.value)}
          />
        </FormGroup>
        <FormGroup
          label="Username"
          labelFor="jira-username"
          labelInfo="(required)"
        >
          <InputGroup
            id="jira-username"
            placeholder="username"
            value={username || ""}
            onChange={(e) => setUsername(e.target.value)}
          />
        </FormGroup>
        <FormGroup
          label="Password"
          labelFor="jira-password"
          labelInfo="(required)"
        >
          <InputGroup
            id="jira-password"
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
