import React from "react";
import { Button, FormGroup, InputGroup } from "@blueprintjs/core";
import { notify } from "../../services/notification-service";
import { useStateLink } from "@hookstate/core";
import _ from "lodash";
import PasswordInput from "../../components/password-input";

export default function JiraSettings({ configurationState }) {
  const configuration = useStateLink(configurationState);
  const localState = useStateLink(_.cloneDeep(configuration.get()));

  const { username, password, url } = localState.get();

  async function save(event) {
    event.preventDefault();
    configuration.nested.username.set(username);
    configuration.nested.password.set(password);
    configuration.nested.url.set(url);
    notify("Jira settings saved successfully.");
  }

  return (
    <>
      <form onSubmit={save}>
        <FormGroup label="URL" labelFor="jira-url" labelInfo="(required)">
          <InputGroup
            id="jira-url"
            placeholder="URL (e.g. https://jira.domain.com)"
            value={url || ""}
            onChange={(e) => localState.nested.url.set(e.target.value)}
          />
        </FormGroup>
        <FormGroup label="Username" labelFor="jira-username" labelInfo="(required)">
          <InputGroup
            id="jira-username"
            placeholder="username"
            value={username || ""}
            onChange={(e) => localState.nested.username.set(e.target.value)}
          />
        </FormGroup>
        <FormGroup label="Password" labelFor="jira-password" labelInfo="(required)">
          <PasswordInput
            id="jira-password"
            placeholder="password"
            value={password || ""}
            onChange={(e) => localState.nested.password.set(e.target.value)}
          />
        </FormGroup>
        <Button onClick={save} icon="floppy-disk">
          Save
        </Button>
      </form>
    </>
  );
}
