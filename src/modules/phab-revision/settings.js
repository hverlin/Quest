import React from "react";
import { Button, FormGroup, InputGroup } from "@blueprintjs/core";
import { notify } from "../../services/notification-service";
import { useStateLink } from "@hookstate/core";
import _ from "lodash";

export default function PhabricatorSettings({ configurationState }) {
  const configuration = useStateLink(configurationState);
  const localState = useStateLink(_.cloneDeep(configuration.get()));
  const { token, url } = localState.get();

  async function save(event) {
    event.preventDefault();
    configuration.nested.token.set(token);
    configuration.nested.url.set(url);
    notify("Phabricator settings saved successfully.");
  }

  return (
    <>
      <form onSubmit={save}>
        <FormGroup label="URL" labelFor="phabricator-url" labelInfo="(required)">
          <InputGroup
            id="phabricator-url"
            placeholder="URL (e.g. https://phabricator.company.com)"
            value={url || ""}
            onChange={(e) => localState.nested.url.set(e.target.value)}
          />
        </FormGroup>
        <FormGroup label="API Token" labelFor="phabricator-token" labelInfo="(required)">
          <InputGroup
            id="phabricator-password"
            placeholder="API Token"
            type="password"
            value={token || ""}
            onChange={(e) => localState.nested.token.set(e.target.value)}
          />
        </FormGroup>
        <Button onClick={save} icon="floppy-disk">
          Save
        </Button>
      </form>
    </>
  );
}
