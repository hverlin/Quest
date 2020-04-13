import _ from "lodash";
import React from "react";
import { Button, FormGroup, InputGroup } from "@blueprintjs/core";
import { notify } from "../../services/notification-service";
import { useStateLink } from "@hookstate/core";

export default function ConfluenceSettings({ configurationState }) {
  const configuration = useStateLink(configurationState);
  const localState = useStateLink(_.cloneDeep(configuration.get()));

  const { username, password, url } = localState.get();

  async function save(event) {
    event.preventDefault();
    configuration.nested.username.set(username);
    configuration.nested.password.set(password);
    configuration.nested.url.set(url);
    notify("Confluence settings saved successfully.");
  }

  return (
    <>
      <form onSubmit={save}>
        <FormGroup label="URL" labelFor="confluence-url" labelInfo="(required)">
          <InputGroup
            id="confluence-url"
            placeholder="URL (e.g. https://confluence.domain.com)"
            value={url || ""}
            onChange={(e) => localState.nested.url.set(e.target.value)}
          />
        </FormGroup>
        <FormGroup label="Username" labelFor="confluence-username" labelInfo="(required)">
          <InputGroup
            id="confluence-username"
            placeholder="username"
            value={username || ""}
            onChange={(e) => localState.nested.username.set(e.target.value)}
          />
        </FormGroup>
        <FormGroup label="Password" labelFor="confluence-password" labelInfo="(required)">
          <InputGroup
            id="confluence-password"
            placeholder="password"
            type="password"
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
